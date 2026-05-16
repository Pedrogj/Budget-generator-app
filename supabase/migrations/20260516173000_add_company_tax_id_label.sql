alter table public.companies
  add column if not exists tax_id_label text not null default 'RIF';

alter table public.companies
  drop constraint if exists companies_tax_id_label_check;

alter table public.companies
  add constraint companies_tax_id_label_check
  check (tax_id_label in ('RIF', 'RUT', 'DNI'));
