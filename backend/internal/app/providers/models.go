package providers

import "time"

// ChatRequest represents a request to chat with an AI provider
type ChatRequest struct {
	Message    string
	Image      *ImageData
	SessionKey string
	Model      string
	WebSearch  bool
}

// ImageData represents image data for multimodal requests
type ImageData struct {
	URL    string
	Base64 string
	Format string // "jpeg", "png", "gif", "webp", etc.
}

// ChatResponse represents response from AI provider
type ChatResponse struct {
	Success     bool
	Text        string
	Model       string
	SessionKey  string
	TokensUsed  int
	Provider    string
	Error       string
	RateLimit   *RateLimitInfo
	CostUSD     float64
}

// RateLimitInfo contains rate limiting information
type RateLimitInfo struct {
	Remaining     int
	Reset         time.Time
	LimitPerMin   int
	WindowSeconds int
}

// ProviderStatus represents the current status of a provider
type ProviderStatus struct {
	Name                 string
	IsAvailable          bool
	LastError            string
	RateLimitRemaining   int
	RateLimitReset       time.Time
	FailureCount         int
	LastSuccessTime      time.Time
	ErrorRate            float64
	AverageResponseTime  time.Duration
}

// ProviderConfig holds configuration for a provider
type ProviderConfig struct {
	Provider      string // "groq", "openai", etc.
	APIKey        string
	APIEndpoint   string
	Model         string
	Timeout       time.Duration
	PriorityOrder int
	Enabled       bool
}

// ProviderMetrics holds usage metrics for a provider
type ProviderMetrics struct {
	TotalRequests   int
	SuccessCount    int
	FailureCount    int
	TotalTokens     int
	TotalCost       float64
	LastSuccessTime time.Time
	LastFailureTime time.Time
	LastError       string
}
