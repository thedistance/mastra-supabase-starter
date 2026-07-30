<!--
Suggested slug: /insights/mastra-supabase-integration-auth-memory-pgvector-rag
Suggested meta description: A hands-on guide to integrating Mastra with Supabase — Supabase Auth for your Mastra server, agent memory on Supabase Postgres, and RAG with pgvector, with TypeScript code examples throughout.
Primary keywords: Mastra Supabase integration, Mastra memory, Supabase pgvector RAG, Supabase Auth Mastra, TypeScript AI agent framework
-->

# Integrating Mastra with Supabase: Auth, Memory and pgvector RAG in One Database

If you're building AI agents in TypeScript, you'll have hit the same wall we have: the agent logic is the easy bit. The hard part is everything around it — where conversation history lives, how retrieval works, and who's allowed to talk to the agent in the first place.

Mastra, the open-source TypeScript AI agent framework, answers the first question well. Supabase answers the rest. And because Supabase is Postgres underneath, a Mastra Supabase integration needs very little glue. One database handles your authentication, your Mastra agent's memory, and your pgvector-powered vector search for RAG.

Here's how to wire it all up.

## Why Mastra and Supabase work so well together

Mastra is storage-agnostic — it needs *somewhere* to persist message history, working memory and embeddings, but it doesn't mind where. Supabase gives you a production-grade Postgres instance with the `pgvector` extension available out of the box, plus authentication and row-level security as standard.

That means no separate vector database, no separate auth provider, no separate session store. Your agent's entire state lives in one place you already know how to query, back up and secure.

## Step 1: Supabase Auth on the Mastra server — locking the front door

Mastra ships a dedicated package for this. `@mastra/auth-supabase` verifies incoming requests against Supabase's authentication system and plugs into the Mastra server via its `auth` option.

Install it:

```bash
npm install @mastra/auth-supabase@latest
```

Then register it on your Mastra instance:

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core'
import { MastraAuthSupabase } from '@mastra/auth-supabase'

export const mastra = new Mastra({
  server: {
    auth: new MastraAuthSupabase({
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
    }),
  },
})
```

On the client, sign the user in with the standard Supabase client, take their access token, and pass it as a Bearer token on every Mastra request:

```typescript
// lib/mastra-client.ts
import { MastraClient } from '@mastra/client-js'

export const mastraClient = new MastraClient({
  baseUrl: 'https://your-mastra-api.example.com',
  headers: {
    Authorization: `Bearer ${accessToken}`, // from the supabase.auth session
  },
})
```

### Don't overlook Supabase anonymous sign-in

Here's a pattern that's easy to miss: most conversations with a product agent start *before* anyone has signed up. A visitor lands on your site, opens the chat widget, and asks a question. Forcing a registration screen at that moment kills the conversation dead.

Supabase's anonymous sign-in solves this neatly:

```typescript
const { data } = await supabase.auth.signInAnonymously()
const accessToken = data.session?.access_token
```

The visitor gets a real Supabase user with a real JWT — which means the same Bearer-token flow into Mastra, the same row-level security, and crucially a stable user ID you can use for agent memory (more on that below). If they later create an account, Supabase links the anonymous identity to the permanent one, and their conversation history comes with them. No orphaned sessions, no "sorry, who were you again?" moment after sign-up.

Two things worth knowing before you ship any of this. First, the default `authorizeUser` check looks for an `isAdmin` column on your `public.users` table — almost certainly not what you want in production, so pass a custom `authorizeUser` function that reflects your own access rules (and decide explicitly how much anonymous users are allowed to do). Second, review your Row Level Security policies. Auth on the Mastra server controls who can *call* the agent; RLS controls what data the agent's queries can *touch*. You want both.

## Step 2: Mastra memory on Supabase Postgres

Out of the box, a Mastra agent starts every request from zero. The `@mastra/memory` package fixes that, and `@mastra/pg` points it at your Supabase Postgres instance.

```bash
npm install @mastra/memory@latest @mastra/pg@latest
```

Take your connection string from the Supabase dashboard (use the pooled connection string if you're deploying to serverless — more on that later), then configure storage on your Mastra instance:

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core'
import { PostgresStore } from '@mastra/pg'

export const mastra = new Mastra({
  storage: new PostgresStore({
    id: 'supabase-storage',
    connectionString: process.env.SUPABASE_DB_URL,
  }),
})
```

Now attach a `Memory` instance to your agent:

```typescript
// src/mastra/agents/support-agent.ts
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'

export const supportAgent = new Agent({
  id: 'support-agent',
  name: 'Support Agent',
  memory: new Memory({
    options: {
      lastMessages: 20,
    },
  }),
})
```

The part that makes memory actually work is the `resource` and `thread` pair you pass at call time. The `resource` is a stable identifier for the user; the `thread` isolates a single conversation:

```typescript
await supportAgent.generate('Remember my delivery postcode is YO1 7HH.', {
  memory: {
    resource: 'user-123',
    thread: 'conversation-456',
  },
})

// Later — same identifiers, and the agent recalls it
await supportAgent.generate("What's my delivery postcode?", {
  memory: {
    resource: 'user-123',
    thread: 'conversation-456',
  },
})
```

