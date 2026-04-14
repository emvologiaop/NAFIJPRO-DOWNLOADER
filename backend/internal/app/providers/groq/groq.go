package groq

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"sync"
	"time"

	"internal/app/providers"
)

// Groq implements the Provider interface for Groq API
type Groq struct {
	config  providers.ProviderConfig
	metrics providers.ProviderMetrics
	client  *http.Client
	mu      sync.RWMutex
}

// OpenAI-compatible message format
type Message struct {
	Role    string `json:"role"`
	Content any    `json:"content"` // string or []ContentBlock
}

type ContentBlock struct {
	Type     string `json:"type"`
	Text     string `json:"text,omitempty"`
	ImageURL any    `json:"image_url,omitempty"`
}

type ImageURL struct {
	URL    string `json:"url"`
	Detail string `json:"detail,omitempty"` // "low", "high", "auto"
}

type ChatCompletionRequest struct {
	Model            string    `json:"model"`
	Messages         []Message `json:"messages"`
	MaxTokens        int       `json:"max_tokens,omitempty"`
	Temperature      float64   `json:"temperature,omitempty"`
	TopP             float64   `json:"top_p,omitempty"`
	Stream           bool      `json:"stream"`
	PresencePenalty  float64   `json:"presence_penalty,omitempty"`
	FrequencyPenalty float64   `json:"frequency_penalty,omitempty"`
}

type ChatCompletionResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index   int `json:"index"`
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// New creates a new Groq provider
func New(config providers.ProviderConfig) *Groq {
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}

	return &Groq{
		config: config,
		client: &http.Client{
			Timeout: config.Timeout,
		},
		metrics: providers.ProviderMetrics{
			LastSuccessTime: time.Now(),
		},
	}
}

// Name returns the provider name
func (g *Groq) Name() string {
	return "groq"
}

