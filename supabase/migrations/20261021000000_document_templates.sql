-- Document templates the board saves from the Documents editor, next to the
-- built-in ones (those live in the app, not here).
--
--   * Every board member reads them and can save new ones; only whoever saved
--     one (or an admin) renames or deletes it.
--   * The document itself (header, title and text) is fixed once saved: to
--     change it, save a new template and delete the old one. Only the name and
--     the description can be edited.
--   * content is the editor's JSON, checked by the app against the same schema
--     as a document before it gets here. Images travel inside it, hence the
--     size limit.
--   * A new file, not an edit of the earlier ones: the hosted database already
--     ran those, and this one applies on top without a reset.

create table public.document_templates (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  header_title text not null,
  title        text not null,
  content      jsonb not null,
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint document_templates_name_length check (char_length(name) between 1 and 80),
  constraint document_templates_name_trimmed check (name = btrim(name)),
  constraint document_templates_description_length check (char_length(description) <= 200),
  constraint document_templates_description_trimmed check (description = btrim(description)),
  -- the editor's limits (HEADER_TITLE_MAX, TITLE_MAX)
  constraint document_templates_header_title_length check (char_length(header_title) between 1 and 60),
  constraint document_templates_title_length check (char_length(title) between 1 and 150),
  constraint document_templates_content_is_document check (jsonb_typeof(content) = 'object'),
  -- The app allows 2,000,000 characters of JSON (TEMPLATE_CONTENT_MAX_LENGTH): a few
  -- shrunk photos (about 300 KB each) and the text. This is the backstop, with room for
  -- the spaces Postgres's text form adds and for accented letters taking two bytes.
  constraint document_templates_content_size check (octet_length(content::text) <= 2500000)
);

comment on table public.document_templates is 'Templates saved by the board from the Documents editor. Read by everyone on the board; renamed or deleted by whoever saved one, or an admin.';
comment on column public.document_templates.content is 'The editor''s JSON (Tiptap), as checked by documentContentSchema. Fixed once saved.';

-- Two templates with the same name would be impossible to tell apart in the menu.
create unique index document_templates_name_key on public.document_templates (lower(name));
create index document_templates_created_by_idx on public.document_templates (created_by);

create trigger document_templates_set_updated_at
  before update on public.document_templates
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit
-- ---------------------------------------------------------------------------
-- The same rows private.audit() writes, labeled by the template's name, but
-- without content: the activity log loads old_data and new_data for every
-- entry it lists, and a template with images is megabytes. private.audit()
-- can't be taught about this table without redefining it here, which would
-- leave its real definition in two files.
create function private.audit_document_template()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old     jsonb;
  v_new     jsonb;
  v_row     jsonb;
  v_changed text[];
  v_refs    jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old) - 'content'; end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new) - 'content'; end if;
  v_row := coalesce(v_new, v_old);

  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into v_changed
    from jsonb_each(v_new) n
    where n.key <> 'updated_at' and n.value is distinct from v_old -> n.key;

    if v_changed is null then return null; end if;
  end if;

  v_refs := private.audit_refs(v_old) || private.audit_refs(v_new);

  insert into public.audit_log
    (identity_id, table_name, operation, row_id, label, old_data, new_data, changed_fields, refs)
  values
    (auth.uid(), tg_table_name, lower(tg_op)::public.audit_operation, (v_row ->> 'id')::uuid,
     coalesce(v_row ->> 'name', ''), v_old, v_new, v_changed, v_refs);

  return null;
end;
$$;

comment on function private.audit_document_template is 'Row-level trigger: private.audit() for document_templates, leaving the content out of the log.';

revoke execute on function private.audit_document_template() from public, anon, authenticated;

create trigger document_templates_audit
  after insert or update or delete on public.document_templates
  for each row execute function private.audit_document_template();

-- ---------------------------------------------------------------------------
-- grants and RLS
-- ---------------------------------------------------------------------------
revoke all on table public.document_templates from anon;
grant select, insert, delete on table public.document_templates to authenticated;
-- Only the name and the description change after saving (see above). Explicit
-- revoke: Supabase's default privileges grant ALL to authenticated.
revoke update on table public.document_templates from authenticated;
grant update (name, description) on table public.document_templates to authenticated;

alter table public.document_templates enable row level security;

create policy "document_templates: members can read"
  on public.document_templates for select to authenticated
  using (true);

-- Any board member (any role) saves one, always under their own name.
create policy "document_templates: board members can insert"
  on public.document_templates for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (select 1 from public.user_roles ur where ur.user_id = (select auth.uid()))
  );

create policy "document_templates: author or admin can update"
  on public.document_templates for update to authenticated
  using (created_by = (select auth.uid()) or (select private.is_admin()))
  with check (created_by = (select auth.uid()) or (select private.is_admin()));

create policy "document_templates: author or admin can delete"
  on public.document_templates for delete to authenticated
  using (created_by = (select auth.uid()) or (select private.is_admin()));
