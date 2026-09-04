-- Migration 007: Persistent API key cooldown registry
-- Allows cooldown state to survive Vercel serverless cold starts
-- and be shared across all concurrent function instances.

CREATE TABLE api_key_cooldowns (
  provider    text        NOT NULL,  -- 'gemini' | 'groq'
  key_type    text        NOT NULL,  -- 'primary' | 'backup'
  key_index   int         NOT NULL,  -- 0-based index into the key pool
  expires_at  timestamptz NOT NULL,  -- when this cooldown expires
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (provider, key_type, key_index)
);

-- Efficient querying for active (non-expired) cooldowns only
CREATE INDEX idx_api_key_cooldowns_expires ON api_key_cooldowns (expires_at);

-- No RLS needed: accessed exclusively via service role key from server-side routes.
