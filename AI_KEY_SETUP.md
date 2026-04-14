# AI API Key Management - Environment Setup Guide

## Backend Environment Variables (.env or .env.local)

```bash
# ═══════════════════════════════════════════════════════════════
# Groq Configuration (Primary Provider)
# ═══════════════════════════════════════════════════════════════
GROQ_API_KEY="gsk_YOUR_GROQ_API_KEY_HERE"
GROQ_API_ENDPOINT="https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL="mixtral-8x7b-32768"
GROQ_TIMEOUT="30s"

# Alternative models:
# - "llama2-70b-4096" - Llama 2 70B
# - "gemma-7b-it" - Gemini 7B Instruction Tuned
# - "mixtral-8x7b-32768" - Mixtral 8x7B (Recommended)

# ═══════════════════════════════════════════════════════════════
# Other AI Providers (Fallback)
# ═══════════════════════════════════════════════════════════════
OPENAI_API_KEY="sk_YOUR_OPENAI_KEY"
GEMINI_API_KEY="YOUR_GEMINI_KEY"
CLAUDE_API_KEY="sk-ant-YOUR_CLAUDE_KEY"
AZURE_API_KEY="YOUR_AZURE_KEY"
AZURE_ENDPOINT="https://your-resource.openai.azure.com/"

# ═══════════════════════════════════════════════════════════════
# AI Provider Settings
# ═══════════════════════════════════════════════════════════════
AI_PROVIDER_PRIORITY="groq,openai,gemini,claude,azure"
AI_PROVIDER_TIMEOUT="35s"
AI_MAX_RETRIES="2"

# ═══════════════════════════════════════════════════════════════
# Security & Encryption
# ═══════════════════════════════════════════════════════════════
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY="your-32-byte-hex-encoded-encryption-key"

# Generate with: openssl rand -hex 32
HMAC_SECRET="your-hmac-secret-for-request-signing"

# Admin token secret for authentication
ADMIN_TOKEN_SECRET="your-admin-token-secret"

# ═══════════════════════════════════════════════════════════════
# Frontend Origins (CORS & Origin Validation)
# ═══════════════════════════════════════════════════════════════
# Multiple origins separated by comma
FRONTEND_ORIGINS="http://localhost:3000,http://localhost:3001,https://downaria.com"

# ═══════════════════════════════════════════════════════════════
# Supabase Configuration
# ═══════════════════════════════════════════════════════════════
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
DATABASE_URL="postgresql://user:password@db.host:5432/downaria"

# ═══════════════════════════════════════════════════════════════
# Existing DownAria Configuration
# ═══════════════════════════════════════════════════════════════
PORT="8080"
ENVIRONMENT="production"
ALLOWED_ORIGINS="http://localhost:3000,https://downaria.com"
WEB_INTERNAL_SHARED_SECRET="your-existing-shared-secret"
```

## Frontend Environment Variables (.env.local or .env)

```bash
# ═══════════════════════════════════════════════════════════════
# API Configuration
# ═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Production URLs
# NEXT_PUBLIC_API_URL="https://api.downaria.com"
# NEXT_PUBLIC_APP_URL="https://downaria.com"
```

## How to Generate Required Secrets

### Generate Encryption Key (32 bytes for AES-256)
```bash
# macOS/Linux
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Generate HMAC Secret
```bash
# macOS/Linux
openssl rand -hex 64

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
```

### Get Groq API Key
1. Visit https://console.groq.com
2. Sign up / Log in
3. Go to API Keys section
4. Create new API key
5. Copy the key starting with `gsk_`

## Supabase Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Copy Project URL and Anon Key to `.env`

### 2. Apply Database Migration
```bash
# Option 1: Using SQL Editor in Supabase
# 1. Go to SQL Editor
# 2. Create new query
# 3. Paste contents of: /backend/migrations/001_ai_api_keys_schema.sql
# 4. Run query

