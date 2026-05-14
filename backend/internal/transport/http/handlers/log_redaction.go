package handlers

import "downaria-api/internal/shared/security"

func redactLogError(err error) string {
	return security.RedactLogError(err)
}
