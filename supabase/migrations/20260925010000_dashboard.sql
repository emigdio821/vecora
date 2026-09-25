-- Dashboard: who is behind on the fee, and reservations of the common hall.
--
-- house_fee_status
--   One row per live house for the *current* period: how many months are due
--   so far (period start through this month), how many have a fee row, and
--   which months are missing. A house is "pendiente" when unpaid_months is not
--   empty. Empty result when no period covers today.
--
-- hall_reservations
--   The salón is booked by the day, one house per day; the unique index on
--   reserved_on is what makes a double booking impossible. The board records
--   reservations (residents ask in person); every member can see them.

-- ---------------------------------------------------------------------------
-- house_fee_status
-- ---------------------------------------------------------------------------
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

comment on view public.house_fee_status is 'Per live house, fee months due vs paid in the current period. unpaid_months empty = al corriente.';

revoke all on table public.house_fee_status from anon;
grant select on table public.house_fee_status to authenticated;

-- ---------------------------------------------------------------------------
-- hall_reservations
-- ---------------------------------------------------------------------------
create table public.hall_reservations (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  reserved_on date not null,
  notes       text,
  created_by  uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint hall_reservations_notes_not_blank check (notes is null or btrim(notes) <> ''),
  -- one booking per day: the whole point of the table
  constraint hall_reservations_one_per_day unique (reserved_on)
);

comment on table public.hall_reservations is 'Bookings of the common hall (salón), one house per day.';

create index hall_reservations_property_id_idx on public.hall_reservations (property_id);

create trigger hall_reservations_set_updated_at
  before update on public.hall_reservations
  for each row execute function private.set_updated_at();

revoke all on table public.hall_reservations from anon;
grant select, insert, update, delete on table public.hall_reservations to authenticated;

alter table public.hall_reservations enable row level security;

create policy "hall_reservations: members can read"
  on public.hall_reservations for select to authenticated
  using (true);

create policy "hall_reservations: board can insert"
  on public.hall_reservations for insert to authenticated
  with check ((select private.has_role('president')) or (select private.has_role('treasurer')));

create policy "hall_reservations: board can update"
  on public.hall_reservations for update to authenticated
  using ((select private.has_role('president')) or (select private.has_role('treasurer')))
  with check ((select private.has_role('president')) or (select private.has_role('treasurer')));

create policy "hall_reservations: board can delete"
  on public.hall_reservations for delete to authenticated
  using ((select private.has_role('president')) or (select private.has_role('treasurer')));
