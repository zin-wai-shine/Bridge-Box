-- ============================================================
-- Bribox.io — PostgreSQL 16 Migration Schema
-- Universal Master Controller Database
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUM Types ──────────────────────────────────────────────

CREATE TYPE platform_type AS ENUM ('line', 'messenger', 'whatsapp', 'telegram', 'magic_link');
CREATE TYPE bridge_status AS ENUM ('active', 'paused', 'closed', 'archived');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'file', 'location', 'sticker', 'audio');
CREATE TYPE oracle_status AS ENUM ('pending', 'confirmed', 'declined', 'expired');
CREATE TYPE media_job_status AS ENUM ('queued', 'processing', 'completed', 'failed');
CREATE TYPE connection_status AS ENUM ('active', 'disconnected', 'pending_verification');

-- ── Connections (External Platform Accounts) ────────────────

CREATE TABLE connections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform        platform_type NOT NULL,
    platform_id     VARCHAR(255) NOT NULL,
    display_name    VARCHAR(255),
    avatar_url      TEXT,
    webhook_secret  VARCHAR(512),
    access_token    TEXT,
    refresh_token   TEXT,
    token_expires   TIMESTAMPTZ,
    status          connection_status DEFAULT 'active',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, platform_id)
);

CREATE INDEX idx_connections_platform ON connections(platform);
CREATE INDEX idx_connections_status ON connections(status);

-- ── Bridges (The Core A↔B Link) ─────────────────────────────

CREATE TABLE bridges (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bridge_code     VARCHAR(20) UNIQUE NOT NULL,

    -- Source A: Client side
    source_a_id     UUID NOT NULL REFERENCES connections(id),
    source_a_name   VARCHAR(255) NOT NULL,
    source_a_platform platform_type NOT NULL,

    -- Source B: Provider side
    source_b_id     UUID NOT NULL REFERENCES connections(id),
    source_b_name   VARCHAR(255) NOT NULL,
    source_b_platform platform_type NOT NULL,

    -- Bridge state
    status          bridge_status DEFAULT 'active',
    
    -- Smart toggle states
    auto_translate  BOOLEAN DEFAULT false,
    auto_ai         BOOLEAN DEFAULT false,
    oracle_enabled  BOOLEAN DEFAULT false,

    -- Stats
    message_count   INTEGER DEFAULT 0,
    last_activity   TIMESTAMPTZ DEFAULT NOW(),

    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bridges_status ON bridges(status);
CREATE INDEX idx_bridges_source_a ON bridges(source_a_id);
CREATE INDEX idx_bridges_source_b ON bridges(source_b_id);
CREATE INDEX idx_bridges_last_activity ON bridges(last_activity DESC);

-- ── Unified Messages ────────────────────────────────────────

CREATE TABLE unified_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bridge_id       UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
    connection_id   UUID NOT NULL REFERENCES connections(id),
    
    -- Message core
    direction       message_direction NOT NULL,
    msg_type        message_type DEFAULT 'text',
    content         TEXT,
    
    -- Media
    media_url       TEXT,
    media_thumb     TEXT,
    media_mime      VARCHAR(100),
    media_size      BIGINT,

    -- Platform-specific raw payload
    raw_platform_id VARCHAR(255),
    raw_payload     JSONB DEFAULT '{}',

    -- Translated content
    translated      TEXT,
    source_lang     VARCHAR(10),
    target_lang     VARCHAR(10),

    -- Status
    is_read         BOOLEAN DEFAULT false,
    is_delivered    BOOLEAN DEFAULT false,
    
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_bridge ON unified_messages(bridge_id);
CREATE INDEX idx_messages_created ON unified_messages(created_at DESC);
CREATE INDEX idx_messages_unread ON unified_messages(bridge_id, is_read) WHERE is_read = false;

-- ── Oracle Requests (Availability Pings) ────────────────────

CREATE TABLE oracle_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bridge_id       UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
    
    status          oracle_status DEFAULT 'pending',
    query_text      TEXT NOT NULL,
    response_text   TEXT,
    
    pinged_at       TIMESTAMPTZ DEFAULT NOW(),
    responded_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    
    auto_reply_sent BOOLEAN DEFAULT false,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oracle_bridge ON oracle_requests(bridge_id);
CREATE INDEX idx_oracle_status ON oracle_requests(status);
CREATE INDEX idx_oracle_expires ON oracle_requests(expires_at) WHERE status = 'pending';

-- ── Media Jobs (AI Media Sniper Pipeline) ───────────────────

CREATE TABLE media_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id      UUID REFERENCES unified_messages(id),
    bridge_id       UUID REFERENCES bridges(id),
    
    source_url      TEXT NOT NULL,
    processed_url   TEXT,
    
    status          media_job_status DEFAULT 'queued',
    
    -- Processing flags
    upscale_done    BOOLEAN DEFAULT false,
    watermark_done  BOOLEAN DEFAULT false,
    metadata_clean  BOOLEAN DEFAULT false,
    
    error_message   TEXT,
    processing_ms   INTEGER,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_media_jobs_status ON media_jobs(status);
CREATE INDEX idx_media_jobs_bridge ON media_jobs(bridge_id);

-- ── Magic Links ─────────────────────────────────────────────

CREATE TABLE magic_links (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bridge_id       UUID REFERENCES bridges(id),
    
    token           VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    target_platform platform_type NOT NULL,
    
    -- Link settings
    expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    max_uses        INTEGER DEFAULT 1,
    use_count       INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    
    -- Who clicked it
    claimed_by      UUID REFERENCES connections(id),
    claimed_at      TIMESTAMPTZ,
    
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_active ON magic_links(is_active) WHERE is_active = true;

-- ── Updated-at trigger ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_connections_updated
    BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bridges_updated
    BEFORE UPDATE ON bridges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