// Chat sends a request to Groq API
func (g *Groq) Chat(ctx context.Context, req *providers.ChatRequest) (*providers.ChatResponse, error) {
	g.mu.Lock()
	g.metrics.TotalRequests++
	g.mu.Unlock()

	// Build message content
	var content any
	if req.Image != nil {
		// Multimodal request
		content = []ContentBlock{
			{
				Type: "text",
				Text: req.Message,
			},
			{
				Type: "image_url",
				ImageURL: ImageURL{
					URL:    req.Image.URL,
					Detail: "auto",
				},
			},
		}
	} else {
		content = req.Message
	}

	chatReq := ChatCompletionRequest{
		Model: req.Model,
		Messages: []Message{
			{
				Role:    "user",
				Content: content,
			},
		},
		MaxTokens:   4096,
		Temperature: 0.7,
		Stream:      false,
	}

	// Marshal request
	body, err := json.Marshal(chatReq)
	if err != nil {
		g.recordError(err)
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "POST", g.config.APIEndpoint, bytes.NewReader(body))
	if err != nil {
		g.recordError(err)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", g.config.APIKey))
	httpReq.Header.Set("Content-Type", "application/json")

	// Execute request
	httpResp, err := g.client.Do(httpReq)
	if err != nil {
		g.recordError(err)
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer httpResp.Body.Close()

	// Read response
	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		g.recordError(err)
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Check for errors
	if httpResp.StatusCode != 200 {
		var errorResp map[string]interface{}
		json.Unmarshal(respBody, &errorResp)
		errMsg := fmt.Sprintf("Groq API error: %d", httpResp.StatusCode)
		if msg, ok := errorResp["error"].(map[string]interface{}); ok {
			if m, ok := msg["message"].(string); ok {
				errMsg = m
			}
		}

		err := errors.New(errMsg)
		g.recordError(err)

		// Check for rate limiting
		if httpResp.StatusCode == 429 {
			return &providers.ChatResponse{
				Success:  false,
				Provider: g.Name(),
				Error:    "Rate limited",
				RateLimit: &providers.RateLimitInfo{
					Reset: time.Now().Add(time.Minute),
				},
			}, err
		}

		return &providers.ChatResponse{
			Success:  false,
			Provider: g.Name(),
			Error:    errMsg,
		}, err
	}

	// Parse response
	var chatResp ChatCompletionResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		g.recordError(err)
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		err := errors.New("no choices in response")
		g.recordError(err)
		return nil, err
	}

	// Record success
	cost := g.calculateCost(chatResp.Usage.PromptTokens, chatResp.Usage.CompletionTokens)
	g.recordSuccess(chatResp.Usage.TotalTokens, cost)

	return &providers.ChatResponse{
		Success:    true,
		Text:       chatResp.Choices[0].Message.Content,
		Model:      chatResp.Model,
		Provider:   g.Name(),
		TokensUsed: chatResp.Usage.TotalTokens,
		CostUSD:    cost,
		RateLimit: &providers.RateLimitInfo{
			Remaining: parseRateLimit(httpResp.Header.Get("x-ratelimit-remaining-requests")),
			Reset:     parseRateLimitReset(httpResp.Header.Get("x-ratelimit-reset-requests")),
		},
	}, nil
}

// IsAvailable checks if the provider is available
func (g *Groq) IsAvailable(ctx context.Context) bool {
	return g.HealthCheck(ctx) == nil
}

// GetStatus returns provider status
func (g *Groq) GetStatus() providers.ProviderStatus {
	g.mu.RLock()
	defer g.mu.RUnlock()

	status := providers.ProviderStatus{
		Name:            g.Name(),
		IsAvailable:     g.metrics.FailureCount < 3,
		FailureCount:    g.metrics.FailureCount,
		LastSuccessTime: g.metrics.LastSuccessTime,
		LastError:       g.metrics.LastError,
	}

	if g.metrics.TotalRequests > 0 {
		status.ErrorRate = float64(g.metrics.FailureCount) / float64(g.metrics.TotalRequests)
	}

	return status
}

// RecordError records an error
func (g *Groq) RecordError(err error) {
	g.recordError(err)
}

func (g *Groq) recordError(err error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.metrics.FailureCount++
	g.metrics.LastFailureTime = time.Now()
	g.metrics.LastError = err.Error()
}

// RecordSuccess records a successful request
func (g *Groq) RecordSuccess(tokensUsed int, cost float64) {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.metrics.SuccessCount++
	g.metrics.TotalTokens += tokensUsed
	g.metrics.TotalCost += cost
	g.metrics.LastSuccessTime = time.Now()
}

// HealthCheck performs a health check
func (g *Groq) HealthCheck(ctx context.Context) error {
	// Quick check: verify API key format
	if g.config.APIKey == "" {
		return errors.New("no API key configured")
	}

	// Try a minimal request
	timeoutCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	chatReq := ChatCompletionRequest{
		Model: g.config.Model,
		Messages: []Message{
			{
				Role:    "user",
				Content: "Hi",
			},
		},
		MaxTokens: 10,
		Stream:    false,
	}

	body, _ := json.Marshal(chatReq)
	httpReq, _ := http.NewRequestWithContext(timeoutCtx, "POST", g.config.APIEndpoint, bytes.NewReader(body))
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", g.config.APIKey))
	httpReq.Header.Set("Content-Type", "application/json")

	httpResp, err := g.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != 200 {
		return fmt.Errorf("health check returned status %d", httpResp.StatusCode)
	}

	return nil
}

// calculateCost estimates the cost based on Groq's pricing
// Groq pricing: $0.0005/1K input tokens, $0.0015/1K output tokens (as of 2024)
func (g *Groq) calculateCost(promptTokens, completionTokens int) float64 {
	inputCost := float64(promptTokens) / 1000.0 * 0.0005
	outputCost := float64(completionTokens) / 1000.0 * 0.0015
	return inputCost + outputCost
}

// parseRateLimit parses rate limit remaining from header
func parseRateLimit(header string) int {
	if header == "" {
		return -1
	}
	val, _ := strconv.Atoi(header)
	return val
}

// parseRateLimitReset parses rate limit reset time from header
func parseRateLimitReset(header string) time.Time {
	if header == "" {
		return time.Now().Add(time.Minute)
	}
	duration, _ := time.ParseDuration(header)
	return time.Now().Add(duration)
}
