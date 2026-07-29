-- public.users holds the small amount of profile data this starter needs. It is kept in
-- sync with auth.users via a trigger so every Supabase user -- anonymous or registered --
-- gets a row.
--
-- The "isAdmin" column is deliberately quoted/camelCase: it matches the column name that
-- @mastra/auth-supabase's *default* authorizeUser() queries (`select "isAdmin" from
-- public.users where id = user.id`). This starter does not use that default -- see the
-- custom authorizeUser in src/mastra/index.ts and the comment there for why -- but the
-- column is kept here so the table matches what the package expects out of the box if a
-- reader ever switches back to the default admin-only behaviour.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  "isAdmin" boolean not null default false,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Signed-in users (anonymous or registered both hold role "authenticated") can read their
-- own profile row. No insert/update/delete policy is defined for clients: rows are only
-- ever written by the handle_new_user() trigger below.
create policy "Users can read their own profile"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, is_anonymous)
  values (new.id, new.email, coalesce(new.is_anonymous, false));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
