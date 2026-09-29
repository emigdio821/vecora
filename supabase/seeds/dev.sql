-- Development data. LOCAL ONLY.
--
-- Runs after seed.sql on `npm run db:reset`. Guarded so it is a no-op on the
-- hosted project even if someone runs `db push --include-seed`.
--
-- Test logins (password for all: "admin"), one per role:
--   admin@vecora.com        admin        (account from seed.sql)
--   president@vecora.com    president
--   treasurer@vecora.com    treasurer
--   security@vecora.com     security
--   maintenance@vecora.com  maintenance
--
-- 10 residents (the 4 board members above + 6 without an account), phones
-- +523139612222 upward. The admin runs the app and is not a resident. 20
-- houses A1–D5; some empty, one resident without a house. One
-- period for the current year with some fee payments, an expense, and a few
-- maintenance / security requests in every status.
--
-- Every step runs *as* the board member who would do it in the app
-- (pg_temp.act_as), so created_by and the "Historial" identity are right, and
-- goes through the real RPCs where the app would. After each step the log rows
-- are stamped with a spread-out time and their own group (pg_temp.mark), so the
-- history reads like 45 days of activity instead of one seed run.

-- Make auth.uid() return this user for the rest of the transaction.
create function pg_temp.act_as(u uuid) returns void
language sql
as $act$
  select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
$act$;

