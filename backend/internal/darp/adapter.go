package darp

import (
	"bribox/internal/models"
)

// ── UniversalMessage — The single schema all platforms normalize into ──

type UniversalMessage struct {
	Platform    models.Platform          `json:"platform"`
	PlatformID  string                   `json:"platform_id"`
	SenderID    string                   `json:"sender_id"`
	SenderName  string                   `json:"sender_name"`
	MsgType     models.MessageType       `json:"msg_type"`
	Content     string                   `json:"content"`
	MediaURL    string                   `json:"media_url,omitempty"`
	MediaMime   string                   `json:"media_mime,omitempty"`
	ReplyTo     string                   `json:"reply_to,omitempty"`
	RawPayload  map[string]any           `json:"raw_payload,omitempty"`
	Timestamp   int64                    `json:"timestamp"`
}

// ── UniversalReply — Outbound message to send through a platform adapter ──

type UniversalReply struct {
	RecipientID string             `json:"recipient_id"`
	MsgType     models.MessageType `json:"msg_type"`
	Content     string             `json:"content"`
	MediaURL    string             `json:"media_url,omitempty"`
	QuickReplies []string          `json:"quick_replies,omitempty"`
}

// ── PlatformAdapter — The DARP Universal Interface ──────────
//
// Every messaging platform (Line, Messenger, WhatsApp, Telegram)
// implements this interface to normalize their webhooks into
// and out of UniversalMessage/UniversalReply.

type PlatformAdapter interface {
	// Platform returns which platform this adapter handles
	Platform() models.Platform

	// ParseWebhook takes raw webhook bytes and normalizes into UniversalMessages
	ParseWebhook(body []byte) ([]UniversalMessage, error)

	// SendMessage sends a UniversalReply through the platform's API
	SendMessage(reply UniversalReply) error

	// ValidateWebhook validates the webhook signature/token
	ValidateWebhook(signature string, body []byte) bool
}
