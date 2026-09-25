-- Periods (the board's fiscal year and its fee rules) are managed from the
-- Presidencia section, so the president writes them too. The treasurer keeps
-- write access: creating the next cycle is part of closing the books.
-- has_role() already implies admin.

drop policy "periods: treasurer can insert" on public.periods;
drop policy "periods: treasurer can update" on public.periods;
drop policy "periods: treasurer can delete" on public.periods;

create policy "periods: board can insert"
  on public.periods for insert to authenticated
  with check ((select private.has_role('president')) or (select private.has_role('treasurer')));

create policy "periods: board can update"
  on public.periods for update to authenticated
  using ((select private.has_role('president')) or (select private.has_role('treasurer')))
  with check ((select private.has_role('president')) or (select private.has_role('treasurer')));

create policy "periods: board can delete"
  on public.periods for delete to authenticated
  using ((select private.has_role('president')) or (select private.has_role('treasurer')));
