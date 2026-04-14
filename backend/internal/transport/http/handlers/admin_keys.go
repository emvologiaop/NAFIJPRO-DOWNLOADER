package handlers

import (
	"encoding/json"
	"net/http"
)

// AdminAPIKeysHandler handles admin API key management endpoints
type AdminAPIKeysHandler struct{}

// NewAdminAPIKeysHandler creates a new admin API keys handler
func NewAdminAPIKeysHandler() *AdminAPIKeysHandler {
	return &AdminAPIKeysHandler{}
}

// APIKeyResponse represents an API key in responses
type APIKeyResponse struct {
	ID            string `json:"id"`
	Provider      string `json:"provider"`
	Model         string `json:"model"`
	PriorityOrder int    `json:"priority_order"`
	Enabled       bool   `json:"enabled"`
	Status        string `json:"status"`
	LastTestedAt  string `json:"last_tested_at,omitempty"`
	LastError     string `json:"last_error,omitempty"`
	ErrorCount    int    `json:"error_count"`
	SuccessCount  int    `json:"success_count"`
	CreatedAt     string `json:"created_at"`
	UpdatedAt     string `json:"updated_at"`
	KeyPreview    string `json:"key_preview"` // First 8 + last 4 chars
}

// CreateAPIKeyRequest represents a request to create an API key
type CreateAPIKeyRequest struct {
	Provider      string `json:"provider"`
	APIKey        string `json:"api_key"`
	Model         string `json:"model"`
	PriorityOrder int    `json:"priority_order"`
	Enabled       bool   `json:"enabled"`
}

// StatsResponse represents API key statistics
type StatsResponse struct {
	TotalKeys   int                           `json:"total_keys"`
	ActiveKeys  int                           `json:"active_keys"`
	TotalUsage  int                           `json:"total_usage"`
	Providers   map[string]ProviderStatusResp `json:"providers"`
}

// ProviderStatusResp represents provider status in responses
type ProviderStatusResp struct {
	Name               string `json:"name"`
	IsAvailable        bool   `json:"is_available"`
	LastError          string `json:"last_error,omitempty"`
	RateLimitRemaining int    `json:"rate_limit_remaining"`
	RateLimitReset     string `json:"rate_limit_reset,omitempty"`
	FailureCount       int    `json:"failure_count"`
	LastSuccessTime    string `json:"last_success_time,omitempty"`
}

// ListAPIKeys returns all API keys
func (h *AdminAPIKeysHandler) ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Implement database query
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode([]APIKeyResponse{})
}

// GetAPIKeyStats returns API key statistics
func (h *AdminAPIKeysHandler) GetAPIKeyStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Implement stats calculation from database
	w.Header().Set("Content-Type", "application/json")
	stats := StatsResponse{
		TotalKeys:  0,
		ActiveKeys: 0,
		TotalUsage: 0,
		Providers:  make(map[string]ProviderStatusResp),
	}
	json.NewEncoder(w).Encode(stats)
}

// CreateAPIKey creates a new API key
func (h *AdminAPIKeysHandler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateAPIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Provider == "" || req.APIKey == "" || req.Model == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// TODO: Implement key creation and encryption in database
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "API key created successfully",
	})
}

// DeleteAPIKey deletes an API key
func (h *AdminAPIKeysHandler) DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Extract ID from URL params and implement deletion
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "API key deleted successfully",
	})
}

// TestAPIKey tests an API key
func (h *AdminAPIKeysHandler) TestAPIKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Provider string `json:"provider"`
		APIKey   string `json:"api_key"`
		Model    string `json:"model"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// TODO: Implement key testing logic
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Key is valid",
	})
}
