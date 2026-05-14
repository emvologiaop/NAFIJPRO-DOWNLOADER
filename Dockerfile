# Multi-stage Dockerfile
# - Go builder on Debian (reliable for cgo and native deps)
# - Python venv stage to install yt-dlp without pip root warnings
# - Slim Debian runtime with non-root user

FROM golang:1.24-bullseye AS builder
WORKDIR /src

# Copy go.mod/go.sum first to leverage Docker cache
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy backend source and build static binary
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /out/downaria-api ./cmd/server

# Python venv stage: install yt-dlp into a venv (no root pip warning)
FROM python:3.11-slim AS pyvenv
ENV VENV_PATH=/opt/venv
RUN python -m venv ${VENV_PATH} && ${VENV_PATH}/bin/pip install --upgrade pip setuptools wheel
RUN ${VENV_PATH}/bin/pip install yt-dlp

# Final runtime image
FROM debian:bookworm-slim AS runtime
RUN useradd --create-home --shell /bin/bash appuser || true
WORKDIR /app

# Copy Go binary
COPY --from=builder /out/downaria-api /app/downaria-api

# Copy Python venv
COPY --from=pyvenv /opt/venv /opt/venv

ENV PATH=/opt/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
RUN chmod +x /app/downaria-api && chown -R appuser:appuser /app /opt/venv
USER appuser

EXPOSE 8080
CMD ["/app/downaria-api"]
