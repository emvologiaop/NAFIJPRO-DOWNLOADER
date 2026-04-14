package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"time"

	"internal/app/providers"
)

// ChatHandler handles AI chat requests
type ChatHandler struct {
	providerManager *providers.Manager
}

// NewChatHandler creates a new chat handler
func NewChatHandler(pm *providers.Manager) *ChatHandler {
	return &ChatHandler{
		providerManager: pm,
	}
}

// ChatRequest is the API request format
type ChatRequest struct {
	Message   string `json:"message"`
	Model     string `json:"model,omitempty"`
	WebSearch bool   `json:"web_search,omitempty"`
	Image     struct {
		URL string `json:"url,omitempty"`
	} `json:"image,omitempty"`
}

// ChatErrorResponse represents an error response
type ChatErrorResponse struct {
	Error       string `json:"error"`
	Message     string `json:"message"`
	StatusCode  int    `json:"status_code"`
	RequestID   string `json:"request_id,omitempty"`
	RetryAfter  int    `json:"retry_after,omitempty"`
}

// ServeHTTP implements http.Handler for Chat
func (h *ChatHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read request body with size limit
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB limit
	defer r.Body.Close()

	var chatReq ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&chatReq); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if chatReq.Message == "" {
		writeErrorResponse(w, http.StatusBadRequest, "Message is required")
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 35*time.Second)
	defer cancel()

	// Build provider request
	providerReq := &providers.ChatRequest{
		Message: chatReq.Message,
	}

	if chatReq.Model != "" {
		providerReq.Model = chatReq.Model
	}

	if chatReq.Image.URL != "" {
		providerReq.Image = &providers.ImageData{
			URL:    chatReq.Image.URL,
			Format: "url",
		}
	}

	// Call provider manager
	resp, err := h.providerManager.Chat(ctx, providerReq)
	if err != nil {
		log.Printf("Chat error: %v", err)

		if ctxErr := ctx.Err(); ctxErr == context.DeadlineExceeded {
			writeErrorResponse(w, http.StatusGatewayTimeout, "Request timeout")
			return
		}

		if resp != nil && resp.RateLimit != nil {
			writeRateLimitResponse(w, resp)
			return
		}

		writeErrorResponse(w, http.StatusServiceUnavailable, "AI service unavailable")
		return
	}

	// Write success response
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Provider", resp.Provider)

	if resp.RateLimit != nil {
		w.Header().Set("X-RateLimit-Remaining", string(rune(resp.RateLimit.Remaining)))
		w.Header().Set("X-RateLimit-Reset", resp.RateLimit.Reset.Format(time.RFC3339))
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}

// StreamChatHandler handles streaming chat requests
type StreamChatHandler struct {
	providerManager *providers.Manager
}

// NewStreamChatHandler creates a new stream chat handler
func NewStreamChatHandler(pm *providers.Manager) *StreamChatHandler {
	return &StreamChatHandler{
		providerManager: pm,
	}
}

// ServeHTTP implements http.Handler for StreamChat
func (h *StreamChatHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Failed to read request")
		return
	}
	defer r.Body.Close()

	var chatReq ChatRequest
	if err := json.Unmarshal(body, &chatReq); err != nil {
		writeErrorResponse(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Validate required fields
	if chatReq.Message == "" {
		writeErrorResponse(w, http.StatusBadRequest, "Message is required")
		return
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 35*time.Second)
	defer cancel()

	// Build provider request
	providerReq := &providers.ChatRequest{
		Message: chatReq.Message,
	}

	if chatReq.Model != "" {
		providerReq.Model = chatReq.Model
	}

	// Set up SSE streaming
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeErrorResponse(w, http.StatusInternalServerError, "Streaming not supported")
		return
	}

	// Call provider
	resp, err := h.providerManager.Chat(ctx, providerReq)
	if err != nil {
		if ctxErr := ctx.Err(); ctxErr == context.DeadlineExceeded {
			writeSSEError(w, "Request timeout")
		} else {
			writeSSEError(w, "Provider error")
		}
		return
	}

	if !resp.Success {
		writeSSEError(w, resp.Error)
		return
	}

	// Stream response
	event := map[string]interface{}{
		"type":      "message",
		"text":      resp.Text,
		"provider":  resp.Provider,
		"model":     resp.Model,
		"tokens":    resp.TokensUsed,
		"cost_usd":  resp.CostUSD,
	}

	eventJSON, _ := json.Marshal(event)
	io.WriteString(w, "data: "+string(eventJSON)+"\n\n")
	flusher.Flush()

	// Send completion event
	io.WriteString(w, "event: done\ndata: {}\n\n")
	flusher.Flush()
}

// writeErrorResponse writes a JSON error response
func writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	resp := ChatErrorResponse{
		Error:      "error",
		Message:    message,
		StatusCode: statusCode,
	}

	json.NewEncoder(w).Encode(resp)
}

// writeRateLimitResponse writes a rate limit error response
func writeRateLimitResponse(w http.ResponseWriter, resp *providers.ChatResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusTooManyRequests)

	if resp.RateLimit != nil {
		w.Header().Set("Retry-After", string(rune(resp.RateLimit.LimitPerMin)))
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"error":   "rate_limited",
		"message": "Too many requests",
		"provider": resp.Provider,
	})
}

// writeSSEError writes a Server-Sent Event error
func writeSSEError(w http.ResponseWriter, message string) {
	event := map[string]interface{}{
		"type":    "error",
		"message": message,
	}

	eventJSON, _ := json.Marshal(event)
	io.WriteString(w, "data: "+string(eventJSON)+"\n\n")

	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}
}
