-- Seeds one registered demo user for the local Supabase Auth stack.
--
-- LOCAL DEV ONLY. This password is intentionally weak and public -- it only ever exists in
-- your local `supabase start` Postgres instance. Never do this against a hosted project.
--
--   email:    demo@example.com
--   password: local-demo-password
--
-- Inserting directly into auth.users/auth.identities is the standard way to seed a GoTrue
-- user for local development (there is no public API for creating a password user with a
-- known password ahead of time). The on_auth_user_created trigger from
-- 0002_app_tables.sql fires on this insert and creates the matching public.users row.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'demo@example.com',
  crypt('local-demo-password', gen_salt('bf')),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"demo@example.com"}',
  'email',
  now(),
  now(),
  now()
) on conflict (provider_id, provider) do nothing;
