-- Residential logo, shown in "Ajustes" and in the report header.
--
--   * The upload is resized and converted to PNG on the server before it gets
--     here, so the bucket only ever holds small PNGs.
--   * Private bucket: every board member can read it, only the president (or
--     an admin) can add or remove files. Same rules as the settings row.
--   * Every upload gets a new file name, so nothing serves a stale cached logo;
--     the app deletes the previous file once the row points at the new one.

alter table public.settings add column logo_path text;

comment on column public.settings.logo_path is 'File in the "branding" bucket. Null means no logo.';

-- `db reset --linked` leaves the storage schema alone, so the bucket can
-- outlive a reset; keep it rather than fail.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', false, 1048576, array['image/png'])
on conflict (id) do nothing;

create policy "branding: members can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'branding');

create policy "branding: president can upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and (select private.has_role('president')));

create policy "branding: president can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and (select private.has_role('president')));
