BEGIN;

-- A migration is a repeatable description of the database structure. Run it
-- with `npm run migrate` instead of manually creating tables in production.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_case_insensitive_unique
  ON users (LOWER(BTRIM(username)));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_case_insensitive_unique
  ON users (LOWER(BTRIM(email)));

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- This join table represents the many-to-many relationship between users and
-- conversations. Its combined primary key prevents duplicate memberships.

CREATE INDEX IF NOT EXISTS conversation_participants_user_id_index
  ON conversation_participants (user_id, conversation_id);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(4000) NOT NULL CHECK (LENGTH(BTRIM(content)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS messages_conversation_cursor_index
  -- This index makes "load older messages" cursor queries efficient.
  ON messages (conversation_id, id DESC);
CREATE INDEX IF NOT EXISTS messages_unread_index
  ON messages (conversation_id, sender_id) WHERE read_at IS NULL;

COMMIT;
