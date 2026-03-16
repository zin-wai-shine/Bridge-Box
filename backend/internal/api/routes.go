package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"bribox/internal/darp"
	"bribox/internal/magiclink"
	"bribox/internal/media"
	"bribox/internal/models"
	"bribox/internal/oracle"
	"bribox/internal/ws"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterRoutes(app *fiber.App, db *pgxpool.Pool, rdb *redis.Client, hub *ws.Hub) {
	// ── Initialize DARP Router ──────────────────────────────
	darpRouter := darp.NewRouter()
	darpRouter.Register(darp.NewLineAdapter("", ""))
	darpRouter.Register(darp.NewTelegramAdapter(""))
	darpRouter.Register(darp.NewWhatsAppAdapter("", "", ""))
	darpRouter.Register(darp.NewMessengerAdapter("", "", ""))

	// ── Initialize Modules ──────────────────────────────────
	mediaPipeline := media.NewPipeline(rdb)
	oracleEngine := oracle.NewOracle(db, darpRouter, hub)
	magicConnector := magiclink.NewConnector(db, "https://bribox.io")

	// Start background workers
	ctx := context.Background()
	mediaPipeline.StartWorker(ctx)
	oracleEngine.StartExpiryChecker(ctx)

	// Wire DARP message handler → WebSocket broadcast
	darpRouter.OnMessage(func(msg darp.UniversalMessage) error {
		hub.BroadcastToAll(ws.Message{
			Type:    ws.EventNewMessage,
			Payload: msg,
		})
		return nil
	})

	// ── Health ──────────────────────────────────────────────
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "bribox-api",
			"version": "1.0.0",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// ── WebSocket ───────────────────────────────────────────
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws", websocket.New(ws.HandleWebSocket(hub)))

	// ── Bridges API ─────────────────────────────────────────
	bridges := app.Group("/api/bridges")

	bridges.Get("/", func(c *fiber.Ctx) error {
		rows, err := db.Query(ctx, `
			SELECT id, bridge_code, source_a_name, source_a_platform,
				   source_b_name, source_b_platform, status,
				   auto_translate, auto_ai, oracle_enabled,
				   message_count, last_activity, created_at
			FROM bridges ORDER BY last_activity DESC
		`)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		defer rows.Close()

		var bridgeList []models.Bridge
		for rows.Next() {
			var b models.Bridge
			if err := rows.Scan(
				&b.ID, &b.BridgeCode, &b.SourceAName, &b.SourceAPlatform,
				&b.SourceBName, &b.SourceBPlatform, &b.Status,
				&b.AutoTranslate, &b.AutoAI, &b.OracleEnabled,
				&b.MessageCount, &b.LastActivity, &b.CreatedAt,
			); err != nil {
				continue
			}
			bridgeList = append(bridgeList, b)
		}

		return c.JSON(fiber.Map{"bridges": bridgeList, "count": len(bridgeList)})
	})

	bridges.Post("/", func(c *fiber.Ctx) error {
		var input struct {
			SourceAName     string `json:"source_a_name"`
			SourceAPlatform string `json:"source_a_platform"`
			SourceBName     string `json:"source_b_name"`
			SourceBPlatform string `json:"source_b_platform"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
		}

		bridgeID := uuid.New()
		bridgeCode := fmt.Sprintf("BRX-%s", bridgeID.String()[:8])
		sourceAID := uuid.New()
		sourceBID := uuid.New()

		// Create connections
		for _, conn := range []struct {
			id       uuid.UUID
			platform string
			name     string
		}{
			{sourceAID, input.SourceAPlatform, input.SourceAName},
			{sourceBID, input.SourceBPlatform, input.SourceBName},
		} {
			_, err := db.Exec(ctx, `
				INSERT INTO connections (id, platform, platform_id, display_name)
				VALUES ($1, $2, $3, $4)
			`, conn.id, conn.platform, conn.id.String(), conn.name)
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": err.Error()})
			}
		}

		// Create bridge
		_, err := db.Exec(ctx, `
			INSERT INTO bridges (id, bridge_code, source_a_id, source_a_name, source_a_platform,
								source_b_id, source_b_name, source_b_platform)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, bridgeID, bridgeCode, sourceAID, input.SourceAName, input.SourceAPlatform,
			sourceBID, input.SourceBName, input.SourceBPlatform)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		hub.BroadcastToAll(ws.Message{
			Type: ws.EventBridgeUpdate,
			Payload: fiber.Map{
				"action":    "created",
				"bridge_id": bridgeID,
			},
		})

		return c.Status(201).JSON(fiber.Map{
			"id":          bridgeID,
			"bridge_code": bridgeCode,
		})
	})

	bridges.Get("/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		var b models.Bridge
		err := db.QueryRow(ctx, `
			SELECT id, bridge_code, source_a_name, source_a_platform,
				   source_b_name, source_b_platform, status,
				   auto_translate, auto_ai, oracle_enabled,
				   message_count, last_activity, created_at
			FROM bridges WHERE id = $1
		`, id).Scan(
			&b.ID, &b.BridgeCode, &b.SourceAName, &b.SourceAPlatform,
			&b.SourceBName, &b.SourceBPlatform, &b.Status,
			&b.AutoTranslate, &b.AutoAI, &b.OracleEnabled,
			&b.MessageCount, &b.LastActivity, &b.CreatedAt,
		)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "bridge not found"})
		}
		return c.JSON(b)
	})

	// ── Toggle endpoints ────────────────────────────────────
	bridges.Patch("/:id/toggle", func(c *fiber.Ctx) error {
		id := c.Params("id")
		var input struct {
			Field string `json:"field"` // auto_translate, auto_ai, oracle_enabled
			Value bool   `json:"value"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
		}

		allowed := map[string]bool{"auto_translate": true, "auto_ai": true, "oracle_enabled": true}
		if !allowed[input.Field] {
			return c.Status(400).JSON(fiber.Map{"error": "invalid toggle field"})
		}

		_, err := db.Exec(ctx, fmt.Sprintf(`UPDATE bridges SET %s = $1 WHERE id = $2`, input.Field), input.Value, id)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		hub.BroadcastToBridge(id, ws.Message{
			Type: ws.EventToggleUpdate,
			Payload: fiber.Map{
				"bridge_id": id,
				"field":     input.Field,
				"value":     input.Value,
			},
		})

		return c.JSON(fiber.Map{"ok": true, "field": input.Field, "value": input.Value})
	})

	// ── Messages API ────────────────────────────────────────
	messages := app.Group("/api/messages")

	messages.Get("/:bridge_id", func(c *fiber.Ctx) error {
		bridgeID := c.Params("bridge_id")
		limit := c.QueryInt("limit", 50)
		offset := c.QueryInt("offset", 0)

		rows, err := db.Query(ctx, `
			SELECT id, bridge_id, connection_id, direction, msg_type,
				   content, media_url, translated, is_read, created_at
			FROM unified_messages
			WHERE bridge_id = $1
			ORDER BY created_at ASC
			LIMIT $2 OFFSET $3
		`, bridgeID, limit, offset)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		defer rows.Close()

		var messageList []models.UnifiedMessage
		for rows.Next() {
			var m models.UnifiedMessage
			if err := rows.Scan(
				&m.ID, &m.BridgeID, &m.ConnectionID, &m.Direction, &m.MsgType,
				&m.Content, &m.MediaURL, &m.Translated, &m.IsRead, &m.CreatedAt,
			); err != nil {
				continue
			}
			messageList = append(messageList, m)
		}

		return c.JSON(fiber.Map{"messages": messageList, "count": len(messageList)})
	})

	messages.Post("/", func(c *fiber.Ctx) error {
		var input struct {
			BridgeID     string `json:"bridge_id"`
			ConnectionID string `json:"connection_id"`
			Direction    string `json:"direction"`
			MsgType      string `json:"msg_type"`
			Content      string `json:"content"`
			MediaURL     string `json:"media_url"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
		}

		msgID := uuid.New()
		_, err := db.Exec(ctx, `
			INSERT INTO unified_messages (id, bridge_id, connection_id, direction, msg_type, content, media_url)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, msgID, input.BridgeID, input.ConnectionID, input.Direction, input.MsgType, input.Content, input.MediaURL)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		// Update bridge activity
		db.Exec(ctx, `UPDATE bridges SET message_count = message_count + 1, last_activity = NOW() WHERE id = $1`, input.BridgeID)

		// WS broadcast
		hub.BroadcastToBridge(input.BridgeID, ws.Message{
			Type: ws.EventNewMessage,
			Payload: fiber.Map{
				"id":         msgID,
				"bridge_id":  input.BridgeID,
				"direction":  input.Direction,
				"msg_type":   input.MsgType,
				"content":    input.Content,
				"media_url":  input.MediaURL,
				"created_at": time.Now(),
			},
		})

		return c.Status(201).JSON(fiber.Map{"id": msgID})
	})

	// ── Webhook Multiplexer ─────────────────────────────────
	webhooks := app.Group("/api/webhooks")

	for _, platform := range []models.Platform{
		models.PlatformLine, models.PlatformMessenger,
		models.PlatformWhatsApp, models.PlatformTelegram,
	} {
		p := platform // capture
		webhooks.Post("/"+string(p), func(c *fiber.Ctx) error {
			sig := c.Get("X-Line-Signature")
			if sig == "" {
				sig = c.Get("X-Hub-Signature-256")
			}

			messages, err := darpRouter.RouteWebhook(p, sig, c.Body())
			if err != nil {
				log.Printf("⚠️  Webhook error (%s): %v", p, err)
				return c.Status(400).JSON(fiber.Map{"error": err.Error()})
			}

			return c.JSON(fiber.Map{"ok": true, "messages_processed": len(messages)})
		})
	}

	// ── Oracle API ──────────────────────────────────────────
	oracleAPI := app.Group("/api/oracle")

	oracleAPI.Post("/ping", func(c *fiber.Ctx) error {
		var input struct {
			BridgeID  string `json:"bridge_id"`
			QueryText string `json:"query_text"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
		}

		bridgeID, err := uuid.Parse(input.BridgeID)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid bridge_id"})
		}

		req, err := oracleEngine.PingProvider(ctx, bridgeID, input.QueryText)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		return c.Status(201).JSON(req)
	})

	oracleAPI.Post("/respond/:id", func(c *fiber.Ctx) error {
		requestID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid request id"})
		}

		var input struct {
			Confirmed bool `json:"confirmed"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
		}

		if err := oracleEngine.HandleResponse(ctx, requestID, input.Confirmed); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		return c.JSON(fiber.Map{"ok": true})
	})

	// ── Media Sniper API ────────────────────────────────────
	mediaAPI := app.Group("/api/media")

	mediaAPI.Post("/process", func(c *fiber.Ctx) error {
		var input struct {
			SourceURL   string `json:"source_url"`
			BridgeID    string `json:"bridge_id"`
			Upscale     bool   `json:"upscale"`
			DeWatermark bool   `json:"de_watermark"`
			CleanMeta   bool   `json:"clean_meta"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
		}

		jobID, err := mediaPipeline.Enqueue(ctx, input.SourceURL, input.BridgeID, "", input.Upscale, input.DeWatermark, input.CleanMeta)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		return c.Status(202).JSON(fiber.Map{"job_id": jobID, "status": "queued"})
	})

	mediaAPI.Get("/status/:id", func(c *fiber.Ctx) error {
		result, err := mediaPipeline.GetResult(ctx, c.Params("id"))
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		if result == nil {
			return c.JSON(fiber.Map{"status": "processing"})
		}
		return c.JSON(result)
	})

	// ── Magic Link API ──────────────────────────────────────
	magicAPI := app.Group("/api/magic")

	magicAPI.Post("/generate", func(c *fiber.Ctx) error {
		var input struct {
			BridgeID       string `json:"bridge_id"`
			TargetPlatform string `json:"target_platform"`
			MaxUses        int    `json:"max_uses"`
			ExpiresHours   int    `json:"expires_hours"`
		}
		if err := c.BodyParser(&input); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid body"})
		}

		var bridgeID *uuid.UUID
		if input.BridgeID != "" {
			parsed, err := uuid.Parse(input.BridgeID)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "invalid bridge_id"})
			}
			bridgeID = &parsed
		}

		maxUses := input.MaxUses
		if maxUses == 0 {
			maxUses = 1
		}
		expiresIn := time.Duration(input.ExpiresHours) * time.Hour
		if expiresIn == 0 {
			expiresIn = 7 * 24 * time.Hour
		}

		link, err := magicConnector.Generate(ctx, bridgeID, models.Platform(input.TargetPlatform), maxUses, expiresIn)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		return c.Status(201).JSON(fiber.Map{
			"link":  link,
			"url":   magicConnector.GetURL(link.Token),
		})
	})

	magicAPI.Get("/resolve/:token", func(c *fiber.Ctx) error {
		link, err := magicConnector.Resolve(ctx, c.Params("token"))
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(link)
	})

	// ── Dashboard Stats ─────────────────────────────────────
	app.Get("/api/stats", func(c *fiber.Ctx) error {
		var stats struct {
			TotalBridges  int `json:"total_bridges"`
			ActiveBridges int `json:"active_bridges"`
			TotalMessages int `json:"total_messages"`
			PendingOracle int `json:"pending_oracle"`
			MediaJobs     int `json:"media_jobs_today"`
		}

		db.QueryRow(ctx, `SELECT COUNT(*) FROM bridges`).Scan(&stats.TotalBridges)
		db.QueryRow(ctx, `SELECT COUNT(*) FROM bridges WHERE status = 'active'`).Scan(&stats.ActiveBridges)
		db.QueryRow(ctx, `SELECT COUNT(*) FROM unified_messages`).Scan(&stats.TotalMessages)
		db.QueryRow(ctx, `SELECT COUNT(*) FROM oracle_requests WHERE status = 'pending'`).Scan(&stats.PendingOracle)
		db.QueryRow(ctx, `SELECT COUNT(*) FROM media_jobs WHERE created_at > NOW() - INTERVAL '24 hours'`).Scan(&stats.MediaJobs)

		// Get per-platform connection counts
		type PlatformCount struct {
			Platform string `json:"platform"`
			Count    int    `json:"count"`
		}
		rows, _ := db.Query(ctx, `SELECT platform, COUNT(*) FROM connections GROUP BY platform`)
		var platforms []PlatformCount
		if rows != nil {
			defer rows.Close()
			for rows.Next() {
				var pc PlatformCount
				rows.Scan(&pc.Platform, &pc.Count)
				platforms = append(platforms, pc)
			}
		}

		return c.JSON(fiber.Map{
			"stats":     stats,
			"platforms": platforms,
			"uptime":    time.Now().Format(time.RFC3339),
		})
	})

	_ = json.Marshal // ensure import
	log.Println("✅ All API routes registered")
}
