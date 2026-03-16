package magiclink

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"bribox/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ── Magic Link Connector (Module D) ─────────────────────────
//
// Generates UUID URLs that, when clicked by external parties,
// securely tunnel their native chat app data into the Bribox dashboard.

type Connector struct {
	db      *pgxpool.Pool
	baseURL string
}

func NewConnector(db *pgxpool.Pool, baseURL string) *Connector {
	return &Connector{
		db:      db,
		baseURL: baseURL,
	}
}

// Generate creates a new magic link for a bridge
func (c *Connector) Generate(ctx context.Context, bridgeID *uuid.UUID, targetPlatform models.Platform, maxUses int, expiresIn time.Duration) (*models.MagicLink, error) {
	token, err := generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("magiclink: failed to generate token: %w", err)
	}

	id := uuid.New()
	expiresAt := time.Now().Add(expiresIn)

	_, err = c.db.Exec(ctx, `
		INSERT INTO magic_links (id, bridge_id, token, target_platform, expires_at, max_uses)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, id, bridgeID, token, targetPlatform, expiresAt, maxUses)
	if err != nil {
		return nil, fmt.Errorf("magiclink: failed to create link: %w", err)
	}

	link := &models.MagicLink{
		ID:             id,
		BridgeID:       bridgeID,
		Token:          token,
		TargetPlatform: targetPlatform,
		ExpiresAt:      expiresAt,
		MaxUses:        maxUses,
		UseCount:       0,
		IsActive:       true,
		CreatedAt:      time.Now(),
	}

	log.Printf("🔗 Magic Link created: %s/m/%s (platform: %s, expires: %s)",
		c.baseURL, token, targetPlatform, expiresAt.Format(time.RFC3339))

	return link, nil
}

// Resolve validates and processes a magic link token
func (c *Connector) Resolve(ctx context.Context, token string) (*models.MagicLink, error) {
	var link models.MagicLink
	err := c.db.QueryRow(ctx, `
		SELECT id, bridge_id, token, target_platform, expires_at, max_uses, use_count, is_active
		FROM magic_links
		WHERE token = $1
	`, token).Scan(
		&link.ID, &link.BridgeID, &link.Token, &link.TargetPlatform,
		&link.ExpiresAt, &link.MaxUses, &link.UseCount, &link.IsActive,
	)
	if err != nil {
		return nil, fmt.Errorf("magiclink: invalid or expired link")
	}

	// Validate
	if !link.IsActive {
		return nil, fmt.Errorf("magiclink: link is deactivated")
	}
	if time.Now().After(link.ExpiresAt) {
		return nil, fmt.Errorf("magiclink: link has expired")
	}
	if link.UseCount >= link.MaxUses {
		return nil, fmt.Errorf("magiclink: link has reached max uses")
	}

	// Increment use count
	_, err = c.db.Exec(ctx, `
		UPDATE magic_links SET use_count = use_count + 1 WHERE id = $1
	`, link.ID)
	if err != nil {
		return nil, fmt.Errorf("magiclink: failed to update use count: %w", err)
	}

	link.UseCount++
	return &link, nil
}

// Claim associates a connection with a magic link
func (c *Connector) Claim(ctx context.Context, token string, connectionID uuid.UUID) error {
	now := time.Now()
	_, err := c.db.Exec(ctx, `
		UPDATE magic_links
		SET claimed_by = $1, claimed_at = $2
		WHERE token = $3
	`, connectionID, now, token)
	if err != nil {
		return fmt.Errorf("magiclink: failed to claim link: %w", err)
	}

	log.Printf("🔗 Magic Link claimed: %s by connection %s", token, connectionID)
	return nil
}

// Deactivate disables a magic link
func (c *Connector) Deactivate(ctx context.Context, linkID uuid.UUID) error {
	_, err := c.db.Exec(ctx, `
		UPDATE magic_links SET is_active = false WHERE id = $1
	`, linkID)
	return err
}

// GetURL returns the full magic link URL
func (c *Connector) GetURL(token string) string {
	return fmt.Sprintf("%s/m/%s", c.baseURL, token)
}

func generateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
