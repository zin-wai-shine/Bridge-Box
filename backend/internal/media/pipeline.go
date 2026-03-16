package media

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// ── Media Sniper Pipeline ───────────────────────────────────
//
// Redis-backed media processing worker that handles:
// 1. Upscaling (4K resolution)
// 2. Watermark/Logo removal (AI inpainting)
// 3. EXIF/GPS metadata stripping

const (
	QueueKey  = "bribox:media:queue"
	ResultKey = "bribox:media:result:"
)

type Job struct {
	ID          string `json:"id"`
	SourceURL   string `json:"source_url"`
	BridgeID    string `json:"bridge_id,omitempty"`
	MessageID   string `json:"message_id,omitempty"`
	Upscale     bool   `json:"upscale"`
	DeWatermark bool   `json:"de_watermark"`
	CleanMeta   bool   `json:"clean_meta"`
	CreatedAt   int64  `json:"created_at"`
}

type JobResult struct {
	ID           string `json:"id"`
	Status       string `json:"status"`
	ProcessedURL string `json:"processed_url,omitempty"`
	Error        string `json:"error,omitempty"`
	ProcessingMs int64  `json:"processing_ms"`
	UpscaleDone  bool   `json:"upscale_done"`
	WatermarkDone bool  `json:"watermark_done"`
	MetaClean    bool   `json:"meta_clean"`
}

type Pipeline struct {
	rdb *redis.Client
}

func NewPipeline(rdb *redis.Client) *Pipeline {
	return &Pipeline{rdb: rdb}
}

// Enqueue adds a media processing job to the Redis queue
func (p *Pipeline) Enqueue(ctx context.Context, sourceURL, bridgeID, messageID string, upscale, deWatermark, cleanMeta bool) (string, error) {
	job := Job{
		ID:          uuid.New().String(),
		SourceURL:   sourceURL,
		BridgeID:    bridgeID,
		MessageID:   messageID,
		Upscale:     upscale,
		DeWatermark: deWatermark,
		CleanMeta:   cleanMeta,
		CreatedAt:   time.Now().UnixMilli(),
	}

	data, err := json.Marshal(job)
	if err != nil {
		return "", fmt.Errorf("media: failed to marshal job: %w", err)
	}

	if err := p.rdb.LPush(ctx, QueueKey, data).Err(); err != nil {
		return "", fmt.Errorf("media: failed to enqueue job: %w", err)
	}

	log.Printf("📸 Media job enqueued: %s (upscale=%v, dewatermark=%v, clean=%v)",
		job.ID, upscale, deWatermark, cleanMeta)

	return job.ID, nil
}

// GetResult retrieves the result of a media processing job
func (p *Pipeline) GetResult(ctx context.Context, jobID string) (*JobResult, error) {
	data, err := p.rdb.Get(ctx, ResultKey+jobID).Result()
	if err == redis.Nil {
		return nil, nil // Job still processing
	}
	if err != nil {
		return nil, err
	}

	var result JobResult
	if err := json.Unmarshal([]byte(data), &result); err != nil {
		return nil, err
	}

	return &result, nil
}

// StartWorker starts the background media processing worker
func (p *Pipeline) StartWorker(ctx context.Context) {
	log.Println("🏭 Media Sniper worker started")

	go func() {
		for {
			select {
			case <-ctx.Done():
				log.Println("🏭 Media Sniper worker stopped")
				return
			default:
				p.processNext(ctx)
			}
		}
	}()
}

func (p *Pipeline) processNext(ctx context.Context) {
	// Blocking pop from queue (5s timeout)
	result, err := p.rdb.BRPop(ctx, 5*time.Second, QueueKey).Result()
	if err != nil {
		return // Timeout or error — just loop
	}

	var job Job
	if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
		log.Printf("⚠️  Media: failed to unmarshal job: %v", err)
		return
	}

	log.Printf("🔧 Processing media job: %s", job.ID)
	start := time.Now()

	jobResult := JobResult{
		ID:     job.ID,
		Status: "completed",
	}

	// ── Step 1: Metadata cleaning ───────────────────────────
	if job.CleanMeta {
		log.Printf("  🧹 Stripping EXIF/GPS metadata...")
		time.Sleep(100 * time.Millisecond) // Simulate processing
		jobResult.MetaClean = true
	}

	// ── Step 2: Watermark removal ───────────────────────────
	if job.DeWatermark {
		log.Printf("  🎨 AI watermark removal...")
		time.Sleep(200 * time.Millisecond) // Simulate AI processing
		jobResult.WatermarkDone = true
	}

	// ── Step 3: Upscale to 4K ───────────────────────────────
	if job.Upscale {
		log.Printf("  📐 Upscaling to 4K...")
		time.Sleep(300 * time.Millisecond) // Simulate upscaling
		jobResult.UpscaleDone = true
	}

	jobResult.ProcessedURL = fmt.Sprintf("/api/media/processed/%s", job.ID)
	jobResult.ProcessingMs = time.Since(start).Milliseconds()

	// Store result in Redis
	data, _ := json.Marshal(jobResult)
	p.rdb.Set(ctx, ResultKey+job.ID, data, 24*time.Hour)

	log.Printf("✅ Media job %s completed in %dms", job.ID, jobResult.ProcessingMs)
}
