-- Treasury: periods, categories and the ledger of money movements.
--
-- Model
--   * A period is the board's fiscal year ("2026-2027") and carries the fee
--     rules for that year: monthly fee, late fee and the day of the month the
--     fee is due. Periods never overlap.
--   * A transaction is one line of money moving in or out: kind income|expense,
--     a category, an amount (always positive; kind gives the sign), the day it
--     happened and the period it belongs to. Balance is derived, never stored.
--   * The monthly fee ("cuota") is income linked to a house via property_id and
--     to the month it covers via fee_month. Paying after the period's due_day
--     adds a late fee ("recargo"), recorded as its *own* row in the late-fee
--     category so sums per category stay trivial and a waived penalty is a row
--     delete, not an amount edit.
--   * folio is the number of the pre-printed paper receipt handed to the
--     resident. Fee + recargo, or several months paid on one ticket, share a
--     folio, so it is indexed but not unique.
--   * fee_month is distinct from occurred_on: a resident paying March on
--     April 3rd has occurred_on = 2026-04-03 and fee_month = 2026-03-01.
--
-- Access: every member reads; treasurer (and admin) writes.
--
-- Deletion: transactions are soft-deleted like the registry, so a mistake can
-- be undone, but they are *never* purged: money questions from years back must
-- stay answerable. Periods and categories are plain rows; categories are
-- retired with is_active = false instead of deleted once used.

-- ---------------------------------------------------------------------------
-- enums
-- ---------------------------------------------------------------------------
create type public.transaction_kind as enum ('income', 'expense');
create type public.payment_method as enum ('cash', 'transfer');

-- ---------------------------------------------------------------------------
-- periods: the board's fiscal year and its fee rules
-- ---------------------------------------------------------------------------
create table public.periods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  starts_on   date not null,
  ends_on     date not null,
  monthly_fee numeric(12,2) not null,
  late_fee    numeric(12,2) not null default 100,
  due_day     smallint not null default 10,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint periods_name_not_blank check (btrim(name) <> ''),
  constraint periods_dates_ordered check (ends_on > starts_on),
  constraint periods_monthly_fee_positive check (monthly_fee > 0),
  constraint periods_late_fee_not_negative check (late_fee >= 0),
  constraint periods_due_day_valid check (due_day between 1 and 28),
  -- two periods can't cover the same day
  constraint periods_no_overlap exclude using gist (daterange(starts_on, ends_on, '[]') with &&)
);

create unique index periods_name_unique on public.periods (lower(name));

comment on table public.periods is 'Fiscal year of the board ("2026-2027") with the fee rules in force during it.';
comment on column public.periods.monthly_fee is 'What each house pays per month during this period, in MXN.';
comment on column public.periods.late_fee is 'Fixed penalty added when a monthly fee is paid after due_day.';
comment on column public.periods.due_day is 'Day of the month the fee is due (inclusive). Capped at 28 so it exists in every month.';

create trigger periods_set_updated_at
  before update on public.periods
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- transaction_categories: treasurer-managed, per kind
-- ---------------------------------------------------------------------------
create table public.transaction_categories (
  id         uuid primary key default gen_random_uuid(),
  kind       public.transaction_kind not null,
  name       text not null,
  -- Stable handle for categories the app itself needs to find (fee, late fee).
  -- Null for treasurer-created ones.
  key        text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transaction_categories_name_not_blank check (btrim(name) <> ''),
  constraint transaction_categories_key_unique unique (key),
  -- system categories can be renamed but not retired
  constraint transaction_categories_system_active check (key is null or is_active),
  -- lets transactions enforce "category kind = transaction kind" with a composite FK
  constraint transaction_categories_id_kind_unique unique (id, kind)
);

create unique index transaction_categories_name_unique
  on public.transaction_categories (kind, lower(name));

comment on table public.transaction_categories is 'Income / expense categories. Retire with is_active = false; rows referenced by transactions cannot be deleted.';
comment on column public.transaction_categories.key is 'App-known handle (fee, late_fee). Null for user-defined categories.';

create trigger transaction_categories_set_updated_at
  before update on public.transaction_categories
  for each row execute function private.set_updated_at();

insert into public.transaction_categories (kind, name, key) values
  ('income',  'Cuota de mantenimiento', 'fee'),
  ('income',  'Recargo',                'late_fee'),
  ('income',  'Multa',                  null),
  ('income',  'Renta de salón',         null),
  ('income',  'Otro ingreso',           null),
  ('expense', 'Mantenimiento',          null),
  ('expense', 'Servicios',              null),
  ('expense', 'Jardinería',             null),
  ('expense', 'Vigilancia',             null),
  ('expense', 'Administración',         null),
  ('expense', 'Otro egreso',            null);

-- ---------------------------------------------------------------------------
-- transactions: the ledger
-- ---------------------------------------------------------------------------
-- History must outlive its endpoints: restrict, not cascade, on every FK.
create table public.transactions (
  id             uuid primary key default gen_random_uuid(),
  kind           public.transaction_kind not null,
  category_id    uuid not null,
  period_id      uuid not null references public.periods (id) on delete restrict,
  property_id    uuid references public.properties (id) on delete restrict,
  amount         numeric(12,2) not null,
  occurred_on    date not null default current_date,
  fee_month      date,
  payment_method public.payment_method not null default 'cash',
  folio          text,
  reference      text,
  description    text not null,
  notes          text,
  created_by     uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  deleted_by     uuid references public.profiles (id) on delete set null,

  constraint transactions_amount_positive check (amount > 0),
  constraint transactions_description_not_blank check (btrim(description) <> ''),
  constraint transactions_folio_not_blank check (folio is null or btrim(folio) <> ''),
  constraint transactions_reference_not_blank check (reference is null or btrim(reference) <> ''),
  -- fee_month is the first day of the month it covers
  constraint transactions_fee_month_first_day check (fee_month is null or extract(day from fee_month) = 1),
  -- a transfer always has something to trace it by
  constraint transactions_transfer_has_reference check (payment_method <> 'transfer' or reference is not null),
  -- a fee month only makes sense for income tied to a house
  constraint transactions_fee_month_needs_property check (fee_month is null or (kind = 'income' and property_id is not null)),
  -- the category must be of the same kind as the row
  constraint transactions_category_fkey
    foreign key (category_id, kind) references public.transaction_categories (id, kind) on delete restrict
);

