-- Bootstrap the main admin account.
--
-- Runs on every reset: locally on `npm run db:reset`, on the hosted project
-- with `npx supabase db reset --linked --yes` (or `npm run db:seed`, which
-- seeds without wiping). The seeds/ files run too, but skip themselves there.
--
-- Credentials: admin@vecora.app, password "admin" locally and "admin123" on
-- hosted. On hosted the account must choose a new password at the first
-- sign-in: the app allows nothing else until then (profiles.must_change_password).
--
-- Idempotent: safe to re-run; does nothing if the user already exists.

do $$
declare
  is_local boolean :=
    coalesce(current_setting('app.settings.jwt_secret', true), '')
      = 'super-secret-jwt-token-with-at-least-32-characters-long';

  admin_id constant uuid := 'a0000000-0000-4000-8000-000000000001';
  admin_email constant text := 'admin@vecora.app';
  admin_password text := case when is_local then 'admin' else 'admin123' end;
begin
  if exists (select 1 from auth.users where email = admin_email) then
    raise notice 'seed: % already exists, skipping', admin_email;
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    -- GoTrue reads these as non-null strings; the API sets them to '' on signup.
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', admin_email,
    extensions.crypt(admin_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Vecora Admin"}',
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  -- GoTrue requires a matching identity row for email/password sign-in.
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), admin_id, admin_id::text, 'email',
    jsonb_build_object('sub', admin_id::text, 'email', admin_email, 'email_verified', true),
    now(), now(), now()
  );

  -- The on_auth_user_created trigger has already created the profile, named it
  -- "Vecora Admin" and granted the admin role (see 20260921000000_profiles_and_roles.sql).

  -- Everyone can read the default password in this file: on hosted it's only
  -- good for choosing a real one.
  if not is_local then
    update public.profiles set must_change_password = true where id = admin_id;
  end if;

  raise notice 'seed: created admin %', admin_email;
end $$;
