alter table public.clients
  alter column rif drop not null,
  alter column address drop not null;

update public.clients
set
  rif = nullif(trim(rif), ''),
  address = nullif(trim(address), ''),
  email = nullif(trim(email), ''),
  phone = nullif(trim(phone), '');
