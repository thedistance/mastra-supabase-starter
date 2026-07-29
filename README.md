# mastra-supabase-starter

A companion repo for the blog post _"Integrating Mastra with Supabase: Auth, Memory and
pgvector RAG in One Database"_ [link to blog post]. Clone it, run three commands, and
you'll have a working [Mastra](https://mastra.ai) agent with:

- **Auth** via Supabase Auth, including anonymous sign-in, gating the Mastra server
- **Memory** persisted in the same Supabase Postgres database
- **RAG** over a small support knowledge base, using pgvector in that same database

Everything runs locally against the Supabase CLI's Docker stack -- no hosted Supabase
project required.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (for the Supabase CLI's local stack)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`npm install -g supabase` or your platform's package manager)
- Node.js 20+
- An [OpenAI API key](https://platform.openai.com/api-keys) (embeddings)
- An [Anthropic API key](https://console.anthropic.com/) (the agent's LLM)

## Golden path

```bash
supabase start        # or npm run db:start
cp .env.example .env  # paste anon key + API keys
npm install
npm run seed
npm run dev           # in one terminal
npm run chat          # in another
```

`supabase start` prints an **API URL**, **anon key**, and **DB URL** -- copy the anon key
into `.env` (the URL and DB URL defaults already match the local stack). Then add your
`OPENAI_API_KEY` and `ANTHROPIC_API_KEY`.

`npm run seed` chunks and embeds the knowledge base in `seed/knowledge/` into pgvector.
`npm run dev` starts the Mastra server (default `http://localhost:4111`). `npm run chat`
opens an interactive CLI chat against it, signed in anonymously by default.

Try asking the chat: **"What's the warranty on my thermostat?"** -- it should answer citing
`returns-and-warranty.md`.

## How auth works

The Mastra server is configured with [`MastraAuthSupabase`](https://mastra.ai/docs/server/auth/supabase)
(see `src/mastra/index.ts`), which verifies the `Authorization: Bearer <token>` header on
every request against your local Supabase Auth instance.

By default, `MastraAuthSupabase`'s `authorizeUser()` checks an `isAdmin` column on a
`public.users` table and only allows admins through. That's the wrong shape for a
customer-support agent: **every** signed-in user -- anonymous or registered -- should be
able to talk to it. This starter passes a custom `authorizeUser` that just checks a user
came back from token verification; unauthenticated requests are already rejected before
`authorizeUser` even runs. See the comment in `src/mastra/index.ts` for details.

`src/lib/auth.ts` exposes two helpers used by the chat script and tests:

- `getAnonymousToken()` -- signs in as a brand-new anonymous Supabase user
- `getUserToken(email, password)` -- signs in a registered user

A seeded demo account is available for the registered path:

```
email:    demo@example.com
password: local-demo-password
```

**This account and password only exist in your local Docker Postgres.** Never reuse it
against a hosted Supabase project.

```bash
npm run chat -- --user                          # sign in as the demo user
npm run chat -- --email you@example.com --password yourpassword
```

### Anonymous -> registered linking

Supabase supports linking an anonymous session to a registered account (turning the same
user ID into a permanent one) via `supabase.auth.updateUser()` or a sign-up/sign-in call
issued while the anonymous session is active. This starter doesn't implement that flow, but
because memory is keyed on the Supabase user ID (see below), linking an anonymous account
preserves its conversation history automatically -- the resource ID doesn't change.

## How memory is keyed

The support agent uses `@mastra/memory`'s `Memory` class with `lastMessages: 20`, backed by
the same `PostgresStore` registered on the Mastra instance (`SUPABASE_DB_URL`).

- **`resource`** (the thread owner) is derived from the verified Supabase user via
  `mapUserToResourceId` on the auth provider. The server always uses this value and ignores
  any `resource` a client sends, so one user can never read or write another's memory.
- **`thread`** is caller-supplied. The chat script generates a UUID per session and prints
  it so you can resume later:

  ```bash
  npm run chat -- --thread <the-printed-uuid>
  ```

**A thread's owner can't change after it's first created.** If you reuse a thread ID across
two different users (or two different anonymous sessions), Mastra returns an error rather
than silently merging their histories.

## How ingestion works

`src/scripts/ingest.ts`:

1. Reads every `.md` file in `seed/knowledge/`
2. Splits each into chunks with `MDocument.fromMarkdown().chunk({ strategy: 'recursive', maxSize: 512, overlap: 50 })`
3. Embeds all chunks in one batch with `text-embedding-3-small` via `embedMany`
4. Deletes any existing chunks for that source file, then upserts the new ones into the
   `knowledge_base` pgvector index

Deleting-by-source before upserting makes re-running `npm run seed` idempotent -- it
reports chunk and embedding counts either way, and never duplicates vectors, even if a
document's chunk count changes between runs.

`src/mastra/tools/search-knowledge.ts` is the tool the agent uses at query time: it embeds
the user's question, runs `pgVector.query({ topK: 4 })`, and returns the matching chunks
with their source title so the agent can cite them.

`npm run reset` drops the vector index and the memory tables (threads/messages/working
memory), then re-runs ingestion -- useful if you want a clean slate.

## Running tests

```bash
npm test
```

Tests boot the Mastra dev server automatically if one isn't already running (see
`tests/global-setup.ts`), and talk to it exactly like the chat script does -- real Supabase
Auth tokens, real HTTP requests to `MastraClient`.

- **`auth.test.ts`**: no token -> 401; anonymous token -> 200; registered demo user -> 200
- **`memory.test.ts`**: a fact told in one thread is recalled in the same thread, and is
  _not_ recalled from a different thread for the same user
- **`rag.test.ts`**: warranty and pricing questions are answered correctly from the
  knowledge base; a question about a product Aurora Home doesn't sell gets an honest "I
  don't know" instead of an invented price

Tests that call the live agent require `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` -- if
either is missing they skip with a clear message rather than failing. `supabase start` must
already be running (tests don't manage the Supabase stack, only the Mastra server).

## Going to production

This starter is deliberately local-only, but the same pieces carry over to a hosted setup:

- **Hosted Supabase**: swap `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_DB_URL` for
  your project's values.
- **Pooled connections**: for serverless or high-concurrency deployments, use Supabase's
  [Supavisor](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
  pooled connection string (transaction mode) for `SUPABASE_DB_URL` instead of the direct
  connection.
- **Replace the permissive `authorizeUser`**: this starter allows every authenticated user
  through, which is correct for a single-tenant support agent but not for anything with
  paid tiers, admin actions, or multiple user roles. Add real authorization logic (a
  subscription check, a role column, etc.) in `src/mastra/index.ts`.
- **Review Row Level Security**: `public.users` has RLS enabled with a read-your-own-row
  policy. If you add more tables, give them the same review before going live.
- **Anonymous sign-in rate limits**: `supabase/config.toml`'s
  `auth.rate_limit.anonymous_users` is tuned for local development; review it for
  production traffic.

## Troubleshooting

**`create extension vector` fails / pgvector functions don't exist**
The local Supabase Postgres image ships pgvector already, but if you're pointing at a
different Postgres instance, install the [pgvector extension](https://github.com/pgvector/pgvector)
first.

**Anonymous sign-in returns an error**
Check `supabase/config.toml` has `auth.enable_anonymous_sign_ins = true`, then
`supabase stop && supabase start` to apply the config change.

**Port already in use (54321, 54322, 4111, ...)**
Something else is bound to one of the Supabase CLI's ports or `MASTRA_PORT`. Stop the
conflicting process, or change `MASTRA_PORT` in `.env` (Supabase's ports are configured in
`supabase/config.toml`).

**`npm run seed` fails with an OpenAI error**
Check `OPENAI_API_KEY` is set in `.env` and has access to `text-embedding-3-small`.

**Chat responses fail or time out**
Check `ANTHROPIC_API_KEY` is set in `.env`, and that `npm run dev` is running in another
terminal.

## License

MIT -- see [LICENSE](./LICENSE).
