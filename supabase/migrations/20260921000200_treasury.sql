-- Treasury: periods, categories and the ledger of money movements.
--
-- Model
--   * A period is the board's fiscal year ("2026-2027") and carries the fee
--     rules for that year: monthly fee, late fee and the day of the month the
--     fee is due. Periods never overlap.
--   * A transaction is one line of money moving in or out: kind income|expense,
--     a category, an amount (always positive; kind gives the sign), the day it
--     happened and the period it belongs to. Balance is derived, never stored.
--   * The monthly fee is income linked to a house via property_id and to the
--     month it covers via fee_month. Paying after the period's due_day adds a
--     late fee, recorded as its *own* row in the late-fee category so sums per
--     category stay trivial and a waived penalty is a row delete, not an
--     amount edit.
--   * folio is the number of the pre-printed paper receipt handed to the
--     resident. Fee + late fee, or several months paid on one ticket, share a
--     folio; another receipt never reuses it (transactions_folio_one_receipt).
--   * fee_month is distinct from occurred_on: a resident paying March on
--     April 3rd has occurred_on = 2026-04-03 and fee_month = 2026-03-01.
--   * Every amount carries its currency. A row takes settings.currency when
--     it's created, or the currency of the row it comes from (a fee from its
--     period), and keeps it: changing the HOA's currency later doesn't
--     relabel history. Totals are therefore always per currency.
--
-- Access: every member reads; treasurer (and admin) writes. Periods (the
-- board's fiscal year and its fee rules) are managed from the Presidency
-- section, so the president writes them too. The treasurer keeps write access:
-- creating the next cycle is part of closing the books.
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
-- Add one with `alter type public.currency_code add value`.
create type public.currency_code as enum ('MXN', 'USD');

-- ---------------------------------------------------------------------------
-- currency: set once, never changed
-- ---------------------------------------------------------------------------
-- The currency columns default to settings.currency; that default is attached
-- in 20260921000500_settings_and_audit_log.sql, where the settings table is
-- created. Every money table runs this trigger.
create function private.keep_currency()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.currency is distinct from old.currency then
    raise exception 'the currency of a recorded amount never changes' using errcode = '22023';
  end if;
  return new;
end;
$$;

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
  currency    public.currency_code not null,
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
comment on column public.periods.monthly_fee is 'What each house pays per month during this period, in the period''s currency.';
comment on column public.periods.late_fee is 'Fixed penalty added when a monthly fee is paid after due_day.';
comment on column public.periods.due_day is 'Day of the month the fee is due (inclusive). Capped at 28 so it exists in every month.';
comment on column public.periods.currency is 'Currency of the fee rules; the fees paid in this period are recorded in it.';

create trigger periods_set_updated_at
  before update on public.periods
  for each row execute function private.set_updated_at();

create trigger periods_keep_currency
  before update of currency on public.periods
  for each row execute function private.keep_currency();

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
comment on column public.transaction_categories.key is 'App-known handle (fee, late_fee, amenity_fee, amenity_refund). Null for user-defined categories.';

create trigger transaction_categories_set_updated_at
  before update on public.transaction_categories
  for each row execute function private.set_updated_at();

-- Common areas are mostly free; a booking only carries an optional fee (e.g.
-- electricity). One pair for every area (see amenities).
insert into public.transaction_categories (kind, name, key) values
  ('income',  'Cuota de mantenimiento',  'fee'),
  ('income',  'Recargo',                 'late_fee'),
  ('income',  'Multa',                   null),
  ('income',  'Tarifa de área común',    'amenity_fee'),
  ('income',  'Otro ingreso',            null),
  ('expense', 'Reembolso de área común', 'amenity_refund'),
  ('expense', 'Mantenimiento',           null),
  ('expense', 'Servicios',               null),
  ('expense', 'Jardinería',              null),
  ('expense', 'Vigilancia',              null),
  ('expense', 'Administración',          null),
  ('expense', 'Otro egreso',             null);

-- ---------------------------------------------------------------------------
-- transactions: the ledger
-- ---------------------------------------------------------------------------
-- For the folio exclusion constraint (= on text in a gist index).
create extension if not exists btree_gist with schema extensions;

-- History must outlive its endpoints: restrict, not cascade, on every FK.
create table public.transactions (
  id             uuid primary key default gen_random_uuid(),
  kind           public.transaction_kind not null,
  category_id    uuid not null,
  period_id      uuid not null references public.periods (id) on delete restrict,
  property_id    uuid references public.properties (id) on delete restrict,
  amount         numeric(12,2) not null,
  currency       public.currency_code not null,
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
    foreign key (category_id, kind) references public.transaction_categories (id, kind) on delete restrict,
  -- A folio is the number printed on one paper receipt, and the receipt book
  -- never repeats it. Every line of that receipt shares it (a fee and its
  -- late fee, several months paid together), so it can't be a plain unique.
  --
  -- Lines of one receipt are always written together in a single database
  -- transaction (record_fee_payment, or one insert), and now() is fixed per
  -- transaction, so they share created_at. That makes created_at the receipt's
  -- identity here: a folio may repeat only among rows with the same created_at.
  -- Soft-deleted rows free their folio; undoing the delete fails if it was
  -- reused meanwhile.
  constraint transactions_folio_one_receipt
    exclude using gist (folio with =, created_at with <>)
    where (folio is not null and deleted_at is null)
);

comment on table public.transactions is 'Ledger of money in and out. One row per receipt line. Soft-deleted via deleted_at; never purged.';
comment on column public.transactions.amount is 'Always positive, in currency. kind tells whether it adds to or subtracts from the balance.';
comment on column public.transactions.currency is 'Currency of amount, fixed at creation: settings.currency, or the period / reservation / request it comes from.';
comment on column public.transactions.occurred_on is 'Day the money actually moved (may differ from created_at when recorded later).';
comment on column public.transactions.fee_month is 'For monthly fees and their late fees: first day of the month the payment covers.';
comment on column public.transactions.folio is
  'Number of the paper receipt given to the resident. Shared by every line on that receipt, never by two receipts (transactions_folio_one_receipt).';
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

-- One live fee row (and one live late-fee row) per house and month. Waiving a
-- penalty by mistake is fixed by deleting + re-recording, which this allows.
create unique index transactions_one_per_house_month_category
  on public.transactions (property_id, fee_month, category_id)
  where fee_month is not null and deleted_at is null;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function private.set_updated_at();

create trigger transactions_set_deleted_by
  before update of deleted_at on public.transactions
  for each row execute function private.set_deleted_by();

create trigger transactions_keep_currency
  before update of currency on public.transactions
  for each row execute function private.keep_currency();

-- ---------------------------------------------------------------------------
-- summary per period (balance is never stored)
-- ---------------------------------------------------------------------------
-- security_invoker so the caller's RLS applies (otherwise a view runs as its
-- owner, postgres, and would bypass the policies).
--
-- One row per period and currency. A period without movements still gets one
-- row, in its own currency, with zeros.
create view public.treasury_period_summary
with (security_invoker = true) as
  select
    p.id as period_id,
    coalesce(t.currency, p.currency) as currency,
    coalesce(sum(t.amount) filter (where t.kind = 'income'), 0)::numeric(12,2)  as total_income,
    coalesce(sum(t.amount) filter (where t.kind = 'expense'), 0)::numeric(12,2) as total_expense,
    coalesce(sum(case t.kind when 'income' then t.amount else -t.amount end), 0)::numeric(12,2) as balance
  from public.periods p
  left join public.transactions t on t.period_id = p.id and t.deleted_at is null
  group by p.id, coalesce(t.currency, p.currency);

