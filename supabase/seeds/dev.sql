-- Development data. LOCAL ONLY.
--
-- Runs after seed.sql on `npm run db:reset`. Guarded so it is a no-op on the
-- hosted project even if someone runs `db push --include-seed`.
--
-- Test logins (password for all: "resido"):
--   president@resido.com    role: president   (linked to resident Ana López)
--   treasurer@resido.com    role: treasurer
--   security@resido.com     role: security
--   maintenance@resido.com  role: maintenance
--   member@resido.com       no role           (linked to resident Tomás Rivera)

do $$
declare
  is_local boolean :=
    coalesce(current_setting('app.settings.jwt_secret', true), '')
      = 'super-secret-jwt-token-with-at-least-32-characters-long';

  -- fixed ids so the data is stable across resets
  u_president   constant uuid := 'b0000000-0000-4000-8000-000000000001';
  u_treasurer   constant uuid := 'b0000000-0000-4000-8000-000000000002';
  u_security    constant uuid := 'b0000000-0000-4000-8000-000000000003';
  u_maintenance constant uuid := 'b0000000-0000-4000-8000-000000000004';
  u_member      constant uuid := 'b0000000-0000-4000-8000-000000000005';

  p_1a  constant uuid := 'c0000000-0000-4000-8000-000000000001';
  p_1b  constant uuid := 'c0000000-0000-4000-8000-000000000002';
  p_2a  constant uuid := 'c0000000-0000-4000-8000-000000000003';
  p_2b  constant uuid := 'c0000000-0000-4000-8000-000000000004';
  p_3a  constant uuid := 'c0000000-0000-4000-8000-000000000005';
  p_3b  constant uuid := 'c0000000-0000-4000-8000-000000000006';

  r_ana    constant uuid := 'd0000000-0000-4000-8000-000000000001';
  r_luis   constant uuid := 'd0000000-0000-4000-8000-000000000002';
  r_maria  constant uuid := 'd0000000-0000-4000-8000-000000000003';
  r_tomas  constant uuid := 'd0000000-0000-4000-8000-000000000004';
  r_sofia  constant uuid := 'd0000000-0000-4000-8000-000000000005';
  r_diego  constant uuid := 'd0000000-0000-4000-8000-000000000006';
  r_carmen constant uuid := 'd0000000-0000-4000-8000-000000000007';
  r_pablo  constant uuid := 'd0000000-0000-4000-8000-000000000008';

  per_2026 constant uuid := 'e0000000-0000-4000-8000-000000000001';
  cat_fee      uuid;
  cat_late_fee uuid;
  cat_garden   uuid;
  cat_services uuid;
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
  -- users, one per role + one plain member
  -- -------------------------------------------------------------------------
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  )
  select
    '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
    extensions.crypt('resido', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.full_name), now(), now(),
    '', '', '', '', '', '', '', ''
  from (values
    (u_president,   'president@resido.com',   'Ana López'),
    (u_treasurer,   'treasurer@resido.com',   'Luis Fernández'),
    (u_security,    'security@resido.com',    'María García'),
    (u_maintenance, 'maintenance@resido.com', 'Diego Martínez'),
    (u_member,      'member@resido.com',      'Tomás Rivera')
  ) as u(id, email, full_name);

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), id, id::text, 'email',
         jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
         now(), now(), now()
  from auth.users
  where id in (u_president, u_treasurer, u_security, u_maintenance, u_member);

  insert into public.user_roles (user_id, role) values
    (u_president,   'president'),
    (u_treasurer,   'treasurer'),
    (u_security,    'security'),
    (u_maintenance, 'maintenance');

  -- -------------------------------------------------------------------------
  -- properties
  -- -------------------------------------------------------------------------
  insert into public.properties (id, number, notes) values
    (p_1a, '1A', null),
    (p_1b, '1B', 'Corner unit'),
    (p_2a, '2A', null),
    (p_2b, '2B', 'Rented'),
    (p_3a, '3A', null),
    (p_3b, '3B', 'Vacant');

  -- -------------------------------------------------------------------------
  -- residents (two of them have app accounts)
  -- -------------------------------------------------------------------------
  insert into public.residents (id, profile_id, first_name, last_name, phone, email, notes) values
    (r_ana,    u_president, 'Ana',    'López',     '+52 55 1000 0001', 'president@resido.com', 'Board president'),
    (r_luis,   null,        'Luis',   'Fernández', '+52 55 1000 0002', 'luis@example.com',     null),
    (r_maria,  null,        'María',  'García',    '+52 55 1000 0003', null,                   null),
    (r_tomas,  u_member,    'Tomás',  'Rivera',    '+52 55 1000 0004', 'member@resido.com',    null),
    (r_sofia,  null,        'Sofía',  'Rivera',    '+52 55 1000 0005', null,                   'Tomás'' partner'),
    (r_diego,  null,        'Diego',  'Martínez',  '+52 55 1000 0006', 'diego@example.com',    'Owns two units'),
    (r_carmen, null,        'Carmen', 'Ortega',    '+52 55 1000 0007', 'carmen@example.com',   'Tenant in 2B'),
    (r_pablo,  null,        'Pablo',  'Ortega',    '+52 55 1000 0008', null,                   'Carmen''s son');

  -- -------------------------------------------------------------------------
  -- who lives / owns where
  -- -------------------------------------------------------------------------
  insert into public.property_residents (property_id, resident_id, relationship) values
    (p_1a, r_ana,    'owner'),
    (p_1b, r_luis,   'owner'),
    (p_1b, r_maria,  'owner'),   -- co-owners
    (p_2a, r_tomas,  'owner'),
    (p_2a, r_sofia,  'family'),
    (p_2b, r_diego,  'owner'),   -- landlord, lives in 3A
    (p_2b, r_carmen, 'tenant'),
    (p_2b, r_pablo,  'family'),
    (p_3a, r_diego,  'owner');
    -- 3B intentionally has nobody

  -- -------------------------------------------------------------------------
  -- treasury: one period, September fees (one paid late) and two expenses
  -- -------------------------------------------------------------------------
  insert into public.periods (id, name, starts_on, ends_on, monthly_fee, late_fee, due_day) values
    (per_2026, '2026-2027', '2026-09-01', '2027-08-31', 500, 100, 10);

  select id into cat_fee      from public.transaction_categories where key = 'fee';
  select id into cat_late_fee from public.transaction_categories where key = 'late_fee';
  select id into cat_garden   from public.transaction_categories where kind = 'expense' and name = 'Jardinería';
  select id into cat_services from public.transaction_categories where kind = 'expense' and name = 'Servicios';

  -- created_by is explicit: auth.uid() is null while seeding
  insert into public.transactions
    (kind, category_id, period_id, property_id, amount, occurred_on, fee_month, payment_method, folio, reference, description, notes, created_by)
  values
    ('income',  cat_fee,      per_2026, p_1a, 500, '2026-09-03', '2026-09-01', 'cash',     'A-0001', null,       'Cuota septiembre 2026 · Casa 1A', null, u_treasurer),
    ('income',  cat_fee,      per_2026, p_1b, 500, '2026-09-05', '2026-09-01', 'transfer', 'A-0002', 'SPEI 48213', 'Cuota septiembre 2026 · Casa 1B', null, u_treasurer),
    ('income',  cat_fee,      per_2026, p_2a, 500, '2026-09-08', '2026-09-01', 'cash',     'A-0003', null,       'Cuota septiembre 2026 · Casa 2A', null, u_treasurer),
    -- 2B paid after the 10th: fee + recargo on the same ticket
    ('income',  cat_fee,      per_2026, p_2b, 500, '2026-09-15', '2026-09-01', 'cash',     'A-0004', null,       'Cuota septiembre 2026 · Casa 2B', 'Pagó Carmen (inquilina)', u_treasurer),
    ('income',  cat_late_fee, per_2026, p_2b, 100, '2026-09-15', '2026-09-01', 'cash',     'A-0004', null,       'Recargo septiembre 2026 · Casa 2B', null, u_treasurer),
    -- 3A and 3B have not paid September
    ('expense', cat_garden,   per_2026, null, 350, '2026-09-12', null,         'transfer', null,     'SPEI 51907', 'Pintura para el área del jardín', null, u_treasurer),
    ('expense', cat_services, per_2026, null, 820, '2026-09-18', null,         'cash',     null,     'CFE 0912',   'Luz de áreas comunes · septiembre', null, u_treasurer);

  raise notice 'seeds/dev.sql: created 5 users, 6 properties, 8 residents, 1 period, 7 transactions';
end $$;
