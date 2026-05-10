-- The app uses Supabase REST queries, not pg_graphql. Removing pg_graphql closes
-- the GraphQL discovery surface while keeping PostgREST .from(...) access intact.
drop extension if exists pg_graphql;

-- Recreate the remaining quote_items policies so auth.uid() is evaluated once
-- per statement instead of once per row.
drop policy if exists "Update quote_items for own quotes" on public.quote_items;
create policy "Update quote_items for own quotes"
on public.quote_items
for update
to authenticated
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

drop policy if exists "Delete quote_items for own quotes" on public.quote_items;
create policy "Delete quote_items for own quotes"
on public.quote_items
for delete
to authenticated
using (exists (
  select 1
  from public.quotes q
  join public.companies c on q.company_id = c.id
  where q.id = quote_items.quote_id
    and c.profile_id = (select auth.uid())
));