-- Give the log rows written since the previous mark a timestamp and a group of
-- their own (negative so they can't collide with a real transaction id).
create function pg_temp.mark(at timestamptz) returns void
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

  -- fixed ids so the data is stable across resets
  u_admin       constant uuid := 'a0000000-0000-4000-8000-000000000001'; -- from seed.sql
  u_president   constant uuid := 'b0000000-0000-4000-8000-000000000001';
  u_treasurer   constant uuid := 'b0000000-0000-4000-8000-000000000002';
  u_security    constant uuid := 'b0000000-0000-4000-8000-000000000003';
  u_maintenance constant uuid := 'b0000000-0000-4000-8000-000000000004';

  r_roberto constant uuid := 'd0000000-0000-4000-8000-000000000001';
  r_ana     constant uuid := 'd0000000-0000-4000-8000-000000000002';
  r_luis    constant uuid := 'd0000000-0000-4000-8000-000000000003';
  r_maria   constant uuid := 'd0000000-0000-4000-8000-000000000004';
  r_diego   constant uuid := 'd0000000-0000-4000-8000-000000000005';
  r_sofia   constant uuid := 'd0000000-0000-4000-8000-000000000006';
  r_carmen  constant uuid := 'd0000000-0000-4000-8000-000000000007';
  r_pablo   constant uuid := 'd0000000-0000-4000-8000-000000000008';
  r_jorge   constant uuid := 'd0000000-0000-4000-8000-000000000009';
  r_lucia   constant uuid := 'd0000000-0000-4000-8000-000000000010';

  -- the period is the current year; dates are clamped into it
  year_start  constant date := date_trunc('year', current_date)::date;
  year_end    constant date := (date_trunc('year', current_date) + interval '1 year - 1 day')::date;
  this_month  constant date := date_trunc('month', current_date)::date;
  prev_month  constant date := greatest((this_month - interval '1 month')::date, year_start);

  v_period_id      uuid;
  v_maintenance_id uuid;
  v_cameras_id     uuid;

  -- when the seeded activity "happened"; steps below add to it
  t timestamptz := now() - interval '45 days';
begin
  if not is_local then
    raise notice 'seeds/dev.sql: not a local database, skipping';
    return;
  end if;

  if exists (select 1 from auth.users where email = 'president@vecora.com') then
    raise notice 'seeds/dev.sql: dev data already present, skipping';
    return;
  end if;

  -- seed.sql already logged the admin account's creation (as "Sistema") with
  -- today's time; move it to the start of the story
  update public.audit_log set occurred_at = t - interval '1 day', txid = -id where txid > 0;

  -- -------------------------------------------------------------------------
  -- admin seats the board: one account per role (admin already exists)
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as(u_admin);

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  )
  select
    '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
    extensions.crypt('admin', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.full_name), now(), now(),
    '', '', '', '', '', '', '', ''
  from (values
    (u_president,   'president@vecora.com',   'Ana López'),
    (u_treasurer,   'treasurer@vecora.com',   'Luis Fernández'),
    (u_security,    'security@vecora.com',    'María García'),
    (u_maintenance, 'maintenance@vecora.com', 'Diego Martínez')
  ) as u(id, email, full_name);

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), id, id::text, 'email',
         jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
         now(), now(), now()
  from auth.users
  where id in (u_president, u_treasurer, u_security, u_maintenance);

  insert into public.user_roles (user_id, role, granted_by) values
    (u_president,   'president',   u_admin),
    (u_treasurer,   'treasurer',   u_admin),
    (u_security,    'security',    u_admin),
    (u_maintenance, 'maintenance', u_admin);

  perform pg_temp.mark(t);

  -- -------------------------------------------------------------------------
  -- president sets up the residential
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as(u_president);

  update public.settings set residential_name = 'Loma Verde Coto 404';
  t := t + interval '10 minutes';
  perform pg_temp.mark(t);

  -- houses: A1–A5, B1–B5, C1–C5, D1–D5
  insert into public.properties (number)
  select block || n
  from unnest(array['A', 'B', 'C', 'D']) as block, generate_series(1, 5) as n;

  t := t + interval '1 day 2 hours';
  perform pg_temp.mark(t);

  update public.properties set notes = 'Casa de esquina' where number = 'A1';
  t := t + interval '20 minutes';
  perform pg_temp.mark(t);

  update public.properties set notes = 'Rentada' where number = 'C1';
  t := t + interval '5 minutes';
  perform pg_temp.mark(t);

  -- residents: board members are residents with an account + role; the admin is not one
  insert into public.residents (id, profile_id, first_name, last_name, phone, email, notes) values
    (r_roberto, null,         'Roberto', 'Salinas',   '+523139612222', 'roberto@example.com',    null),
    (r_ana,    u_president,   'Ana',     'López',     '+523139612223', 'president@vecora.com',   null),
    (r_luis,   u_treasurer,   'Luis',    'Fernández', '+523139612224', 'treasurer@vecora.com',   null),
    (r_maria,  u_security,    'María',   'García',    '+523139612225', 'security@vecora.com',    null),
    (r_diego,  u_maintenance, 'Diego',   'Martínez',  '+523139612226', 'maintenance@vecora.com', 'Dueño de dos casas'),
    (r_sofia,  null,          'Sofía',   'Rivera',    '+523139612227', null,                     'Pareja de María'),
    (r_carmen, null,          'Carmen',  'Ortega',    '+523139612228', 'carmen@example.com',     'Inquilina en C1'),
    (r_pablo,  null,          'Pablo',   'Ortega',    '+523139612229', null,                     'Hijo de Carmen'),
    (r_jorge,  null,          'Jorge',   'Herrera',   '+523139612230', 'jorge@example.com',      null),
    (r_lucia,  null,          'Lucía',   'Navarro',   '+523139612231', null,                     'Aún sin casa asignada');

  t := t + interval '1 day 1 hour';
  perform pg_temp.mark(t);

  -- who lives / owns where (every other house is empty)
  insert into public.property_residents (property_id, resident_id, relationship)
  select p.id, v.resident_id, v.relationship::public.residency_relationship
  from (values
    ('A1', r_roberto, 'owner'),
    ('A2', r_ana,    'owner'),
    ('A3', r_luis,   'owner'),
    ('A3', r_jorge,  'owner'),   -- co-owners
    ('B1', r_maria,  'owner'),
    ('B1', r_sofia,  'family'),
    ('B2', r_diego,  'owner'),
    ('C1', r_diego,  'owner'),   -- landlord, lives in B2
    ('C1', r_carmen, 'tenant'),
    ('C1', r_pablo,  'family')
    -- Lucía has no house
  ) as v(number, resident_id, relationship)
  join public.properties p on p.number = v.number;

  t := t + interval '40 minutes';
  perform pg_temp.mark(t);

  -- -------------------------------------------------------------------------
  -- treasurer opens the period and starts collecting
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as(u_treasurer);

  insert into public.periods (name, starts_on, ends_on, monthly_fee, late_fee, due_day)
  values (to_char(current_date, 'YYYY'), year_start, year_end, 800, 100, 10)
  returning id into v_period_id;

  t := t + interval '2 days 3 hours';
  perform pg_temp.mark(t);

  -- A1 pays two months in cash on one paper receipt
  perform public.record_fee_payment(
    (select id from public.properties where number = 'A1'),
    array[prev_month, this_month], greatest(current_date - 30, year_start), '0101', 'cash');
  t := t + interval '5 days';
  perform pg_temp.mark(t);

  -- A2 pays this month by transfer
  perform public.record_fee_payment(
    (select id from public.properties where number = 'A2'),
    array[this_month], greatest(current_date - 28, year_start), '0102', 'transfer', 'SPEI 7781234');
  t := t + interval '2 days 4 hours';
  perform pg_temp.mark(t);

  -- B1 pays last month late: the RPC adds the late fee in the same receipt
  perform public.record_fee_payment(
    (select id from public.properties where number = 'B1'),
    array[prev_month], greatest(current_date - 25, year_start), '0103', 'cash', null, null, null, null, true);
  t := t + interval '3 days 1 hour';
  perform pg_temp.mark(t);

  -- an expense typed in directly
  insert into public.transactions (kind, category_id, period_id, amount, occurred_on, payment_method, reference, description, notes)
  values (
    'expense', (select id from public.transaction_categories where name = 'Servicios'), v_period_id,
    1240.50, greatest(current_date - 24, year_start), 'transfer', 'CFE 0045612', 'Luz de áreas comunes', 'Recibo CFE agosto'
  );
  t := t + interval '1 day 30 minutes';
  perform pg_temp.mark(t);

  -- -------------------------------------------------------------------------
  -- maintenance asks, treasurer pays
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as(u_maintenance);

  insert into public.maintenance_requests (title, details, amount, requested_on)
  values ('Pintura para el jardín', 'Dos cubetas de pintura blanca y brochas. Ferretería El Tornillo.', 300,
          greatest(current_date - 20, year_start))
  returning id into v_maintenance_id;
  t := t + interval '4 days 2 hours';
  perform pg_temp.mark(t);

  perform pg_temp.act_as(u_treasurer);

  perform public.pay_maintenance_request(
    v_maintenance_id, (select id from public.transaction_categories where name = 'Mantenimiento'),
    greatest(current_date - 18, year_start), 'cash');
  t := t + interval '2 days 5 hours';
  perform pg_temp.mark(t);

  perform pg_temp.act_as(u_maintenance);

  insert into public.maintenance_requests (title, details, amount, requested_on)
  values ('Cambio de lámparas del pasillo B', '6 focos LED. Pendiente de comprobante.', 450,
          greatest(current_date - 10, year_start));
  t := t + interval '8 days';
  perform pg_temp.mark(t);

  -- -------------------------------------------------------------------------
  -- security asks, treasurer rejects one and leaves one pending
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as(u_security);

  insert into public.security_requests (kind, title, details, amount, requested_on)
  values ('cameras', 'Reparación de cámara del portón A', 'La cámara 3 dejó de grabar de noche.', 1500,
          greatest(current_date - 15, year_start))
  returning id into v_cameras_id;
  t := t + interval '-5 days 3 hours'; -- a bit before the last maintenance request
  perform pg_temp.mark(t);

  perform pg_temp.act_as(u_treasurer);

  perform public.reject_security_request(v_cameras_id, 'Falta cotización del proveedor. Vuelve a enviarla con el presupuesto.');
  t := t + interval '1 day 6 hours';
  perform pg_temp.mark(t);

  perform pg_temp.act_as(u_security);

  insert into public.security_requests (kind, title, details, amount, requested_on)
  values ('guards', 'Turno extra del fin de semana', 'Guardia adicional por la fiesta de la terraza.', 900,
          greatest(current_date - 5, year_start));
  t := now() - interval '5 days 2 hours';
  perform pg_temp.mark(t);

  -- -------------------------------------------------------------------------
  -- president: a booking, an edit, a delete that gets undone
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as(u_president);

  insert into public.hall_reservations (property_id, reserved_on, notes)
  values ((select id from public.properties where number = 'B1'), current_date + 10, 'Cumpleaños, 40 personas');
  t := now() - interval '3 days 4 hours';
  perform pg_temp.mark(t);

  update public.residents set phone = '+523139612299', notes = 'Cambió de número' where id = r_lucia;
  t := now() - interval '2 days 1 hour';
  perform pg_temp.mark(t);

  update public.properties set deleted_at = now() where number = 'D5';
  t := now() - interval '1 day 3 hours';
  perform pg_temp.mark(t);

  update public.properties set deleted_at = null where number = 'D5';
  t := t + interval '12 minutes';
  perform pg_temp.mark(t);

  -- -------------------------------------------------------------------------
  -- treasurer fixes a note this morning
  -- -------------------------------------------------------------------------
  perform pg_temp.act_as(u_treasurer);

  update public.transactions set notes = 'Recibo CFE, periodo agosto–septiembre'
  where description = 'Luz de áreas comunes';
  t := now() - interval '3 hours';
  perform pg_temp.mark(t);

  raise notice 'seeds/dev.sql: created 4 users (+ admin), 20 houses, 10 residents, 1 period and 45 days of activity';
end $$;
