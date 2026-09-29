-- Bootstrap the first admin account.
--
-- Runs automatically on `supabase start` / `supabase db reset` (local).
-- To apply to the hosted project once: `npx supabase db push --include-seed`
--
-- Credentials: admin@vecora.com / admin
-- CHANGE THE PASSWORD right after the first hosted login.
--
-- Idempotent: safe to re-run; does nothing if the user already exists.

do $$
declare
  admin_id constant uuid := 'a0000000-0000-4000-8000-000000000001';
  admin_email constant text := 'admin@vecora.com';
  admin_password constant text := 'admin';
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
  -- "Vecora Admin" and granted the admin role (see 20260928080000_main_admin.sql).

  raise notice 'seed: created admin %', admin_email;
end $$;
