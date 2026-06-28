// Runs before server start — creates all tables if they don't exist
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

const sql = `
DO $$ BEGIN
  CREATE TYPE conversation_type AS ENUM ('direct', 'group');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS session (
  sid varchar NOT NULL COLLATE "default", sess json NOT NULL, expire timestamp(6) NOT NULL
);
DO $$ BEGIN ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid);
EXCEPTION WHEN duplicate_table THEN null; WHEN others THEN null; END $$;
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY, username text NOT NULL UNIQUE, display_name text NOT NULL,
  avatar_url text, status_text text DEFAULT 'Hey there! I am using ChatMe.',
  is_online boolean DEFAULT false, last_seen timestamp, created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id serial PRIMARY KEY, type conversation_type NOT NULL, name text, description text,
  avatar_url text, created_by integer REFERENCES users(id), created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_members (
  id serial PRIMARY KEY,
  conversation_id integer NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' NOT NULL, joined_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  conversation_id integer NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id integer NOT NULL REFERENCES users(id),
  type text DEFAULT 'text' NOT NULL, content text, media_url text, media_type text,
  media_size integer, file_name text, reply_to_id integer,
  is_deleted boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS message_reactions (
  id serial PRIMARY KEY,
  message_id integer NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id),
  emoji text NOT NULL, created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS message_reads (
  id serial PRIMARY KEY,
  message_id integer NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id),
  read_at timestamp DEFAULT now() NOT NULL
);
`;

await client.connect();
await client.query(sql);
console.log('[migrate] All tables ready');
await client.end();
