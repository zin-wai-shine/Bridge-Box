package darp

import (
	"encoding/json"
	"fmt"
	"time"

	"bribox/internal/models"
)

// ── LINE Adapter ────────────────────────────────────────────

type LineAdapter struct {
	ChannelSecret string
	ChannelToken  string
}

func NewLineAdapter(secret, token string) *LineAdapter {
	return &LineAdapter{
		ChannelSecret: secret,
		ChannelToken:  token,
	}
}

func (a *LineAdapter) Platform() models.Platform {
	return models.PlatformLine
}

func (a *LineAdapter) ParseWebhook(body []byte) ([]UniversalMessage, error) {
	var payload struct {
		Events []struct {
			Type    string `json:"type"`
			Message struct {
				Type string `json:"type"`
				ID   string `json:"id"`
				Text string `json:"text"`
			} `json:"message"`
			Source struct {
				UserID  string `json:"userId"`
				GroupID string `json:"groupId"`
			} `json:"source"`
			Timestamp int64 `json:"timestamp"`
		} `json:"events"`
	}

	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("line: failed to parse webhook: %w", err)
	}

	var messages []UniversalMessage
	for _, evt := range payload.Events {
		if evt.Type != "message" {
			continue
		}

		msg := UniversalMessage{
			Platform:   models.PlatformLine,
			PlatformID: evt.Message.ID,
			SenderID:   evt.Source.UserID,
			SenderName: "", // Will be resolved from profile API
			Timestamp:  evt.Timestamp,
			RawPayload: map[string]any{"source": evt.Source},
		}

		switch evt.Message.Type {
		case "text":
			msg.MsgType = models.MsgText
			msg.Content = evt.Message.Text
		case "image":
			msg.MsgType = models.MsgImage
			msg.MediaURL = fmt.Sprintf("https://api-data.line.me/v2/bot/message/%s/content", evt.Message.ID)
			msg.MediaMime = "image/jpeg"
		case "video":
			msg.MsgType = models.MsgVideo
			msg.MediaURL = fmt.Sprintf("https://api-data.line.me/v2/bot/message/%s/content", evt.Message.ID)
			msg.MediaMime = "video/mp4"
		case "sticker":
			msg.MsgType = models.MsgSticker
		default:
			msg.MsgType = models.MsgText
			msg.Content = fmt.Sprintf("[%s message]", evt.Message.Type)
		}

		messages = append(messages, msg)
	}

	return messages, nil
}

func (a *LineAdapter) SendMessage(reply UniversalReply) error {
	// In production: POST to https://api.line.me/v2/bot/message/push
	fmt.Printf("[LINE] Sending %s to %s: %s\n", reply.MsgType, reply.RecipientID, reply.Content)
	return nil
}

func (a *LineAdapter) ValidateWebhook(signature string, body []byte) bool {
	// In production: HMAC-SHA256 validation with ChannelSecret
	return true
}

// ── Telegram Adapter ────────────────────────────────────────

type TelegramAdapter struct {
	BotToken string
}

func NewTelegramAdapter(token string) *TelegramAdapter {
	return &TelegramAdapter{BotToken: token}
}

func (a *TelegramAdapter) Platform() models.Platform {
	return models.PlatformTelegram
}

func (a *TelegramAdapter) ParseWebhook(body []byte) ([]UniversalMessage, error) {
	var update struct {
		UpdateID int `json:"update_id"`
		Message  struct {
			MessageID int `json:"message_id"`
			From      struct {
				ID        int    `json:"id"`
				FirstName string `json:"first_name"`
				LastName  string `json:"last_name"`
				Username  string `json:"username"`
			} `json:"from"`
			Chat struct {
				ID int64 `json:"id"`
			} `json:"chat"`
			Date  int    `json:"date"`
			Text  string `json:"text"`
			Photo []struct {
				FileID string `json:"file_id"`
				Width  int    `json:"width"`
				Height int    `json:"height"`
			} `json:"photo"`
		} `json:"message"`
	}

	if err := json.Unmarshal(body, &update); err != nil {
		return nil, fmt.Errorf("telegram: failed to parse webhook: %w", err)
	}

	msg := UniversalMessage{
		Platform:   models.PlatformTelegram,
		PlatformID: fmt.Sprintf("%d", update.Message.MessageID),
		SenderID:   fmt.Sprintf("%d", update.Message.From.ID),
		SenderName: update.Message.From.FirstName + " " + update.Message.From.LastName,
		Timestamp:  int64(update.Message.Date) * 1000,
	}

	if len(update.Message.Photo) > 0 {
		msg.MsgType = models.MsgImage
		// Use highest resolution photo
		lastPhoto := update.Message.Photo[len(update.Message.Photo)-1]
		msg.MediaURL = lastPhoto.FileID
		msg.MediaMime = "image/jpeg"
	} else {
		msg.MsgType = models.MsgText
		msg.Content = update.Message.Text
	}

	return []UniversalMessage{msg}, nil
}

func (a *TelegramAdapter) SendMessage(reply UniversalReply) error {
	fmt.Printf("[TELEGRAM] Sending %s to %s: %s\n", reply.MsgType, reply.RecipientID, reply.Content)
	return nil
}

func (a *TelegramAdapter) ValidateWebhook(signature string, body []byte) bool {
	return true
}

// ── WhatsApp Adapter ────────────────────────────────────────