comment on view public.treasury_period_summary is 'Income, expense and balance per period and currency over live transactions.';

-- ---------------------------------------------------------------------------
-- house_fee_status: who is behind on the fee (dashboard)
-- ---------------------------------------------------------------------------
-- One row per live house for the *current* period: how many months are due
-- so far (period start through this month), how many have a fee row, and
-- which months are missing. A house is behind when unpaid_months is not
-- empty. Empty result when no period covers today.
create view public.house_fee_status
with (security_invoker = true) as
with current_period as (
  select id, starts_on, ends_on
  from public.periods
  where current_date between starts_on and ends_on
),
due_months as (
  select
    cp.id as period_id,
    generate_series(
      date_trunc('month', cp.starts_on)::date,
      date_trunc('month', least(current_date, cp.ends_on))::date,
      interval '1 month'
    )::date as fee_month
  from current_period cp
),
fee_category as (
  select id from public.transaction_categories where key = 'fee'
)
select
  pr.id                                               as property_id,
  pr.number,
  dm.period_id,
  count(dm.fee_month)::int                            as months_due,
  count(t.id)::int                                    as months_paid,
  coalesce(
    array_agg(dm.fee_month order by dm.fee_month) filter (where t.id is null),
    '{}'::date[]
  )                                                   as unpaid_months
