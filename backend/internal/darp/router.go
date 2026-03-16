package darp

import (
	"fmt"
	"log"
	"sync"

	"bribox/internal/models"
)

// ── Router — The Webhook Multiplexer ────────────────────────
//
// The Router holds registered PlatformAdapters and routes
// incoming webhook traffic to the correct adapter based on
// the platform identifier.

type Router struct {
	mu       sync.RWMutex
	adapters map[models.Platform]PlatformAdapter
	handlers []MessageHandler
}

// MessageHandler is called when a message is received and parsed
type MessageHandler func(msg UniversalMessage) error

// NewRouter creates a new DARP Router
func NewRouter() *Router {
	return &Router{
		adapters: make(map[models.Platform]PlatformAdapter),
	}
}

// Register adds a platform adapter to the router
func (r *Router) Register(adapter PlatformAdapter) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.adapters[adapter.Platform()] = adapter
	log.Printf("🔌 DARP: Registered adapter for %s", adapter.Platform())
}

// OnMessage adds a handler called when messages arrive
func (r *Router) OnMessage(handler MessageHandler) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.handlers = append(r.handlers, handler)
}

// GetAdapter returns the adapter for a platform
func (r *Router) GetAdapter(platform models.Platform) (PlatformAdapter, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	adapter, ok := r.adapters[platform]
	if !ok {
		return nil, fmt.Errorf("DARP: no adapter registered for platform %s", platform)
	}
	return adapter, nil
}

// RouteWebhook processes a raw webhook payload for a given platform
func (r *Router) RouteWebhook(platform models.Platform, signature string, body []byte) ([]UniversalMessage, error) {
	adapter, err := r.GetAdapter(platform)
	if err != nil {
		return nil, err
	}

	// Validate webhook signature
	if !adapter.ValidateWebhook(signature, body) {
		return nil, fmt.Errorf("DARP: invalid webhook signature for %s", platform)
	}

	// Parse webhook into universal messages
	messages, err := adapter.ParseWebhook(body)
	if err != nil {
		return nil, fmt.Errorf("DARP: failed to parse %s webhook: %w", platform, err)
	}

	// Dispatch to all registered handlers
	r.mu.RLock()
	handlers := make([]MessageHandler, len(r.handlers))
	copy(handlers, r.handlers)
	r.mu.RUnlock()

	for _, msg := range messages {
		for _, handler := range handlers {
			if err := handler(msg); err != nil {
				log.Printf("⚠️  DARP handler error: %v", err)
			}
		}
	}

	return messages, nil
}

// SendReply sends a message through the appropriate platform adapter
func (r *Router) SendReply(platform models.Platform, reply UniversalReply) error {
	adapter, err := r.GetAdapter(platform)
	if err != nil {
		return err
	}
	return adapter.SendMessage(reply)
}

// ListPlatforms returns all registered platforms
func (r *Router) ListPlatforms() []models.Platform {
	r.mu.RLock()
	defer r.mu.RUnlock()

	platforms := make([]models.Platform, 0, len(r.adapters))
	for p := range r.adapters {
		platforms = append(platforms, p)
	}
	return platforms
}
