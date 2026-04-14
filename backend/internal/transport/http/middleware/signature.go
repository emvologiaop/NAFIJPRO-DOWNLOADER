package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// SignatureValidator validates HMAC-SHA256 signatures on requests
type SignatureValidator struct {
	secret  string
	origins []string
}

// NewSignatureValidator creates a new signature validator
func NewSignatureValidator(secret string, origins []string) *SignatureValidator {
	return &SignatureValidator{
		secret:  secret,
		origins: origins,
	}
}

// ValidateRequest validates the HMAC signature and origin of a request
func (sv *SignatureValidator) ValidateRequest(r *http.Request) error {
	// Check origin
	origin := r.Header.Get("Origin")
	if !sv.isAllowedOrigin(origin) {
		return fmt.Errorf("unauthorized origin: %s", origin)
	}

	// Get signature headers
	timestamp := r.Header.Get("X-Request-Timestamp")
	nonce := r.Header.Get("X-Request-Nonce")
	signature := r.Header.Get("X-Request-Signature")

	if timestamp == "" || nonce == "" || signature == "" {
		return fmt.Errorf("missing signature headers")
	}

	// Verify timestamp is recent (within 5 minutes)
	ts, err := time.Parse(time.RFC3339, timestamp)
	if err != nil {
		return fmt.Errorf("invalid timestamp format")
	}

	if time.Since(ts) > 5*time.Minute {
		return fmt.Errorf("request timestamp too old")
	}

	// Read body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return fmt.Errorf("failed to read request body: %w", err)
	}

	// Restore body so it can be read again
	r.Body = io.NopCloser(strings.NewReader(string(body)))

	// Compute expected signature
	expectedSig := sv.computeSignature(r.Method, r.URL.Path, timestamp, nonce, string(body))

	// Compare signatures (constant-time to prevent timing attacks)
	if !hmac.Equal([]byte(signature), []byte(expectedSig)) {
		return fmt.Errorf("invalid signature")
	}

	return nil
}

// computeSignature computes HMAC-SHA256 signature
func (sv *SignatureValidator) computeSignature(method, path, timestamp, nonce, body string) string {
	// Canonical format: METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY
	canonical := fmt.Sprintf("%s\n%s\n%s\n%s\n%s", method, path, timestamp, nonce, body)

	h := hmac.New(sha256.New, []byte(sv.secret))
	h.Write([]byte(canonical))

	return hex.EncodeToString(h.Sum(nil))
}

// isAllowedOrigin checks if origin is in the allowed list
func (sv *SignatureValidator) isAllowedOrigin(origin string) bool {
	for _, allowed := range sv.origins {
		if origin == allowed {
			return true
		}
	}
	return false
}

// SignatureMiddleware is HTTP middleware for signature validation
func SignatureMiddleware(validator *SignatureValidator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Only validate POST/PATCH/DELETE requests and specific routes
			if shouldValidateSignature(r) {
				if err := validator.ValidateRequest(r); err != nil {
					http.Error(w, fmt.Sprintf("Unauthorized: %v", err), http.StatusUnauthorized)
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// shouldValidateSignature determines if this request needs signature validation
func shouldValidateSignature(r *http.Request) bool {
	// Only validate protected routes
	if !strings.HasPrefix(r.URL.Path, "/api/web/") {
		return false
	}

	// GET requests to public endpoints don't need validation
	if r.Method == http.MethodGet && !strings.Contains(r.URL.Path, "admin") {
		return false
	}

	return true
}
