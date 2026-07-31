# AGENTS.md

## Cursor Cloud specific instructions

This is `mastra-supabase-starter`: a single-package Node.js/TypeScript (ESM, run via `tsx`)
Mastra customer-support agent backed by a **local** Supabase stack (Auth + Postgres +
pgvector) plus OpenAI. Standard commands live in `README.md` and `package.json` scripts
(`dev`, `seed`, `chat`, `reset`, `test`, `db:start`/`db:stop`/`db:reset`); this section only
captures the non-obvious cloud caveats.

### Services and startup order (not handled by the update script)

The update script only runs `npm install`. Docker and the Supabase CLI are already installed
in the VM image, but the Docker daemon and the Supabase stack are **services** you must start
each session, in this order:

1. **Docker daemon** — not started at boot. Start it and make the socket usable without sudo:
   - `sudo dockerd > /tmp/dockerd.log 2>&1 &` (run in a tmux session so it persists)
   - `sudo chmod 666 /var/run/docker.sock` (the `ubuntu` user's docker-group membership is
     not active in already-open shells, so this is the reliable way to let the Supabase CLI
     reach Docker). Docker 29 is configured with the `fuse-overlayfs` storage driver and
     `containerd-snapshotter` disabled in `/etc/docker/daemon.json`; do not change this.
2. **Supabase local stack** — `supabase start` (from repo root; ~1 min first pull). It applies
   `supabase/migrations/` (enables pgvector + app tables) and `supabase/seed.sql` (seeds the
   demo user). Stop with `supabase stop`; reset schema/seed with `npm run db:reset`.
3. **Mastra dev server** — `npm run dev` (Studio + API on `http://localhost:4111`). Run it in
   its own tmux session; it watches for file changes.

### .env (gitignored — recreate each fresh VM)

`.env` is not committed. Copy `.env.example` to `.env` and set:
- `SUPABASE_URL=http://127.0.0.1:54321`
- `SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- `SUPABASE_ANON_KEY=` — the default local stack anon key is deterministic (the standard
  `supabase-demo` anon JWT); it is re-printed by `supabase start` and does not change for the
  default local project.
- `OPENAI_API_KEY=` — **required** for the core RAG/agent flow (embeddings +
  `gpt-4o-mini`). See below.

### OPENAI_API_KEY is required for the core flow

Without `OPENAI_API_KEY`, `npm run seed`, `npm run chat`, the RAG/memory tests, and any agent
chat (CLI or Studio) fail/skip — `seed` errors at embedding-model construction before touching
the DB. What still works without it: the Mastra server boots, `npm test` passes its live
no-token 401 auth test (others skip), and Supabase Auth works end to end (anonymous sign-in and
the seeded demo user both return valid tokens; a verified token maps to a `resourceId`). If the
key is set as an environment secret, mirror it into `.env` since scripts load config via
`dotenv`.

### Mastra Studio login

`MastraAuthSupabase` only verifies bearer tokens, so Studio uses the `signIn()` subclass in
`src/mastra/studio-auth.ts`. Log in at `http://localhost:4111` with the seeded demo account
`demo@example.com` / `local-demo-password` (sign-up is disabled; local-only credentials).

### Node version note

`npm install` emits `EBADENGINE` warnings (a couple of transitive deps want Node ≥22.18; the
image has 22.14). These are warnings only — install, typecheck (`npx tsc --noEmit`), and tests
all pass.
