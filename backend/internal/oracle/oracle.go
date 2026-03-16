package oracle

import (
	"context"
	"fmt"
	"log"
	"time"

	"bribox/internal/darp"
	"bribox/internal/models"
	"bribox/internal/ws"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ── Availability Oracle (Module C) ──────────────────────────
//
// State Machine for availability checking:
//   PENDING → Provider pinged
//   CONFIRMED → Provider said "Yes" → auto-reply to Client
//   DECLINED → Provider said "No"
//   EXPIRED → No response within 24h

type Oracle struct {
	db     *pgxpool.Pool
	router *darp.Router
	hub    *ws.Hub
}

func NewOracle(db *pgxpool.Pool, router *darp.Router, hub *ws.Hub) *Oracle {
	return &Oracle{
		db:     db,
		router: router,
		hub:    hub,
	}
}

// PingProvider creates an oracle request and sends an availability query to the provider
func (o *Oracle) PingProvider(ctx context.Context, bridgeID uuid.UUID, queryText string) (*models.OracleRequest, error) {
	// Get bridge details
	var bridge models.Bridge
	err := o.db.QueryRow(ctx, `
		SELECT id, bridge_code, source_a_name, source_b_id, source_b_platform, oracle_enabled
		FROM bridges WHERE id = $1
	`, bridgeID).Scan(
		&bridge.ID, &bridge.BridgeCode, &bridge.SourceAName,
		&bridge.SourceBID, &bridge.SourceBPlatform, &bridge.OracleEnabled,
	)
	if err != nil {
		return nil, fmt.Errorf("oracle: bridge not found: %w", err)
	}

	if !bridge.OracleEnabled {
		return nil, fmt.Errorf("oracle: oracle is not enabled for bridge %s", bridge.BridgeCode)
	}

	// Create oracle request
	reqID := uuid.New()
	expiresAt := time.Now().Add(24 * time.Hour)

	_, err = o.db.Exec(ctx, `
		INSERT INTO oracle_requests (id, bridge_id, query_text, expires_at)
		VALUES ($1, $2, $3, $4)
	`, reqID, bridgeID, queryText, expiresAt)
	if err != nil {
		return nil, fmt.Errorf("oracle: failed to create request: %w", err)
	}

	// Send ping to provider through DARP
	providerPlatform := bridge.SourceBPlatform
	reply := darp.UniversalReply{
		RecipientID: bridge.SourceBID.String(),
		MsgType:     models.MsgText,
		Content:     fmt.Sprintf("🔔 Availability Check from %s:\n\n%s\n\nReply YES to confirm or NO to decline.", bridge.SourceAName, queryText),
	}

	if err := o.router.SendReply(providerPlatform, reply); err != nil {
		log.Printf("⚠️  Oracle: failed to send ping: %v", err)
	}

	oracleReq := &models.OracleRequest{
		ID:        reqID,
		BridgeID:  bridgeID,
		Status:    models.OraclePending,
		QueryText: queryText,
		PingedAt:  time.Now(),
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}

	// Broadcast oracle update via WebSocket
	o.hub.BroadcastToBridge(bridgeID.String(), ws.Message{
		Type:    ws.EventOracleUpdate,
		Payload: oracleReq,
	})

	log.Printf("🔔 Oracle ping sent for bridge %s", bridge.BridgeCode)
	return oracleReq, nil
}

// HandleResponse processes a provider's response (YES/NO)
func (o *Oracle) HandleResponse(ctx context.Context, requestID uuid.UUID, confirmed bool) error {
	status := models.OracleDeclined
	if confirmed {
		status = models.OracleConfirmed
	}

	now := time.Now()
	_, err := o.db.Exec(ctx, `
		UPDATE oracle_requests
		SET status = $1, responded_at = $2, response_text = $3
		WHERE id = $4
	`, status, now, func() string {
		if confirmed {
			return "YES - Confirmed"
		}
		return "NO - Declined"
	}(), requestID)
	if err != nil {
		return fmt.Errorf("oracle: failed to update response: %w", err)
	}

	// If confirmed, auto-reply to client
	if confirmed {
		if err := o.sendAutoConfirmation(ctx, requestID); err != nil {
			log.Printf("⚠️  Oracle: auto-confirmation failed: %v", err)
		}
	}

	// Broadcast update
	var bridgeID uuid.UUID
	o.db.QueryRow(ctx, `SELECT bridge_id FROM oracle_requests WHERE id = $1`, requestID).Scan(&bridgeID)
	
	o.hub.BroadcastToBridge(bridgeID.String(), ws.Message{
		Type: ws.EventOracleUpdate,
		Payload: map[string]any{
			"request_id": requestID,
			"status":     status,
			"confirmed":  confirmed,
		},
	})

	return nil
}

func (o *Oracle) sendAutoConfirmation(ctx context.Context, requestID uuid.UUID) error {
	var (
		bridgeID uuid.UUID
		query    string
	)
	err := o.db.QueryRow(ctx, `
		SELECT bridge_id, query_text FROM oracle_requests WHERE id = $1
	`, requestID).Scan(&bridgeID, &query)
	if err != nil {
		return err
	}

	var (
		sourceAID       uuid.UUID
		sourceAPlatform models.Platform
		sourceAName     string
	)
	err = o.db.QueryRow(ctx, `
		SELECT source_a_id, source_a_platform, source_a_name FROM bridges WHERE id = $1
	`, bridgeID).Scan(&sourceAID, &sourceAPlatform, &sourceAName)
	if err != nil {
		return err
	}

	// Send auto-confirmation to client
	reply := darp.UniversalReply{
		RecipientID: sourceAID.String(),
		MsgType:     models.MsgText,
		Content:     fmt.Sprintf("✅ Great news, %s!\n\nYour request has been CONFIRMED by the provider.\n\n📋 Request: %s\n\nWe'll coordinate the next steps for you!", sourceAName, query),
	}

	if err := o.router.SendReply(sourceAPlatform, reply); err != nil {
		return err
	}

	// Mark auto-reply as sent
	_, err = o.db.Exec(ctx, `
		UPDATE oracle_requests SET auto_reply_sent = true WHERE id = $1
	`, requestID)
	return err
}

// StartExpiryChecker periodically checks for expired oracle requests
func (o *Oracle) StartExpiryChecker(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				o.expireOldRequests(ctx)
			}
		}
	}()
}

func (o *Oracle) expireOldRequests(ctx context.Context) {
	result, err := o.db.Exec(ctx, `
		UPDATE oracle_requests
		SET status = 'expired'
		WHERE status = 'pending' AND expires_at < NOW()
	`)
	if err != nil {
		log.Printf("⚠️  Oracle: failed to expire requests: %v", err)
		return
	}

	if result.RowsAffected() > 0 {
		log.Printf("⏰ Oracle: expired %d requests", result.RowsAffected())
	}
}
