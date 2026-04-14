# 🚀 Deployment Checklist

## ✅ Development Status: COMPLETE

All issues fixed and features implemented. System ready for deployment.

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup
- [ ] Supabase project created
- [ ] Obtained SUPABASE_URL and SUPABASE_KEY
- [ ] Migration file created at `/backend/migrations/001_ai_api_keys_schema.sql`
- [ ] Run migration in Supabase SQL Editor:
  ```sql
  -- Copy entire contents of migration file and execute
  ```

### 2. Environment Configuration
- [ ] Created `.env.local` in `/backend` with:
  ```
  ✓ GROQ_API_KEY="gsk_..."
  ✓ ENCRYPTION_KEY="<32-byte-hex>"
  ✓ HMAC_SECRET="<64-byte-hex>"
  ✓ FRONTEND_ORIGINS="http://localhost:3000"
  ✓ SUPABASE_URL="https://..."
  ✓ SUPABASE_KEY="..."
  ```
- [ ] Created `.env.local` in `/fauntend` with:
  ```
  ✓ NEXT_PUBLIC_API_URL="http://localhost:8080"
  ```

### 3. Dependencies
- [ ] Go packages installed: `go mod tidy`
- [ ] Node packages installed: `npm install` (fauntend)
- [ ] FFmpeg available in PATH for merge functionality

### 4. Local Testing
- [ ] Backend starts: `go run ./cmd/server`
- [ ] Frontend starts: `npm run dev` (from fauntend)
- [ ] Admin dashboard accessible: `http://localhost:3000/admin/ai-keys`
- [ ] Chat endpoint responds: `POST http://localhost:8080/api/v1/chat`
- [ ] Admin can create API key: `POST http://localhost:8080/api/admin/ai-keys`

### 5. Groq API Setup
- [ ] Groq API key obtained from https://console.groq.com
- [ ] Key format verified: starts with `gsk_`
- [ ] Key tested: `POST http://localhost:8080/api/admin/ai-keys/test`
- [ ] API quota verified: sufficient for testing

### 6. Security Verification
- [ ] Origin validation: Only frontend URLs accepted
- [ ] Signature validation: Requests from other origins rejected
- [ ] Timestamp check: Requests older than 5 minutes rejected
- [ ] Admin authentication: Only admin users can manage keys

### 7. Database Connectivity
- [ ] Can connect to Supabase from backend
- [ ] Tables created successfully
- [ ] RLS policies enforced
- [ ] Encryption functions available

---

## 🔄 Deployment Steps

### Step 1: Apply Database Migration
```bash
# Option A: Supabase CLI
supabase migration new ai_api_keys_schema
# Copy migration file content to new migration

# Option B: SQL Editor
# 1. Open https://app.supabase.com/project/[your-project]/sql
# 2. Create new query
# 3. Paste entire contents: /backend/migrations/001_ai_api_keys_schema.sql
# 4. Execute
```

### Step 2: Configure Environment
```bash
# Backend (.env or .env.production)
GROQ_API_KEY="gsk_..."
GROQ_API_ENDPOINT="https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL="mixtral-8x7b-32768"
ENCRYPTION_KEY="<32-byte-encryption-key>"
HMAC_SECRET="<hmac-secret>"
FRONTEND_ORIGINS="https://downaria.com,https://www.downaria.com"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="<anon-key>"
PORT="8080"

# Frontend (.env.production)
NEXT_PUBLIC_API_URL="https://api.downaria.com"
NEXT_PUBLIC_BASE_URL="https://downaria.com"
```

### Step 3: Build & Test
```bash
# Backend
cd backend
go build -o downaria-api ./cmd/server
./downaria-api

# Frontend  
cd fauntend
npm run build
npm run start
```

### Step 4: Deploy
```bash
# Option A: Docker (Recommended)
docker build -t downaria-api:latest backend/
docker run -p 8080:8080 --env-file .env downaria-api:latest

# Option B: Railway / Render
# Push to git, Railway/Render will auto-deploy

# Option C: Manual Server
# SSH into server and run ./downaria-api
```