# Option 2: Using supabase-cli
cd /backend
supabase migration new ai_api_keys_schema
supabase migration up
```

### 3. Set Encryption Key in Supabase
In Supabase SQL Editor, run:
```sql
-- Set the encryption key as a config variable
ALTER DATABASE postgres SET "app.encryption_key" = 'your-encryption-key-here';
```

## Testing Setup

### 1. Test Groq Connection
```bash
# Frontend - Open browser console and run:
fetch('/api/web/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Request-Timestamp': new Date().toISOString(),
    'X-Request-Nonce': Math.random().toString(36).substring(7),
    'Origin': 'http://localhost:3000'
  },
  body: JSON.stringify({
    message: 'Hello, what is 2+2?',
    model: 'mixtral-8x7b-32768'
  })
})
.then(r => r.json())
.then(console.log)
```

### 2. Test Admin API Key Creation
```bash
curl -X POST http://localhost:8080/api/admin/ai-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "provider": "groq",
    "api_key": "gsk_...",
    "model": "mixtral-8x7b-32768",
    "priority_order": 1,
    "enabled": true
  }'
```

### 3. Test API Key
```bash
curl -X POST http://localhost:8080/api/admin/ai-keys/test \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "groq",
    "api_key": "gsk_...",
    "model": "mixtral-8x7b-32768"
  }'
```

## Verification Checklist

- [ ] Backend starts without errors
- [ ] All environment variables are set
- [ ] Supabase migration has been applied
- [ ] Frontend can access `/admin/ai-keys`
- [ ] Chat endpoint returns responses from Groq
- [ ] Admin can create API keys
- [ ] Unauthorized requests are blocked (HTTP 401)
- [ ] Only frontend origin URLs work without explicit auth
- [ ] Groq API key is working and has quota
- [ ] Encryption key is set correctly
- [ ] HMAC secret is working for request signing

## Troubleshooting

### "Unauthorized origin" Error
**Solution:** Check that `FRONTEND_ORIGINS` includes your frontend URL exactly

### "Encryption key not set" Error
**Solution:** Set `ENCRYPTION_KEY` in `.env` and verify it's loaded correctly

### Groq API Rate Limited (429)
**Solution:** 
- Check your Groq API quota
- Increase `AI_MAX_RETRIES` to auto-retry
- Implement exponential backoff

### Admin dashboard shows "Access Denied"
**Solution:** Ensure user role is set to 'admin' in database

### Database migration fails
**Solution:**
- Check Supabase connection in SQL Editor
- Verify the migration SQL syntax
- Ensure pgcrypto extension is available

## Production Deployment

### Environment Setup
```bash
# Production values for .env
PORT=8080
ENVIRONMENT=production
FRONTEND_ORIGINS="https://downaria.com,https://www.downaria.com"
GROQ_API_KEY="<your-production-groq-key>"
ENCRYPTION_KEY="<your-production-encryption-key>"
HMAC_SECRET="<your-production-hmac-secret>"
SUPABASE_URL="<your-production-supabase-url>"
```

### Security Best Practices
1. **Never commit secrets to git** - Use `.env.local` and `.gitignore`
2. **Rotate keys regularly** - Use `/api/admin/ai-keys/{id}/rotate`
3. **Monitor API usage** - Check `ai_provider_usage` table
4. **Enable audit logging** - Check `ai_api_key_audit` table
5. **Use HTTPS only** - Set `https://` in production
6. **Restrict admin access** - Use strong authentication
7. **Rate limit aggressively** - Set low `GROQ_TIMEOUT` and `AI_MAX_RETRIES`

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized on chat | Missing/invalid signature | Ensure frontend signing middleware is enabled |
| 403 Forbidden on admin routes | User is not admin | Update user role in database |
| 429 Too Many Requests | Rate limit hit | Increase timeout or add more API keys |
| 500 Internal Error | Database connection failed | Check Supabase connection string |
| Chat returns empty | Groq API key invalid | Verify key with test endpoint |
| Authorization header missing | Client not sending it | Check HMAC_SECRET and signing code |

## API Key Formats

### Groq
Starts with `gsk_`: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### OpenAI
Starts with `sk-`: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Claude
Starts with `sk-ant-`: `sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Gemini
Longer alphanumeric string without prefix

### Azure
Follows Azure key format with dashes: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
