-- Period scenarios. LOCAL ONLY.
--
-- Runs after dev.sql (seed files run in name order) and builds on its board,
-- houses and current-year period. With Y the current year, it adds:
--
--   Y-2, Y-1  two past periods back to back, each with a year of fees and
--             expenses at older rates (650 and 700 a month), so the report, its
--             period presets and the ledger have history before this year
--   Y+1       no period: a gap. Its days show disabled in every movement date
--             picker and its months are missing from "Registrar cuota"
--   Y+2       a future period at a higher fee, with no movements yet: still
--             editable and deletable, and its edit drawer warns about the gap
--
-- One cross-period case: C1 (the tenant) misses December Y-2 and pays it with
-- January Y-1 on one receipt, at Y-1's rate and with both recargos.
--
-- No periods at all: `npm run db:reset:empty` (only the admin, no dev data).
--
-- Guarded like dev.sql: a no-op on a hosted database, without dev.sql's data,
-- or when it already ran.

-- Same helpers as dev.sql; redefined in case each seed file gets its own session.
create or replace function pg_temp.act_as(u uuid) returns void
language sql
as $act$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$act$;

create or replace function pg_temp.mark(at timestamptz) returns void
language plpgsql
as $mark$
declare
  cur bigint := pg_current_xact_id()::text::bigint;
begin
  update public.audit_log l
  set txid = -g.min_id, occurred_at = at
  from (select min(id) as min_id from public.audit_log where txid = cur) g
  where l.txid = cur;
end;
$mark$;

do $$
declare
  is_local boolean :=
    coalesce(current_setting('app.settings.jwt_secret', true), '')
      = 'super-secret-jwt-token-with-at-least-32-characters-long';

  u_treasurer constant uuid := 'b0000000-0000-4000-8000-000000000002'; -- from dev.sql

  this_year constant int := extract(year from current_date)::int;

  v_year      int;
  v_period_id uuid;
  v_month     date;
  v_months    date[];
  v_house     record;
  -- an older receipt book: dev.sql's runs 0001–0103, and rows sharing a folio
  -- must have been created together
  v_folio     int := 5000;
begin
  if not is_local then
    raise notice 'seeds/periods.sql: not a local database, skipping';
    return;
  end if;

  if not exists (select 1 from auth.users where id = u_treasurer) then
    raise notice 'seeds/periods.sql: dev.sql data missing, skipping';
    return;
  end if;

  if exists (select 1 from public.periods where name = (this_year - 2)::text) then
    raise notice 'seeds/periods.sql: period data already present, skipping';
    return;
  end if;

  perform pg_temp.act_as(u_treasurer);

  -- -------------------------------------------------------------------------
  -- the two past years, as the paper book has them
  -- -------------------------------------------------------------------------
  foreach v_year in array array[this_year - 2, this_year - 1] loop
    insert into public.periods (name, starts_on, ends_on, monthly_fee, late_fee, due_day)
    values (
      v_year::text, make_date(v_year, 1, 1), make_date(v_year, 12, 31),
      case when v_year = this_year - 2 then 650 else 700 end,
      case when v_year = this_year - 2 then 80 else 100 end,
      10
    )
    returning id into v_period_id;
    perform pg_temp.mark(make_date(v_year, 1, 2) + time '10:00');

    for v_month in
      select generate_series(make_date(v_year, 1, 1), make_date(v_year, 12, 1), interval '1 month')::date
    loop
      -- the same houses and habits as this year in dev.sql
      for v_house in
        select * from (values
          ('A1', 3,  'cash'),
          ('A2', 5,  'transfer'),
          ('A3', 8,  'cash'),
          ('B1', 2,  'transfer'),
          ('B2', 9,  'cash'),
          ('C1', 14, 'cash')  -- always after the 10th: the RPC adds the recargo
        ) as v(number, day, method)
        order by v.day
      loop
        -- C1 skips December Y-2 and pays it with January Y-1, below
        continue when v_house.number = 'C1' and v_month = make_date(this_year - 2, 12, 1);

        if v_house.number = 'C1' and v_month = make_date(this_year - 1, 1, 1) then
          v_months := array[make_date(this_year - 2, 12, 1), v_month];
        else
          v_months := array[v_month];
        end if;

        v_folio := v_folio + 1;
        perform public.record_fee_payment(
          (select id from public.properties where number = v_house.number),
          v_months, v_month + (v_house.day - 1), v_folio::text,
          v_house.method::public.payment_method,
          case when v_house.method = 'transfer' then 'SPEI ' || (6600000 + v_folio) end);
        perform pg_temp.mark(v_month + (v_house.day - 1) + time '18:00');
      end loop;

      insert into public.transactions (kind, category_id, period_id, amount, occurred_on, payment_method, description)
      values ('expense', (select id from public.transaction_categories where name = 'Jardinería'), v_period_id,
              case when v_year = this_year - 2 then 1000 else 1100 end, v_month + 4, 'cash', 'Jardinería mensual');
      perform pg_temp.mark(v_month + 4 + time '12:00');

      insert into public.transactions (kind, category_id, period_id, amount, occurred_on, payment_method, reference, description)
      values ('expense', (select id from public.transaction_categories where name = 'Servicios'), v_period_id,
              850 + 35 * extract(month from v_month)::int, v_month + 11, 'transfer', 'CFE ' || to_char(v_month, 'YYYYMM'),
              'Luz de áreas comunes');
      perform pg_temp.mark(v_month + 11 + time '12:00');
    end loop;

    -- one bigger repair a year
    insert into public.transactions (kind, category_id, period_id, amount, occurred_on, payment_method, description)
    values ('expense', (select id from public.transaction_categories where name = 'Mantenimiento'), v_period_id,
            case when v_year = this_year - 2 then 3200 else 2750 end, make_date(v_year, 5, 20), 'cash',
            case when v_year = this_year - 2 then 'Pintura de la barda perimetral' else 'Cambio de la bomba de agua' end);
    perform pg_temp.mark(make_date(v_year, 5, 20) + time '12:00');
  end loop;

  -- -------------------------------------------------------------------------
  -- Y+1 stays empty; the board already set up Y+2
  -- -------------------------------------------------------------------------
  insert into public.periods (name, starts_on, ends_on, monthly_fee, late_fee, due_day)
  values ((this_year + 2)::text, make_date(this_year + 2, 1, 1), make_date(this_year + 2, 12, 31), 900, 120, 10);
  perform pg_temp.mark(now() - interval '6 hours');

  raise notice 'seeds/periods.sql: created periods %, % and %, with a year of history in the first two',
    this_year - 2, this_year - 1, this_year + 2;
end $$;
