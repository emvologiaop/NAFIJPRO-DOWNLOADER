#!/usr/bin/env bash
# Render Blueprint Deploy URL
# Use this to deploy with automatic Docker detection:
# https://render.com/deploy?repo=YOUR_GITHUB_URL

# IMPORTANT: If you're seeing Node.js selection in Render UI:
# 1. Use the Blueprint button above (automatic - skips language selection)
# 2. OR manually delete the service and reconnect
# 3. OR when connecting, explicitly choose "Docker" in the settings

# Configuration files:
# - render.yaml (root) - Main Render Blueprint config
# - backend/render.toml - Backup explicit Docker config
# - .renderignore - Tells Render to ignore Node files

# The render.yaml explicitly specifies:
# runtime: docker
# dockerfilePath: Dockerfile
# dockerContext: backend