comment on table public.transactions is 'Ledger of money in and out. One row per receipt line. Soft-deleted via deleted_at; never purged.';
comment on column public.transactions.amount is 'Always positive, in MXN. kind tells whether it adds to or subtracts from the balance.';
comment on column public.transactions.occurred_on is 'Day the money actually moved (may differ from created_at when recorded later).';
comment on column public.transactions.fee_month is 'For monthly fees and their late fees: first day of the month the payment covers.';
comment on column public.transactions.folio is 'Number of the paper receipt given to the resident. Shared by every line on that receipt, so not unique.';
comment on column public.transactions.reference is 'Transfer reference / supplier invoice number. Required for transfers.';

-- listing: newest first within the live rows
create index transactions_live_occurred_on_idx
  on public.transactions (occurred_on desc, created_at desc) where deleted_at is null;
create index transactions_period_id_idx on public.transactions (period_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_property_id_idx on public.transactions (property_id) where property_id is not null;
-- receipt lookup and the future "who hasn't paid month X" view
create index transactions_folio_idx on public.transactions (folio) where folio is not null;
create index transactions_fee_month_property_idx
  on public.transactions (fee_month, property_id) where fee_month is not null and deleted_at is null;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function private.set_updated_at();

create trigger transactions_set_deleted_by
  before update of deleted_at on public.transactions
  for each row execute function private.set_deleted_by();

-- ---------------------------------------------------------------------------
-- summary per period (balance is never stored)
-- ---------------------------------------------------------------------------
-- security_invoker so the caller's RLS applies (otherwise a view runs as its
-- owner, postgres, and would bypass the policies).
create view public.treasury_period_summary
with (security_invoker = true) as
  select
    p.id as period_id,
    coalesce(sum(t.amount) filter (where t.kind = 'income'), 0)::numeric(12,2)  as total_income,
    coalesce(sum(t.amount) filter (where t.kind = 'expense'), 0)::numeric(12,2) as total_expense,
    coalesce(sum(case t.kind when 'income' then t.amount else -t.amount end), 0)::numeric(12,2) as balance
  from public.periods p
  left join public.transactions t on t.period_id = p.id and t.deleted_at is null
  group by p.id;

comment on view public.treasury_period_summary is 'Income, expense and balance per period over live transactions.';

-- ---------------------------------------------------------------------------
-- purge: properties referenced by the ledger are history too
-- ---------------------------------------------------------------------------
create or replace function private.purge_soft_deleted()
returns void
language sql
set search_path = ''
as $$
  delete from public.residents r
  where r.deleted_at < now() - interval '6 months'
    and not exists (
      select 1 from public.property_residents pr where pr.resident_id = r.id
    );

  delete from public.properties p
  where p.deleted_at < now() - interval '6 months'
    and not exists (
      select 1 from public.property_residents pr where pr.property_id = p.id
    )
    and not exists (
      select 1 from public.transactions t where t.property_id = p.id
    );
$$;

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
revoke all on table public.periods from anon;
revoke all on table public.transaction_categories from anon;
revoke all on table public.transactions from anon;
revoke all on table public.treasury_period_summary from anon;

grant select, insert, update, delete on table public.periods to authenticated;
grant select, insert, update, delete on table public.transaction_categories to authenticated;
-- No DELETE on the ledger: "delete" is an UPDATE of deleted_at.
grant select, insert, update on table public.transactions to authenticated;
revoke delete on table public.transactions from authenticated;
grant select on table public.treasury_period_summary to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.periods enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.transactions enable row level security;

-- periods
create policy "periods: members can read"
  on public.periods for select to authenticated
  using (true);

create policy "periods: treasurer can insert"
  on public.periods for insert to authenticated
  with check ((select private.has_role('treasurer')));

create policy "periods: treasurer can update"
  on public.periods for update to authenticated
  using ((select private.has_role('treasurer')))
  with check ((select private.has_role('treasurer')));

create policy "periods: treasurer can delete"
  on public.periods for delete to authenticated
  using ((select private.has_role('treasurer')));

-- transaction_categories
create policy "transaction_categories: members can read"
  on public.transaction_categories for select to authenticated
  using (true);

create policy "transaction_categories: treasurer can insert"
  on public.transaction_categories for insert to authenticated
  with check ((select private.has_role('treasurer')));

create policy "transaction_categories: treasurer can update"
  on public.transaction_categories for update to authenticated
  using ((select private.has_role('treasurer')))
  with check ((select private.has_role('treasurer')));

create policy "transaction_categories: treasurer can delete"
  on public.transaction_categories for delete to authenticated
  using ((select private.has_role('treasurer')));

-- transactions
create policy "transactions: members can read"
  on public.transactions for select to authenticated
  using (true);

create policy "transactions: treasurer can insert"
  on public.transactions for insert to authenticated
  with check ((select private.has_role('treasurer')));

create policy "transactions: treasurer can update"
  on public.transactions for update to authenticated
  using ((select private.has_role('treasurer')))
  with check ((select private.has_role('treasurer')));
