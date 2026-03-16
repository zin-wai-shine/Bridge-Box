package models

import (
	"time"

	"github.com/google/uuid"
)

// ── Platform Types ──────────────────────────────────────────

type Platform string

const (
	PlatformLine      Platform = "line"
	PlatformMessenger Platform = "messenger"
	PlatformWhatsApp  Platform = "whatsapp"
	PlatformTelegram  Platform = "telegram"
	PlatformMagicLink Platform = "magic_link"
)

type BridgeStatus string

const (
	BridgeActive   BridgeStatus = "active"
	BridgePaused   BridgeStatus = "paused"
	BridgeClosed   BridgeStatus = "closed"
	BridgeArchived BridgeStatus = "archived"
)

type MessageDirection string

const (
	DirectionInbound  MessageDirection = "inbound"
	DirectionOutbound MessageDirection = "outbound"
)

type MessageType string

const (
	MsgText     MessageType = "text"
	MsgImage    MessageType = "image"
	MsgVideo    MessageType = "video"
	MsgFile     MessageType = "file"
	MsgLocation MessageType = "location"
	MsgSticker  MessageType = "sticker"
	MsgAudio    MessageType = "audio"
)

type OracleStatus string

const (
	OraclePending   OracleStatus = "pending"
	OracleConfirmed OracleStatus = "confirmed"
	OracleDeclined  OracleStatus = "declined"
	OracleExpired   OracleStatus = "expired"
)

type MediaJobStatus string

const (
	MediaQueued     MediaJobStatus = "queued"
	MediaProcessing MediaJobStatus = "processing"
	MediaCompleted  MediaJobStatus = "completed"
	MediaFailed     MediaJobStatus = "failed"
)

// ── Connection ──────────────────────────────────────────────

type Connection struct {
	ID           uuid.UUID         `json:"id"`
	Platform     Platform          `json:"platform"`
	PlatformID   string            `json:"platform_id"`
	DisplayName  string            `json:"display_name"`
	AvatarURL    string            `json:"avatar_url,omitempty"`
	WebhookSecret string           `json:"webhook_secret,omitempty"`
	Status       string            `json:"status"`
	Metadata     map[string]any    `json:"metadata,omitempty"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

// ── Bridge ──────────────────────────────────────────────────

type Bridge struct {
	ID              uuid.UUID    `json:"id"`
	BridgeCode      string       `json:"bridge_code"`
	SourceAID       uuid.UUID    `json:"source_a_id"`
	SourceAName     string       `json:"source_a_name"`
	SourceAPlatform Platform     `json:"source_a_platform"`
	SourceBID       uuid.UUID    `json:"source_b_id"`
	SourceBName     string       `json:"source_b_name"`
	SourceBPlatform Platform     `json:"source_b_platform"`
	Status          BridgeStatus `json:"status"`
	AutoTranslate   bool         `json:"auto_translate"`
	AutoAI          bool         `json:"auto_ai"`
	OracleEnabled   bool         `json:"oracle_enabled"`
	MessageCount    int          `json:"message_count"`
	LastActivity    time.Time    `json:"last_activity"`
	Metadata        map[string]any `json:"metadata,omitempty"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
}

// ── Unified Message ─────────────────────────────────────────

type UnifiedMessage struct {
	ID            uuid.UUID        `json:"id"`
	BridgeID      uuid.UUID        `json:"bridge_id"`
	ConnectionID  uuid.UUID        `json:"connection_id"`
	Direction     MessageDirection `json:"direction"`
	MsgType       MessageType      `json:"msg_type"`
	Content       string           `json:"content"`
	MediaURL      string           `json:"media_url,omitempty"`
	MediaThumb    string           `json:"media_thumb,omitempty"`
	MediaMime     string           `json:"media_mime,omitempty"`
	MediaSize     int64            `json:"media_size,omitempty"`
	RawPlatformID string           `json:"raw_platform_id,omitempty"`
	Translated    string           `json:"translated,omitempty"`
	SourceLang    string           `json:"source_lang,omitempty"`
	TargetLang    string           `json:"target_lang,omitempty"`
	IsRead        bool             `json:"is_read"`
	IsDelivered   bool             `json:"is_delivered"`
	CreatedAt     time.Time        `json:"created_at"`
}

// ── Oracle Request ──────────────────────────────────────────

type OracleRequest struct {
	ID            uuid.UUID    `json:"id"`
	BridgeID      uuid.UUID    `json:"bridge_id"`
	Status        OracleStatus `json:"status"`
	QueryText     string       `json:"query_text"`
	ResponseText  string       `json:"response_text,omitempty"`
	PingedAt      time.Time    `json:"pinged_at"`
	RespondedAt   *time.Time   `json:"responded_at,omitempty"`
	ExpiresAt     time.Time    `json:"expires_at"`
	AutoReplySent bool         `json:"auto_reply_sent"`
	CreatedAt     time.Time    `json:"created_at"`
}

// ── Media Job ───────────────────────────────────────────────

type MediaJob struct {
	ID            uuid.UUID      `json:"id"`
	MessageID     *uuid.UUID     `json:"message_id,omitempty"`
	BridgeID      *uuid.UUID     `json:"bridge_id,omitempty"`
	SourceURL     string         `json:"source_url"`
	ProcessedURL  string         `json:"processed_url,omitempty"`
	Status        MediaJobStatus `json:"status"`
	UpscaleDone   bool           `json:"upscale_done"`
	WatermarkDone bool           `json:"watermark_done"`
	MetadataClean bool           `json:"metadata_clean"`
	ErrorMessage  string         `json:"error_message,omitempty"`
	ProcessingMs  int            `json:"processing_ms,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	CompletedAt   *time.Time     `json:"completed_at,omitempty"`
}

// ── Magic Link ──────────────────────────────────────────────

type MagicLink struct {
	ID             uuid.UUID  `json:"id"`
	BridgeID       *uuid.UUID `json:"bridge_id,omitempty"`
	Token          string     `json:"token"`
	TargetPlatform Platform   `json:"target_platform"`
	ExpiresAt      time.Time  `json:"expires_at"`
	MaxUses        int        `json:"max_uses"`
	UseCount       int        `json:"use_count"`
	IsActive       bool       `json:"is_active"`
	ClaimedBy      *uuid.UUID `json:"claimed_by,omitempty"`
	ClaimedAt      *time.Time `json:"claimed_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}