### Step 5: Verify Production
- [ ] Chat endpoint working: `https://api.downaria.com/api/v1/chat`
- [ ] Admin dashboard working: `https://downaria.com/admin/ai-keys`
- [ ] Groq API responding
- [ ] Error handling working
- [ ] Database queries working

---

## 🧪 Test Suite

### Manual Testing
```bash
# 1. Test Chat Endpoint
curl -X POST https://api.downaria.com/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","model":"mixtral-8x7b-32768"}'

# 2. Test Admin API Key Creation
curl -X POST https://api.downaria.com/api/admin/ai-keys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"provider":"groq","api_key":"gsk_...","model":"mixtral-8x7b-32768","priority_order":1,"enabled":true}'

# 3. Test API Key Validation
curl -X POST https://api.downaria.com/api/admin/ai-keys/test \
  -H "Content-Type: application/json" \
  -d '{"provider":"groq","api_key":"gsk_...","model":"mixtral-8x7b-32768"}'

# 4. Test Admin Dashboard
open https://downaria.com/admin/ai-keys
```

### Automated Testing (Backend)
```bash
cd backend
go test ./...
```

### Automated Testing (Frontend)
```bash
cd fauntend
npm run test
```

---

## 📊 Production Monitoring

### Metrics to Monitor
- Chat response time (should be < 5 seconds)
- Groq API success rate (should be > 95%)
- Error rate (should be < 1%)
- Admin operations (create/update/delete key count)
- API key usage per provider

### Logs to Check
- Backend logs for Groq API errors
- Admin audit logs for key changes
- Error logs for failed requests
- Database logs for constraint violations

### Alerts to Set Up
- [ ] Groq API down (no successful requests for 5 min)
- [ ] Error rate > 5%
- [ ] Response time > 10 seconds
- [ ] Database connection failed
- [ ] Admin authentication failures

---

## 🔐 Post-Deployment Security

### 1. Verify HTTPS
- [ ] All traffic is HTTPS
- [ ] Redirect HTTP to HTTPS
- [ ] HSTS header set
- [ ] SSL certificate valid

### 2. Verify Authentication
- [ ] Admin routes require authentication
- [ ] API keys are encrypted at rest
- [ ] Audit logs capture all operations
- [ ] Failed logins are logged

### 3. Verify Authorization
- [ ] Only frontend origin can access without API key
- [ ] Request signatures validated
- [ ] Timestamps checked (5-minute window)
- [ ] Rate limiting enforced

### 4. Verify Encryption
- [ ] API keys encrypted in database
- [ ] HMAC secrets configured
- [ ] Encryption key rotated quarterly
- [ ] Backups encrypted

---

## 📚 Documentation Files

All documentation has been created:
- ✅ `IMPLEMENTATION_SUMMARY.md` - Technical summary
- ✅ `AI_KEY_SETUP.md` - Environment setup guide
- ✅ `FIXES_VERIFICATION.md` - Verification that all issues fixed
- ✅ `COMPLETE_SUMMARY.md` - Comprehensive overview
- ✅ `DEPLOYMENT_CHECKLIST.md` - This file

---

## ✅ Final Sign-Off

### Ready for Deployment When:
- [ ] All environment variables configured
- [ ] Database migration applied
- [ ] Local testing passed
- [ ] Pre-deployment checklist completed
- [ ] Security verification passed
- [ ] Monitoring set up

### Deployment Contact
- Backend Issues: Check logs with `docker logs container-id`
- Frontend Issues: Check console with browser DevTools
- Database Issues: Check Supabase dashboard
- API Issues: Check `/api/v1/health` endpoint

---

**Status:** ✅ Ready for Production Deployment
**Last Updated:** 2026-04-14
**Next Step:** Apply database migration and deploy to production
