# ENVIRONMENT SETUP - WHAT YOU NEED NOW

## FOR BACKEND (.env.local or .env)

```bash
# ═══════════════════════════════════════════════════════════════
# DATABASE (PostgreSQL via Supabase)
# ═══════════════════════════════════════════════════════════════
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"
SUPABASE_URL="https://PROJECT_ID.supabase.co"
SUPABASE_KEY="eyJhbGc..."

# ═══════════════════════════════════════════════════════════════
# GROQ API (Primary Provider)
# ═══════════════════════════════════════════════════════════════
GROQ_API_KEY="gsk_YOUR_GROQ_KEY_HERE"
GROQ_API_ENDPOINT="https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL="mixtral-8x7b-32768"
GROQ_TIMEOUT="30s"

# ═══════════════════════════════════════════════════════════════
# FALLBACK PROVIDERS (Optional)
# ═══════════════════════════════════════════════════════════════
OPENAI_API_KEY="sk_YOUR_OPENAI_KEY"
GEMINI_API_KEY="YOUR_GEMINI_KEY"
CLAUDE_API_KEY="sk-ant_YOUR_CLAUDE_KEY"
AZURE_API_KEY="YOUR_AZURE_KEY"

# ═══════════════════════════════════════════════════════════════
# SECURITY & ENCRYPTION
# ═══════════════════════════════════════════════════════════════
# Generate: openssl rand -hex 32
ENCRYPTION_KEY="abcd1234efgh5678ijkl9012mnop3456"

# Generate: openssl rand -hex 64
HMAC_SECRET="your-hmac-secret-for-signing-requests"

# ═══════════════════════════════════════════════════════════════
# MULTIPLE FRONTEND URLS (IMPORTANT!)
# ═══════════════════════════════════════════════════════════════
FRONTEND_ORIGINS="http://localhost:3000,http://localhost:3001,https://downaria.com,https://www.downaria.com"

# Each frontend URL must be separated by comma
# NO SPACES after commas
# Must match exactly (http vs https matters)
# Examples:
# - Local dev: http://localhost:3000
# - Local test: http://localhost:3001  
# - Production: https://downaria.com
# - WWW variant: https://www.downaria.com

# ═══════════════════════════════════════════════════════════════
# PROVIDER SETTINGS
# ═══════════════════════════════════════════════════════════════
AI_PROVIDER_PRIORITY="groq,openai,gemini,claude,azure"
AI_PROVIDER_TIMEOUT="35s"
AI_MAX_RETRIES="2"

# ═══════════════════════════════════════════════════════════════
# SERVER
# ═══════════════════════════════════════════════════════════════
PORT="8080"
ENVIRONMENT="development"

# ═══════════════════════════════════════════════════════════════
# EXISTING DownAria Settings (Already Configured)
# ═══════════════════════════════════════════════════════════════
# (Keep your existing settings)
WEB_INTERNAL_SHARED_SECRET="your-existing-secret"
ALLOWED_ORIGINS="http://localhost:3000,https://downaria.com"
PUBLIC_BASE_URL="http://localhost:8080"
```

---

## FOR FRONTEND - EACH URL NEEDS .env.local

