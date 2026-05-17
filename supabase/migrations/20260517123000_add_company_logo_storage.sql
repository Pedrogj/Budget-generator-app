insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-logos',
  'company-logos',
  false,
  262144,
  array['image/webp', 'image/png', 'image/jpeg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.companies
  add column if not exists logo_path text;

drop policy if exists "Company logo files are selectable by company members"
on storage.objects;
drop policy if exists "Company logo files are insertable by company members"
on storage.objects;
drop policy if exists "Company logo files are updatable by company members"
on storage.objects;
drop policy if exists "Company logo files are deletable by company members"
on storage.objects;

create policy "Company logo files are selectable by company members"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Company logo files are insertable by company members"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Company logo files are updatable by company members"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Company logo files are deletable by company members"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'company-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
