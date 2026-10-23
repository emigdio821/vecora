-- ===========================================================================
-- Activity log: an invited member's first password
-- ===========================================================================
-- The first migration written after the hosted project started holding real
-- data. The earlier files are frozen from here on: they are what hosted ran,
-- so every change goes in a new file like this one, never back into them.
--
-- private.audit_password_changed (20260921000500) skipped every first
-- password, so an invited member getting in left no trace in the log. Now
-- that first password is written as "password_set" (shown as "account
-- activated"), whichever link they used: the invite, or the recovery link a
-- fresh one turns into once the account exists. Later changes are still
-- "password". The main admin's forced change away from the default is still
-- not written: that's the app's own setup, like creating the account.
--
-- Auth writes the new password on its own connection, with no user signed in.
-- In the app only the account itself can change it, so it's the identity.
--
-- Replacing the function keeps its trigger (on_auth_user_password_audit) and
-- its revoked execute grants.
create or replace function private.audit_password_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile jsonb;
  v_field   text := 'password';
begin
  select to_jsonb(p) into v_profile from public.profiles p where p.id = new.id;

  -- No profile: not an app account.
  if v_profile is null then return null; end if;

  if (v_profile ->> 'must_change_password')::boolean then return null; end if;

  if coalesce(old.encrypted_password, '') = '' then
    v_field := 'password_set';
  end if;

  insert into public.audit_log
    (identity_id, table_name, operation, row_id, label, old_data, new_data, changed_fields)
  values
    (new.id, 'profiles', 'update', new.id, coalesce(v_profile ->> 'full_name', ''),
     v_profile, v_profile, array[v_field]);

  return null;
end;
$$;
