package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"bribox/internal/api"
	"bribox/internal/config"
	"bribox/internal/db"
	"bribox/internal/ws"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// ── Load config ─────────────────────────────────────────
	cfg := config.Load()

	// ── Connect to PostgreSQL ───────────────────────────────
	pgPool, err := db.ConnectPostgres(cfg)
	if err != nil {
		log.Fatalf("❌ Failed to connect to PostgreSQL: %v", err)
	}
	defer pgPool.Close()
	log.Println("✅ Connected to PostgreSQL")

	// ── Connect to Redis ────────────────────────────────────
	rdb, err := db.ConnectRedis(cfg)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}
	defer rdb.Close()
	log.Println("✅ Connected to Redis")

	// ── Initialize WebSocket Hub ────────────────────────────
	hub := ws.NewHub()
	go hub.Run()
	log.Println("✅ WebSocket Hub started")

	// ── Create Fiber app ────────────────────────────────────
	app := fiber.New(fiber.Config{
		AppName:               "Bribox.io API",
		ServerHeader:          "Bribox",
		ReadTimeout:           10 * time.Second,
		WriteTimeout:          10 * time.Second,
		IdleTimeout:           30 * time.Second,
		DisableStartupMessage: false,
	})

	// ── Middleware ───────────────────────────────────────────
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${method} ${path}\n",
		TimeFormat: "15:04:05",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	// ── Register routes ─────────────────────────────────────
	api.RegisterRoutes(app, pgPool, rdb, hub)

	// ── Start server ────────────────────────────────────────
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
			log.Fatalf("❌ Server error: %v", err)
		}
	}()

	log.Printf("🚀 Bribox.io API running on port %s", port)

	<-quit
	log.Println("⏳ Shutting down gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_ = ctx
	if err := app.Shutdown(); err != nil {
		log.Printf("⚠️  Shutdown error: %v", err)
	}

	log.Println("👋 Bribox.io API stopped")
}