### Frontend #1 (localhost:3000)
**File:** `/fauntend/.env.local`
```bash
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### Frontend #2 (localhost:3001)
**File:** `/fauntend/.env.local`
```bash
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NEXT_PUBLIC_BASE_URL="http://localhost:3001"
```

### Frontend #3 Production (https://downaria.com)
**File:** `/fauntend/.env.production`
```bash
NEXT_PUBLIC_API_URL="https://api.downaria.com"
NEXT_PUBLIC_APP_URL="https://downaria.com"
NEXT_PUBLIC_BASE_URL="https://downaria.com"
```

### Frontend #4 Production (https://www.downaria.com)
**File:** `/fauntend/.env.production.local`
```bash
NEXT_PUBLIC_API_URL="https://api.downaria.com"
NEXT_PUBLIC_APP_URL="https://www.downaria.com"
NEXT_PUBLIC_BASE_URL="https://www.downaria.com"
```

---

## ✅ WHAT YOU NEED TO DO NOW

### BACKEND ONLY:

1. **Add Auto-Migration to app.go**
   
   Insert this in `/backend/cmd/server/main.go` (after database connection):
   ```go
   // Auto-run migrations
   migrations.RegisterMigrations(db)
   ```

2. **Register the migration runner**
   
   In the same file, add:
   ```go
   import "internal/core/migrations"
   
   // After connecting to database:
   runner := migrations.NewRunner(db)
   runner.Register(migrations.MigrationAIAPIKeys())
   if err := runner.Run(); err != nil {
       log.Fatalf("Migration failed: %v", err)
   }
   ```

3. **Create migrations init file** (NEW FILE)
   
   File: `/backend/internal/core/migrations/init.go`
   ```go
   package migrations
   
   import "database/sql"
   
   var registeredMigrations []Migration
   
   func RegisterMigrations(db *sql.DB) error {
       runner := NewRunner(db)
       runner.Register(MigrationAIAPIKeys())
       return runner.Run()
   }
   ```

---

## ✅ WHAT ELSE IS NEEDED:

### BACKEND FILES TO ADD (I'll create):

1. **Update app.go** - Call migration runner
2. **Update main.go** - Initialize database migrations
3. **Create database connection** - PostgreSQL setup
4. **Update router** - Register AI endpoints

### FRONTEND FILES TO ADD (I'll create):

1. **Update FetchProvider** - Add request signing middleware
2. **Create SignatureGenerator** - HMAC-SHA256 signing
3. **Initialize admin navigation** - Link to AI keys page

---

## 🔧 HOW TO APPLY

### Step 1: Update BACKEND .env
Copy the BACKEND section above into `/backend/.env.local`

**IMPORTANT:** Add ALL your frontend URLs to `FRONTEND_ORIGINS`

Example:
```bash
FRONTEND_ORIGINS="http://localhost:3000,http://localhost:3001,https://downaria.com,https://www.downaria.com"
```

### Step 2: Update EACH FRONTEND .env
Each frontend instance needs its own `.env.local` with its specific URL

### Step 3: Verify Database Connection
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

### Step 4: Run Backend
```bash
cd backend
go run ./cmd/server
# Should log: "All migrations completed successfully"
```

### Step 5: Test
```bash
# Test chat endpoint
curl -X POST http://localhost:8080/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```

---

## ⚠️ IMPORTANT NOTES

### Multiple Frontend URLs
- **Don't use IP addresses** (127.0.0.1 ≠ localhost)
- **Include protocol** (http:// or https://)
- **No trailing slashes** (http://localhost:3000 ✓, http://localhost:3000/ ✗)
- **Case sensitive** (http ≠ HTTP)
- **Separate with comma, no spaces** (url1,url2 ✓, url1, url2 ✗)

### Example Valid Configuration
```bash
# ✅ CORRECT
FRONTEND_ORIGINS="http://localhost:3000,http://localhost:3001,https://downaria.com,https://www.downaria.com"

# ❌ WRONG
FRONTEND_ORIGINS="http://localhost:3000, http://localhost:3001, https://downaria.com"  # spaces
FRONTEND_ORIGINS="http://127.0.0.1:3000"  # IP instead of localhost
FRONTEND_ORIGINS="localhost:3000"  # missing protocol
```

### If Frontend Shows 401 Unauthorized
1. Check `FRONTEND_ORIGINS` includes your exact URL
2. Verify protocol matches (http vs https)
3. Check HMAC_SECRET is set in backend
4. Verify frontend signing middleware is enabled

---

## 📋 COMPLETE CHECKLIST

- [ ] Backend `.env.local` created with Groq key
- [ ] `FRONTEND_ORIGINS` includes all your frontend URLs
- [ ] Frontend `.env.local` created for each URL
- [ ] Database connection string configured
- [ ] Encryption key and HMAC secret generated
- [ ] Migrations will run automatically on backend start
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Chat endpoint accepts requests
- [ ] Admin dashboard accessible

**Ready to proceed? Tell me: BACKEND or FRONTEND**
