-- Performance: add indexes for foreign keys and RLS predicates.
create index if not exists companies_profile_id_idx on public.companies (profile_id);
create index if not exists clients_company_id_idx on public.clients (company_id);
create index if not exists quotes_company_id_idx on public.quotes (company_id);
create index if not exists quotes_client_id_idx on public.quotes (client_id);
create index if not exists quote_items_quote_id_idx on public.quote_items (quote_id);

-- Security: make trigger functions immune to caller-controlled search_path.
alter function public.handle_new_user() set search_path = '';
alter function public.set_current_timestamp_updated_at() set search_path = '';

-- Security: trigger functions are internal implementation details, not public RPCs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_current_timestamp_updated_at() from public, anon, authenticated;

-- Security: unauthenticated users should not have direct table privileges.
revoke all on table public.profiles from anon;
revoke all on table public.companies from anon;
revoke all on table public.clients from anon;
revoke all on table public.quotes from anon;
revoke all on table public.quote_items from anon;

-- RLS performance: wrap auth.uid() in a scalar subselect so Postgres can initPlan it.
alter policy "Select own profile" on public.profiles
  using (id = (select auth.uid()));
alter policy "Insert own profile" on public.profiles
  with check (id = (select auth.uid()));
alter policy "Update own profile" on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
alter policy "Delete own profile" on public.profiles
  using (id = (select auth.uid()));

alter policy "Select own company" on public.companies
  using (profile_id = (select auth.uid()));
alter policy "Insert own company" on public.companies
  with check (profile_id = (select auth.uid()));
alter policy "Update own company" on public.companies
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
alter policy "Delete own company" on public.companies
  using (profile_id = (select auth.uid()));

alter policy "Select own clients" on public.clients
  using (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ));
alter policy "Insert own clients" on public.clients
  with check (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ));
alter policy "Update own clients" on public.clients
  using (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ))
  with check (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ));
alter policy "Delete own clients" on public.clients
  using (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ));

alter policy "Select quotes for own company" on public.quotes
  using (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ));
alter policy "Insert quotes for own company" on public.quotes
  with check (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ));
alter policy "Update quotes for own company" on public.quotes
  using (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ))
  with check (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ));
alter policy "Delete quotes for own company" on public.quotes
  using (company_id in (
    select c.id from public.companies c where c.profile_id = (select auth.uid())
  ));

alter policy "Select quote_items for own quotes" on public.quote_items
  using (exists (
    select 1
    from public.quotes q
    join public.companies c on q.company_id = c.id
    where q.id = quote_items.quote_id
      and c.profile_id = (select auth.uid())
  ));
alter policy "Insert quote_items for own quotes" on public.quote_items
  with check (exists (
    select 1
    from public.quotes q
    join public.companies c on q.company_id = c.id
    where q.id = quote_items.quote_id
      and c.profile_id = (select auth.uid())
  ));
alter policy "Update quote_items for own quotes" on public.quote_items
  using (exists (
    select 1
    from public.quotes q
    join public.companies c on q.company_id = c.id
    where q.id = quote_items.quote_id
      and c.profile_id = (select auth.uid())
  ))
  with check (exists (
    select 1
    from public.quotes q
    join public.companies c on q.company_id = c.id
    where q.id = quote_items.quote_id
      and c.profile_id = (select auth.uid())
  ));
alter policy "Delete quote_items for own quotes" on public.quote_items
  using (exists (
    select 1
    from public.quotes q
    join public.companies c on q.company_id = c.id
    where q.id = quote_items.quote_id
      and c.profile_id = (select auth.uid())
  ));
