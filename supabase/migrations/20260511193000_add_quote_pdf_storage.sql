insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quote-pdfs',
  'quote-pdfs',
  false,
  5242880,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.quotes
  add column if not exists pdf_path text,
  add column if not exists pdf_template_id text,
  add column if not exists pdf_generated_at timestamptz;

drop policy if exists "Quote PDF files are selectable by company members"
on storage.objects;
drop policy if exists "Quote PDF files are insertable by company members"
on storage.objects;
drop policy if exists "Quote PDF files are updatable by company members"
on storage.objects;
drop policy if exists "Quote PDF files are deletable by company members"
on storage.objects;

create policy "Quote PDF files are selectable by company members"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Quote PDF files are deletable by company members"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Quote PDF files are insertable by company members"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Quote PDF files are updatable by company members"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
