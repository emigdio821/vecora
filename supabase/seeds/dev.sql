-- Development data. LOCAL ONLY.
--
-- Runs after seed.sql on `npm run db:reset`. Guarded so it is a no-op on the
-- hosted project even if someone runs `db push --include-seed`.
--
-- Test logins (password for all: "admin"), one per role:
--   admin@resido.com        admin        (account from seed.sql)
--   president@resido.com    president
--   treasurer@resido.com    treasurer
--   security@resido.com     security
--   maintenance@resido.com  maintenance
--
-- 10 residents (the 5 above + 5 without an account), phones +523139612222
-- upward. 20 houses A1–D5; some empty, one resident without a house.
-- No periods (and so no treasury, terraza or maintenance data): those are
-- created by hand.

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

  r_admin   constant uuid := 'd0000000-0000-4000-8000-000000000001';
  r_ana     constant uuid := 'd0000000-0000-4000-8000-000000000002';
  r_luis    constant uuid := 'd0000000-0000-4000-8000-000000000003';
  r_maria   constant uuid := 'd0000000-0000-4000-8000-000000000004';
  r_diego   constant uuid := 'd0000000-0000-4000-8000-000000000005';
  r_sofia   constant uuid := 'd0000000-0000-4000-8000-000000000006';
  r_carmen  constant uuid := 'd0000000-0000-4000-8000-000000000007';
  r_pablo   constant uuid := 'd0000000-0000-4000-8000-000000000008';
  r_jorge   constant uuid := 'd0000000-0000-4000-8000-000000000009';
  r_lucia   constant uuid := 'd0000000-0000-4000-8000-000000000010';
begin
  if not is_local then
    raise notice 'seeds/dev.sql: not a local database, skipping';
    return;
  end if;

  if exists (select 1 from auth.users where email = 'president@resido.com') then
    raise notice 'seeds/dev.sql: dev data already present, skipping';
    return;
  end if;

  -- -------------------------------------------------------------------------
  -- users, one per role (admin already exists)
  -- -------------------------------------------------------------------------
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
    (u_president,   'president@resido.com',   'Ana López'),
    (u_treasurer,   'treasurer@resido.com',   'Luis Fernández'),
    (u_security,    'security@resido.com',    'María García'),
    (u_maintenance, 'maintenance@resido.com', 'Diego Martínez')
  ) as u(id, email, full_name);

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), id, id::text, 'email',
         jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
         now(), now(), now()
  from auth.users
  where id in (u_president, u_treasurer, u_security, u_maintenance);

  insert into public.user_roles (user_id, role) values
    (u_president,   'president'),
    (u_treasurer,   'treasurer'),
    (u_security,    'security'),
    (u_maintenance, 'maintenance');

  -- -------------------------------------------------------------------------
  -- houses: A1–A5, B1–B5, C1–C5, D1–D5
  -- -------------------------------------------------------------------------
  insert into public.properties (number)
  select block || n
  from unnest(array['A', 'B', 'C', 'D']) as block, generate_series(1, 5) as n;

  update public.properties set notes = 'Casa de esquina' where number = 'A1';
  update public.properties set notes = 'Rentada' where number = 'C1';

  -- -------------------------------------------------------------------------
  -- residents: board members are residents with an account + role
  -- -------------------------------------------------------------------------
  insert into public.residents (id, profile_id, first_name, last_name, phone, email, notes) values
    (r_admin,  u_admin,       'Resido',  'Admin',     '+523139612222', 'admin@resido.com',       null),
    (r_ana,    u_president,   'Ana',     'López',     '+523139612223', 'president@resido.com',   null),
    (r_luis,   u_treasurer,   'Luis',    'Fernández', '+523139612224', 'treasurer@resido.com',   null),
    (r_maria,  u_security,    'María',   'García',    '+523139612225', 'security@resido.com',    null),
    (r_diego,  u_maintenance, 'Diego',   'Martínez',  '+523139612226', 'maintenance@resido.com', 'Dueño de dos casas'),
    (r_sofia,  null,          'Sofía',   'Rivera',    '+523139612227', null,                     'Pareja de María'),
    (r_carmen, null,          'Carmen',  'Ortega',    '+523139612228', 'carmen@example.com',     'Inquilina en C1'),
    (r_pablo,  null,          'Pablo',   'Ortega',    '+523139612229', null,                     'Hijo de Carmen'),
    (r_jorge,  null,          'Jorge',   'Herrera',   '+523139612230', 'jorge@example.com',      null),
    (r_lucia,  null,          'Lucía',   'Navarro',   '+523139612231', null,                     'Aún sin casa asignada');

  -- -------------------------------------------------------------------------
  -- who lives / owns where (every other house is empty)
  -- -------------------------------------------------------------------------
  insert into public.property_residents (property_id, resident_id, relationship)
  select p.id, v.resident_id, v.relationship::public.residency_relationship
  from (values
    ('A1', r_admin,  'owner'),
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

  raise notice 'seeds/dev.sql: created 4 users (+ admin), 20 houses, 10 residents';
end $$;