from public.properties pr
cross join due_months dm
left join public.transactions t
  on t.property_id = pr.id
 and t.fee_month = dm.fee_month
 and t.category_id = (select id from fee_category)
 and t.deleted_at is null
where pr.deleted_at is null
group by pr.id, pr.number, dm.period_id;

comment on view public.house_fee_status is 'Per live house, fee months due vs paid in the current period. unpaid_months empty = up to date.';

-- ---------------------------------------------------------------------------
-- record_fee_payment
-- ---------------------------------------------------------------------------
-- One paper receipt for one house, covering one or more months of the monthly
-- fee, plus the late fee for each month paid after the period's due day.
-- Everything is inserted in one transaction so a receipt is never
-- half-recorded.
--
-- Descriptions read "Cuota Agosto 2026" (the app capitalizes month names);
-- the house is in property_id, and the lists show it in its own column. The
-- rows are in the period's currency, even if settings.currency changed since.
--
-- security invoker: inserts run as the caller, so the treasurer RLS applies.
create function public.record_fee_payment(
  p_property_id    uuid,
  p_fee_months     date[],
  p_occurred_on    date,
  p_folio          text,
  p_payment_method public.payment_method default 'cash',
  p_reference      text default null,
  p_notes          text default null,
  p_period_id      uuid default null,     -- default: the period that contains p_occurred_on
  p_amount         numeric default null,  -- per-month fee; default: the period's monthly_fee
  p_apply_late_fee boolean default null   -- null = by the due-day rule; true/false force it
)
returns table (fee_count integer, late_fee_count integer, total numeric)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_period       public.periods%rowtype;
  v_fee_cat      uuid;
  v_late_cat     uuid;
  v_amount       numeric;
  v_month        date;
  v_is_late      boolean;
  v_months       constant text[] := array['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                                          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  v_label        text;
begin
  if p_fee_months is null or cardinality(p_fee_months) = 0 then
    raise exception 'at least one fee month is required' using errcode = '22023';
  end if;

  if p_payment_method = 'transfer' and nullif(btrim(p_reference), '') is null then
    raise exception 'a transfer needs a reference' using errcode = '22023';
  end if;

  select * into v_period from public.periods
  where id = coalesce(p_period_id, (select id from public.periods where p_occurred_on between starts_on and ends_on));
  if not found then
    raise exception 'no period covers %', p_occurred_on using errcode = 'P0002';
  end if;

  perform 1 from public.properties where id = p_property_id and deleted_at is null;
  if not found then
    raise exception 'property % not found', p_property_id using errcode = 'P0002';
  end if;

  select id into v_fee_cat  from public.transaction_categories where key = 'fee';
  select id into v_late_cat from public.transaction_categories where key = 'late_fee';

  v_amount := coalesce(p_amount, v_period.monthly_fee);
  fee_count := 0;
  late_fee_count := 0;
  total := 0;

  foreach v_month in array p_fee_months loop
    if extract(day from v_month) <> 1 then
      raise exception 'fee month % is not the first day of a month', v_month using errcode = '22023';
    end if;

    v_label := v_months[extract(month from v_month)::int] || ' ' || extract(year from v_month)::int;

    insert into public.transactions
      (kind, category_id, period_id, property_id, amount, currency, occurred_on, fee_month,
       payment_method, folio, reference, description, notes)
    values
      ('income', v_fee_cat, v_period.id, p_property_id, v_amount, v_period.currency, p_occurred_on, v_month,
       p_payment_method, p_folio, p_reference, 'Cuota ' || v_label, p_notes);
    fee_count := fee_count + 1;
    total := total + v_amount;

    -- Due on due_day of the month being paid; anything after that is late.
    v_is_late := coalesce(
      p_apply_late_fee,
      p_occurred_on > make_date(extract(year from v_month)::int, extract(month from v_month)::int, v_period.due_day)
    );

    if v_is_late and v_period.late_fee > 0 then
      insert into public.transactions
        (kind, category_id, period_id, property_id, amount, currency, occurred_on, fee_month,
         payment_method, folio, reference, description)
      values
        ('income', v_late_cat, v_period.id, p_property_id, v_period.late_fee, v_period.currency, p_occurred_on,
         v_month, p_payment_method, p_folio, p_reference, 'Recargo ' || v_label);
      late_fee_count := late_fee_count + 1;
      total := total + v_period.late_fee;
    end if;
  end loop;

  return next;
end;
$$;

comment on function public.record_fee_payment is 'Records one receipt of monthly fees for a house (fee row per month + late fee rows), atomically, under the caller''s RLS.';

revoke execute on function public.record_fee_payment from public, anon;
grant execute on function public.record_fee_payment to authenticated;

-- ---------------------------------------------------------------------------
-- financial_report: everything the PDF needs for a date range, in one call
-- ---------------------------------------------------------------------------
--   * security invoker: runs with the member's own session, so the usual
--     "members can read" policies apply. No new permission surface.
--   * Money is counted by occurred_on (the day it moved). The opening balance
--     is every live movement before the range, across all periods, so the
--     closing balance matches the cash on hand.
--   * Balances and category totals come per currency: one entry in
--     `currencies` for each currency with movements up to the end of the
--     range, the current one first. With no movements at all, a single entry
--     in settings.currency with zeros.
--   * Fee status is counted by fee_month (the month a fee covers), for the
--     months of the range that fall inside a period and have already started.
--     A month counts as paid only if the payment was recorded by the end of
--     the range, so a past report reads the same no matter when it's pulled.
--   * Houses are identified by number only; the report is meant to be shared.
create function public.financial_report(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Rango de fechas inválido' using errcode = '22023';
  end if;

  return (
    with
    tx as (
      select t.kind, t.amount, t.currency, t.occurred_on, c.name as category
      from public.transactions t
      join public.transaction_categories c on c.id = t.category_id
      where t.deleted_at is null and t.occurred_on <= p_to
    ),
    in_range as (
      select * from tx where occurred_on >= p_from
    ),
    currencies as (
      select distinct currency from tx
      union all
      select s.currency from public.settings s where not exists (select 1 from tx)
    ),
    totals as (
      select
        cur.currency,
        coalesce(sum(case tx.kind when 'income' then tx.amount else -tx.amount end)
                 filter (where tx.occurred_on < p_from), 0)::numeric(12,2) as opening,
        coalesce(sum(tx.amount)
                 filter (where tx.kind = 'income' and tx.occurred_on >= p_from), 0)::numeric(12,2) as income,
        coalesce(sum(tx.amount)
                 filter (where tx.kind = 'expense' and tx.occurred_on >= p_from), 0)::numeric(12,2) as expense
      from currencies cur
      left join tx on tx.currency = cur.currency
      group by cur.currency
    ),
    categories as (
      select currency, kind, category, sum(amount)::numeric(12,2) as total, count(*)::int as movements
      from in_range
      group by currency, kind, category
    ),
    -- fee months of the range that belong to a period and have started
    due as (
      select distinct gs::date as fee_month
      from public.periods p
      cross join lateral generate_series(
        date_trunc('month', greatest(p.starts_on, p_from)),
        date_trunc('month', least(p.ends_on, p_to, current_date)),
        interval '1 month'
      ) gs
      where p.starts_on <= p_to and p.ends_on >= p_from
    ),
    house_status as (
      select
        pr.number,
        coalesce(
          array_agg(d.fee_month order by d.fee_month) filter (where paid.id is null),
          '{}'::date[]
        ) as unpaid
      from public.properties pr
      cross join due d
      left join lateral (
        select t.id
        from public.transactions t
        where t.property_id = pr.id
          and t.fee_month = d.fee_month
          and t.category_id = (select id from public.transaction_categories where key = 'fee')
          and t.deleted_at is null
          and t.occurred_on <= p_to
        limit 1
      ) paid on true
      where pr.deleted_at is null
      group by pr.id, pr.number
    )
    select jsonb_build_object(
      'from', p_from,
      'to',   p_to,

      'currencies', (
        select jsonb_agg(jsonb_build_object(
          'currency',        t.currency,
          'opening_balance', t.opening,
          'total_income',    t.income,
          'total_expense',   t.expense,
          'closing_balance', (t.opening + t.income - t.expense)::numeric(12,2),
          'categories', coalesce((
            select jsonb_agg(jsonb_build_object(
              'kind', c.kind, 'name', c.category, 'total', c.total, 'movements', c.movements
            ) order by c.kind, c.total desc, c.category)
            from categories c
            where c.currency = t.currency
          ), '[]'::jsonb)
        ) order by t.currency is distinct from (select s.currency from public.settings s), t.currency)
        from totals t
      ),

      'fee_status', jsonb_build_object(
        'months',     (select count(*) from due),
        'houses',     (select count(*) from house_status),
        'up_to_date', (select count(*) from house_status where unpaid = '{}'),
        'pending', coalesce((
          select jsonb_agg(jsonb_build_object('house', hs.number, 'months', to_jsonb(hs.unpaid))
                           order by hs.number)
          from house_status hs
          where hs.unpaid <> '{}'
        ), '[]'::jsonb)
      )
    )
  );
end;
$$;

comment on function public.financial_report is 'Report for a date range: balances and totals by category per currency, and fee status per house.';

revoke execute on function public.financial_report(date, date) from public, anon;
grant execute on function public.financial_report(date, date) to authenticated;

-- ---------------------------------------------------------------------------
-- purge: hard-delete registry rows soft-deleted more than 6 months ago (nightly)
-- ---------------------------------------------------------------------------
-- Runs as postgres (table owner), so it bypasses RLS.
--
-- Only *unreferenced* rows are purged. A resident or property that appears in
-- any history table (property_residents, the ledger...) is kept forever,
-- hidden, so questions like "who owned 2B in 2024?" or "who was president in
-- 2024?" stay answerable. Add a `not exists` per new history table; the FKs
-- are `on delete restrict` as a second line of defense.
create function private.purge_soft_deleted()
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

revoke execute on function private.purge_soft_deleted() from public, anon, authenticated;

-- https://supabase.com/docs/guides/cron/install
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 03:00 UTC daily
select cron.schedule(
  'purge-soft-deleted-registry',
  '0 3 * * *',
  $$ select private.purge_soft_deleted() $$
);

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
revoke all on table public.periods from anon;
revoke all on table public.transaction_categories from anon;
revoke all on table public.transactions from anon;
revoke all on table public.treasury_period_summary from anon;
revoke all on table public.house_fee_status from anon;

grant select, insert, update, delete on table public.periods to authenticated;
grant select, insert, update, delete on table public.transaction_categories to authenticated;
-- No DELETE on the ledger: "delete" is an UPDATE of deleted_at.
grant select, insert, update on table public.transactions to authenticated;
revoke delete on table public.transactions from authenticated;
grant select on table public.treasury_period_summary to authenticated;
grant select on table public.house_fee_status to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.periods enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.transactions enable row level security;

-- periods: president or treasurer (has_role() already implies admin)
create policy "periods: members can read"
  on public.periods for select to authenticated
  using (true);

create policy "periods: board can insert"
  on public.periods for insert to authenticated
  with check ((select private.has_role('president')) or (select private.has_role('treasurer')));

create policy "periods: board can update"
  on public.periods for update to authenticated
  using ((select private.has_role('president')) or (select private.has_role('treasurer')))
  with check ((select private.has_role('president')) or (select private.has_role('treasurer')));

create policy "periods: board can delete"
  on public.periods for delete to authenticated
  using ((select private.has_role('president')) or (select private.has_role('treasurer')));

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
