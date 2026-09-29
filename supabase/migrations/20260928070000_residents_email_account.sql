-- A resident's email becomes their login when they join the board, so it can't
-- be one that another account already signs in with (say, an admin created by
-- hand in the dashboard, who has no resident). Auth would refuse the invite
-- anyway, but only at the last step; this stops it when the email is saved.
--
-- Fires on insert and on email changes only: addBoardMember's rollback clears
-- profile_id before deleting the account it just created, and a check on that
-- update would block it.

create function private.check_resident_email()
returns trigger
language plpgsql
security definer -- auth.users is out of reach for authenticated
set search_path = ''
as $$
begin
  if new.email is not null and exists (
    select 1 from auth.users u
    where lower(u.email) = lower(new.email) and u.id is distinct from new.profile_id
  ) then
    -- Unique violation, named like a constraint so the app maps it like the others.
    raise exception 'email already used by another account (residents_email_account)'
      using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger residents_check_email
  before insert or update of email on public.residents
  for each row execute function private.check_resident_email();
