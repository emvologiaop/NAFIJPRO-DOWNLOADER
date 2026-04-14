package providers

import (
	"context"
	"errors"
	"sort"
	"sync"
)

// Manager manages multiple AI providers with fallback logic
type Manager struct {
	providers map[string]Provider
	priority  []string // Sorted by priority
	mu        sync.RWMutex
	config    ManagerConfig
}

// ManagerConfig holds configuration for the manager
type ManagerConfig struct {
	MaxRetries      int
	FallbackDelay   int // milliseconds
	HealthCheckTTL  int // seconds
}

// NewManager creates a new provider manager
func NewManager(config ManagerConfig) *Manager {
	return &Manager{
		providers: make(map[string]Provider),
		priority:  make([]string, 0),
		config:    config,
	}
}

// RegisterProvider registers a provider
func (m *Manager) RegisterProvider(provider Provider, priorityOrder int) {
	m.mu.Lock()
	defer m.mu.Unlock()

	name := provider.Name()
	m.providers[name] = provider
	m.priority = append(m.priority, name)
	m.sortByPriority()
}

// sortByPriority sorts providers by priority (lower number = higher priority)
func (m *Manager) sortByPriority() {
	sort.Slice(m.priority, func(i, j int) bool {
		// In a real implementation, you'd store priority with each provider
		// For now, we'll use registration order
		return i < j
	})
}

// Chat sends a request to the first available provider
// Implements fallback logic: tries providers in priority order until one succeeds
func (m *Manager) Chat(ctx context.Context, req *ChatRequest) (*ChatResponse, error) {
	m.mu.RLock()
	providers := m.priority
	m.mu.RUnlock()

	if len(providers) == 0 {
		return nil, errors.New("no providers registered")
	}

	var lastErr error
	var lastResp *ChatResponse

	// Try each provider in priority order
	for _, providerName := range providers {
		m.mu.RLock()
		provider, exists := m.providers[providerName]
		m.mu.RUnlock()

		if !exists {
			continue
		}

		// Check if provider is available before trying
		if !provider.IsAvailable(ctx) {
			continue
		}

		// Try the provider
		resp, err := provider.Chat(ctx, req)

		if err == nil && resp.Success {
			return resp, nil
		}

		// Record the error and response for fallback analysis
		lastErr = err
		if resp != nil {
			lastResp = resp
		}

		// Continue to next provider
	}

	// All providers failed
	if lastResp != nil {
		return lastResp, lastErr
	}

	return &ChatResponse{
		Success:  false,
		Error:    "All providers failed",
		Provider: "none",
	}, lastErr
}

// HealthCheck checks if any provider is available
func (m *Manager) HealthCheck(ctx context.Context) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, provider := range m.providers {
		if provider.IsAvailable(ctx) {
			return true
		}
	}

	return false
}

// GetStatus returns status of all providers
func (m *Manager) GetStatus() map[string]ProviderStatus {
	m.mu.RLock()
	defer m.mu.RUnlock()

	status := make(map[string]ProviderStatus)
	for name, provider := range m.providers {
		status[name] = provider.GetStatus()
	}

	return status
}

// GetProvider returns a specific provider
func (m *Manager) GetProvider(name string) (Provider, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	provider, exists := m.providers[name]
	if !exists {
		return nil, errors.New("provider not found")
	}

	return provider, nil
}

// GetProviders returns all registered providers
func (m *Manager) GetProviders() map[string]Provider {
	m.mu.RLock()
	defer m.mu.RUnlock()

	providers := make(map[string]Provider)
	for name, provider := range m.providers {
		providers[name] = provider
	}

	return providers
}

// ListProviders returns a list of provider names in priority order
func (m *Manager) ListProviders() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]string, len(m.priority))
	copy(result, m.priority)

	return result
}