type WhatsAppAdapter struct {
	PhoneNumberID string
	AccessToken   string
	VerifyToken   string
}

func NewWhatsAppAdapter(phoneID, accessToken, verifyToken string) *WhatsAppAdapter {
	return &WhatsAppAdapter{
		PhoneNumberID: phoneID,
		AccessToken:   accessToken,
		VerifyToken:   verifyToken,
	}
}

func (a *WhatsAppAdapter) Platform() models.Platform {
	return models.PlatformWhatsApp
}

func (a *WhatsAppAdapter) ParseWebhook(body []byte) ([]UniversalMessage, error) {
	var payload struct {
		Entry []struct {
			Changes []struct {
				Value struct {
					Messages []struct {
						ID        string `json:"id"`
						From      string `json:"from"`
						Timestamp string `json:"timestamp"`
						Type      string `json:"type"`
						Text      struct {
							Body string `json:"body"`
						} `json:"text"`
						Image struct {
							ID       string `json:"id"`
							MimeType string `json:"mime_type"`
						} `json:"image"`
					} `json:"messages"`
					Contacts []struct {
						Profile struct {
							Name string `json:"name"`
						} `json:"profile"`
						WaID string `json:"wa_id"`
					} `json:"contacts"`
				} `json:"value"`
			} `json:"changes"`
		} `json:"entry"`
	}

	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("whatsapp: failed to parse webhook: %w", err)
	}

	var messages []UniversalMessage
	for _, entry := range payload.Entry {
		for _, change := range entry.Changes {
			for _, waMsg := range change.Value.Messages {
				msg := UniversalMessage{
					Platform:   models.PlatformWhatsApp,
					PlatformID: waMsg.ID,
					SenderID:   waMsg.From,
					Timestamp:  time.Now().UnixMilli(),
				}

				// Resolve sender name from contacts
				for _, contact := range change.Value.Contacts {
					if contact.WaID == waMsg.From {
						msg.SenderName = contact.Profile.Name
						break
					}
				}

				switch waMsg.Type {
				case "text":
					msg.MsgType = models.MsgText
					msg.Content = waMsg.Text.Body
				case "image":
					msg.MsgType = models.MsgImage
					msg.MediaURL = waMsg.Image.ID
					msg.MediaMime = waMsg.Image.MimeType
				default:
					msg.MsgType = models.MsgText
					msg.Content = fmt.Sprintf("[%s message]", waMsg.Type)
				}

				messages = append(messages, msg)
			}
		}
	}

	return messages, nil
}

func (a *WhatsAppAdapter) SendMessage(reply UniversalReply) error {
	fmt.Printf("[WHATSAPP] Sending %s to %s: %s\n", reply.MsgType, reply.RecipientID, reply.Content)
	return nil
}

func (a *WhatsAppAdapter) ValidateWebhook(signature string, body []byte) bool {
	return true
}

// ── Messenger Adapter ───────────────────────────────────────

type MessengerAdapter struct {
	PageToken   string
	AppSecret   string
	VerifyToken string
}

func NewMessengerAdapter(pageToken, appSecret, verifyToken string) *MessengerAdapter {
	return &MessengerAdapter{
		PageToken:   pageToken,
		AppSecret:   appSecret,
		VerifyToken: verifyToken,
	}
}

func (a *MessengerAdapter) Platform() models.Platform {
	return models.PlatformMessenger
}

func (a *MessengerAdapter) ParseWebhook(body []byte) ([]UniversalMessage, error) {
	var payload struct {
		Object string `json:"object"`
		Entry  []struct {
			Messaging []struct {
				Sender struct {
					ID string `json:"id"`
				} `json:"sender"`
				Timestamp int64 `json:"timestamp"`
				Message   struct {
					MID  string `json:"mid"`
					Text string `json:"text"`
					Attachments []struct {
						Type    string `json:"type"`
						Payload struct {
							URL string `json:"url"`
						} `json:"payload"`
					} `json:"attachments"`
				} `json:"message"`
			} `json:"messaging"`
		} `json:"entry"`
	}

	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, fmt.Errorf("messenger: failed to parse webhook: %w", err)
	}

	var messages []UniversalMessage
	for _, entry := range payload.Entry {
		for _, m := range entry.Messaging {
			msg := UniversalMessage{
				Platform:   models.PlatformMessenger,
				PlatformID: m.Message.MID,
				SenderID:   m.Sender.ID,
				Timestamp:  m.Timestamp,
			}

			if len(m.Message.Attachments) > 0 {
				att := m.Message.Attachments[0]
				switch att.Type {
				case "image":
					msg.MsgType = models.MsgImage
				case "video":
					msg.MsgType = models.MsgVideo
				case "file":
					msg.MsgType = models.MsgFile
				default:
					msg.MsgType = models.MsgFile
				}
				msg.MediaURL = att.Payload.URL
			} else {
				msg.MsgType = models.MsgText
				msg.Content = m.Message.Text
			}

			messages = append(messages, msg)
		}
	}

	return messages, nil
}

func (a *MessengerAdapter) SendMessage(reply UniversalReply) error {
	fmt.Printf("[MESSENGER] Sending %s to %s: %s\n", reply.MsgType, reply.RecipientID, reply.Content)
	return nil
}

func (a *MessengerAdapter) ValidateWebhook(signature string, body []byte) bool {
	return true
}
