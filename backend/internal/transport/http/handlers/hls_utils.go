package handlers

import (
	infrahls "downaria-api/internal/infra/hls"
)

func isHLSPlaylist(rawURL, contentType string) bool {
	return infrahls.IsHLSPlaylist(rawURL, contentType)
}
