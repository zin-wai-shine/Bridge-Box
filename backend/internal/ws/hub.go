package ws

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/contrib/websocket"
)

// ── WebSocket Event Types ───────────────────────────────────

type EventType string

const (
	EventNewMessage    EventType = "new_message"
	EventBridgeUpdate  EventType = "bridge_update"
	EventOracleUpdate  EventType = "oracle_update"
	EventMediaUpdate   EventType = "media_update"
	EventToggleUpdate  EventType = "toggle_update"
	EventTypingStart   EventType = "typing_start"
	EventTypingStop    EventType = "typing_stop"
	EventPresence      EventType = "presence"
)

// ── WebSocket Message ───────────────────────────────────────

type Message struct {
	Type    EventType   `json:"type"`
	Payload interface{} `json:"payload"`
}

// ── Client ──────────────────────────────────────────────────

type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	BridgeID string // Subscribe to a specific bridge
	mu       sync.Mutex
}

// ── Hub — Central WebSocket coordinator ─────────────────────

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("🟢 WS Client connected (total: %d)", len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("🔴 WS Client disconnected (total: %d)", len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastToAll sends a message to all connected clients
func (h *Hub) BroadcastToAll(msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("⚠️  WS marshal error: %v", err)
		return
	}
	h.broadcast <- data
}

// BroadcastToBridge sends a message to clients watching a specific bridge
func (h *Hub) BroadcastToBridge(bridgeID string, msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("⚠️  WS marshal error: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if client.BridgeID == bridgeID || client.BridgeID == "" {
			select {
			case client.Send <- data:
			default:
				close(client.Send)
				delete(h.clients, client)
			}
		}
	}
}

// Register a new client
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister a client
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// HandleWebSocket handles a new WebSocket connection
func HandleWebSocket(hub *Hub) func(*websocket.Conn) {
	return func(c *websocket.Conn) {
		client := &Client{
			Hub:      hub,
			Conn:     c,
			Send:     make(chan []byte, 256),
			BridgeID: c.Query("bridge_id"),
		}

		hub.Register(client)
		defer hub.Unregister(client)

		// Writer goroutine
		go func() {
			for msg := range client.Send {
				client.mu.Lock()
				if err := c.WriteMessage(websocket.TextMessage, msg); err != nil {
					client.mu.Unlock()
					return
				}
				client.mu.Unlock()
			}
		}()

		// Reader loop
		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				break
			}
			// Handle incoming WS messages (e.g., typing indicators)
			var wsMsg Message
			if err := json.Unmarshal(msg, &wsMsg); err == nil {
				switch wsMsg.Type {
				case EventTypingStart, EventTypingStop:
					hub.BroadcastToBridge(client.BridgeID, wsMsg)
				}
			}
		}
	}
}
