-- Enable pgvector so Mastra's PgVector store can create vector columns and indexes.
create extension if not exists vector;
