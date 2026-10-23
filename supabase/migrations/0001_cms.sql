-- The site's content: every singleton and every collection item, in every language, in one table, shaped by
-- src/content/model.json. A singleton is the entry with an empty slug.
create table cms_entries (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('singleton', 'item')),
  name text not null,
  slug text not null default '',
  locale text not null,
  data jsonb not null default '{}',
  position integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (kind, name, slug, locale),
  check ((kind = 'singleton') = (slug = ''))
);
create index cms_entries_list on cms_entries (kind, name, locale, position);

-- Who may edit: the site's owner, and anyone they add. Added with the secret key (scripts/load-content.mjs
-- --admin <email>), never by signing in.
create table cms_admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create function is_cms_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.cms_admins where user_id = (select auth.uid()))
$$;

alter table cms_entries enable row level security;
alter table cms_admins enable row level security;
create policy cms_entries_public on cms_entries for select to anon using (published);
create policy cms_entries_read on cms_entries for select to authenticated using (published or (select public.is_cms_admin()));
create policy cms_entries_write on cms_entries for all to authenticated using ((select public.is_cms_admin())) with check ((select public.is_cms_admin()));
create policy cms_admins_self on cms_admins for select to authenticated using (user_id = (select auth.uid()));

revoke all on cms_entries, cms_admins from anon, authenticated;
grant select on cms_entries to anon;
grant select, insert, update, delete on cms_entries to authenticated;
grant select on cms_admins to authenticated;
grant all on cms_entries, cms_admins to service_role;
revoke execute on function is_cms_admin() from public, anon;
grant execute on function is_cms_admin() to authenticated;

-- Images uploaded through the admin: anyone may read them, admins may add and replace them.
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
create policy media_write on storage.objects for insert to authenticated with check (bucket_id = 'media' and (select public.is_cms_admin()));
create policy media_update on storage.objects for update to authenticated using (bucket_id = 'media' and (select public.is_cms_admin()));
create policy media_delete on storage.objects for delete to authenticated using (bucket_id = 'media' and (select public.is_cms_admin()));