Since you're already authenticating with Supabase, the obvious move is to use the Supabase user ID as your `resource` — and this is where anonymous sign-in pays off again, because even your not-yet-registered visitors have one. One caveat from the docs: a thread's owner can't change after creation, so never reuse a thread ID across different users.

For long-running conversations, enable **Observational Memory** (`observationalMemory: true` in the memory options). Background agents compress old messages into dense observations, keeping the context window small while long-term recall survives. For an agent that lives in a channel for weeks — a WhatsApp support line, say — this is the difference between one that degrades and one that doesn't.

## Step 3: RAG with Supabase pgvector

This is where Supabase really earns its keep. Enable the `pgvector` extension in your Supabase dashboard (Database → Extensions → `vector`), and the same database that stores your users and conversations becomes the vector store for your Mastra RAG pipeline.

Mastra's RAG pipeline follows a familiar shape: chunk your documents, embed the chunks, store the vectors, query at runtime.

```bash
npm install @mastra/rag@latest
```

```typescript
import { embedMany } from 'ai'
import { PgVector } from '@mastra/pg'
import { MDocument } from '@mastra/rag'
import { ModelRouterEmbeddingModel } from '@mastra/core/llm'

// 1. Load and chunk your document
const doc = MDocument.fromText(knowledgeBaseContent)

const chunks = await doc.chunk({
  strategy: 'recursive',
  size: 512,
  overlap: 50,
})

// 2. Embed the chunks
const { embeddings } = await embedMany({
  values: chunks.map(chunk => chunk.text),
  model: new ModelRouterEmbeddingModel('openai/text-embedding-3-small'),
})

// 3. Store in Supabase via pgvector
const pgVector = new PgVector({
  id: 'supabase-vectors',
  connectionString: process.env.SUPABASE_DB_URL,
})

await pgVector.upsert({
  indexName: 'knowledge_base',
  vectors: embeddings,
})

// 4. At query time: embed the question, retrieve the nearest chunks
const results = await pgVector.query({
  indexName: 'knowledge_base',
  queryVector: questionEmbedding,
  topK: 3,
})
```

Wrap that query step in a Mastra tool, hand it to your agent, and you've got grounded answers from your own content — no separate vector database bill, no extra infrastructure to monitor.

The same `PgVector` instance also powers Mastra's **semantic recall** memory feature, which retrieves relevant *past messages* by meaning rather than keyword. Conversation memory and document retrieval: one extension, one database.

## Production tips for running Mastra on Supabase

A few things we'd flag from building on this stack ourselves:

**Use the pooled connection string.** If your Mastra server runs on serverless infrastructure, direct Postgres connections will exhaust Supabase's connection limit quickly. Use Supavisor's transaction-mode pooler connection string instead.

**Keep chunking boring until it isn't.** Recursive chunking at 512 tokens with 50 overlap is a perfectly good default. Only reach for cleverer strategies once you've measured retrieval quality and found it wanting.

**Separate your schemas.** Mastra creates its own tables for memory and vectors. Give them a dedicated Postgres schema so they don't tangle with your application tables — it makes migrations and RLS policies far cleaner.

**Instrument early.** Mastra's tracing shows you exactly which messages and retrieved chunks made it into each LLM call. Turn it on from day one; debugging retrieval blind is miserable.

**Let auth do double duty.** Because your `resource` ID is your Supabase user ID, you can join agent memory tables against your application data for analytics — which users talk to the agent, about what, and how often. Add anonymous sign-in to that and you can even see how conversion from visitor to registered user correlates with agent conversations. That's product insight for free.

## Try it yourself: the Mastra + Supabase starter repo

Everything in this post is runnable. We've packaged the whole setup as a public starter repository — **`mastra-supabase-starter`** — so you can see it working on your own machine rather than taking our word for it.

The repo gives you a customer-support agent for a fictional smart-thermostat company, protected by Supabase Auth with anonymous sign-in enabled, remembering conversations in Supabase Postgres, and answering from a seeded knowledge base embedded into pgvector. It runs entirely against a local Supabase stack via the CLI — no hosted project needed — and ships with an ingestion script, an interactive CLI chat, and an integration test suite proving auth, memory and RAG each work end-to-end.

The whole thing is four commands:

```bash
supabase start
npm install
npm run seed
npm run chat
```

Clone it, break it, extend it: **[github.com/thedistance/mastra-supabase-starter](https://github.com/thedistance/mastra-supabase-starter)**.

## The bigger picture

The pattern here isn't really about Mastra or Supabase specifically. It's that agentic products don't need a sprawling constellation of specialised services. A well-configured Postgres instance covers identity, memory and retrieval — the three things that turn a stateless LLM call into something that behaves like a product.

If you're evaluating TypeScript agent frameworks and you already run on Supabase, Mastra is one of the shortest paths from prototype to something you'd happily put in front of users.

---

*The Distance builds AI-powered digital products. If you're exploring what agents could do for your product, [get in touch](https://thedistance.co.uk/contact).*
