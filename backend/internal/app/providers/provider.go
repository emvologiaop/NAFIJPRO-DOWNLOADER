package providers

import "context"

// Provider interface defines the contract for AI providers
type Provider interface {
	// Name returns the provider identifier
	Name() string

	// Chat sends a chat request to the provider
	Chat(ctx context.Context, req *ChatRequest) (*ChatResponse, error)

	// IsAvailable checks if the provider is currently available
	IsAvailable(ctx context.Context) bool

	// GetStatus returns current provider status
	GetStatus() ProviderStatus

	// RecordError records an error occurrence
	RecordError(err error)

	// RecordSuccess records a successful request
	RecordSuccess(tokensUsed int, cost float64)

	// HealthCheck performs a quick health check on the provider
	HealthCheck(ctx context.Context) error
}

// ProviderFactory creates provider instances
type ProviderFactory interface {
	Create(config ProviderConfig) (Provider, error)
}
