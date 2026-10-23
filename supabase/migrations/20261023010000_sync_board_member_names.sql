-- ===========================================================================
-- A board member's account name follows their resident record
-- ===========================================================================
-- profiles.full_name was copied from the resident's name once, when they were
-- invited, and never again: renaming the resident left the board, the sidebar
-- and the activity log on the old name. The registry is where names are
-- edited (the app never writes full_name), so now the account follows it.
--
-- security definer: the president edits residents, but RLS only lets an
-- admin, or the account itself, update a profile. auth.uid() is still whoever
-- edited the resident, so the activity log shows the profile change as theirs,
-- next to the resident change ("Done at the same time").
--
-- The main admin is the app's own account, named "Vecora Admin" by a guard;
-- it's skipped in case it is ever linked to a resident.

create function private.sync_profile_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := new.first_name || ' ' || new.last_name;
begin
  update public.profiles p
  set full_name = v_name
  where p.id = new.profile_id
    and not p.is_main_admin
    and p.full_name is distinct from v_name;

  return null;
end;
$$;

-- Also on profile_id: linking a resident to an existing account (re-adding a
-- member) brings the account up to date too.
create trigger residents_sync_profile_name
  after insert or update of first_name, last_name, profile_id on public.residents
  for each row
  when (new.profile_id is not null and new.deleted_at is null)
  execute function private.sync_profile_name();

revoke execute on function private.sync_profile_name() from public, anon, authenticated;

-- Accounts already out of step (renamed before this). Runs with no user signed
-- in, so the activity log shows these as "Sistema".
update public.profiles p
set full_name = r.first_name || ' ' || r.last_name
from public.residents r
where r.profile_id = p.id
  and r.deleted_at is null
  and not p.is_main_admin
  and p.full_name is distinct from r.first_name || ' ' || r.last_name;
