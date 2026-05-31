alter table public.companies
  add column if not exists brand_primary_color text not null default '#0f172a',
  add column if not exists brand_accent_color text not null default '#0284c7';

alter table public.companies
  drop constraint if exists companies_brand_primary_color_check;

alter table public.companies
  drop constraint if exists companies_brand_accent_color_check;

alter table public.companies
  add constraint companies_brand_primary_color_check
  check (brand_primary_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.companies
  add constraint companies_brand_accent_color_check
  check (brand_accent_color ~ '^#[0-9A-Fa-f]{6}$');
