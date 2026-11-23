-- Vehicles write the activity log like every app table (see the audit
-- trigger in 20261024141821_database_rules). The log names them by their
-- plate and house, from the row itself (src/components/logs/entry.ts).
create trigger vehicles_audit
  after insert or update or delete on public.vehicles
  for each row execute function private.audit();
