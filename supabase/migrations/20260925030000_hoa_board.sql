-- Mesa directiva: the board manages its own membership.
--
-- A board member is a resident with an app account (profiles) holding at least
-- one role (user_roles). Only board members may sign in; the app enforces it
-- at login and in the authed layout (an account with zero roles is turned
-- away). Accounts are created/removed through the Auth Admin API from a server
-- action, never by self-signup (enable_signup is off in config.toml).
--
-- The president joins admin in granting/revoking roles, with one limit: only
-- an admin can hand out or take away the admin role.

drop policy "user_roles: admin can insert" on public.user_roles;
drop policy "user_roles: admin can update" on public.user_roles;
drop policy "user_roles: admin can delete" on public.user_roles;

create policy "user_roles: board managers can insert"
  on public.user_roles for insert to authenticated
  with check (
    (select private.is_admin())
    or ((select private.has_role('president')) and role <> 'admin')
  );

-- (user_id, role) is the primary key, so an update would only ever re-key a
-- row; the app deletes + inserts instead. Kept admin-only.
create policy "user_roles: admin can update"
  on public.user_roles for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "user_roles: board managers can delete"
  on public.user_roles for delete to authenticated
  using (
    (select private.is_admin())
    or ((select private.has_role('president')) and role <> 'admin')
  );

comment on table public.user_roles is 'Role assignments = board membership. Admin and president may change it; only admin touches the admin role.';
