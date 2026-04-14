# WHAT TO ADD - Exact Instructions

## 🎯 TELL ME WHICH AREA YOU WANT TO ADD:

### OPTION 1: BACKEND (auto-migration + database init)
### OPTION 2: FRONTEND (request signing + headers)  
### OPTION 3: BOTH

---

## IF YOU SAY "BACKEND" - I WILL CREATE:

1. **Database connection initialization**
   - File: `/backend/internal/core/database/connection.go`
   - What: Connect to PostgreSQL, auto-run migrations

2. **Update main.go**
   - File: `/backend/cmd/server/main.go`
   - What: Include: `defer db.Close()` + migration runner + error handling

3. **Update router**
   - File: `/backend/internal/transport/http/router.go`
   - What: Add routes for:
     - `POST /api/v1/chat`
     - `POST /api/web/chat`
     - `POST /api/admin/ai-keys`
     - `GET /api/admin/ai-keys`
     - `GET /api/admin/ai-keys/stats`
     - `POST /api/admin/ai-keys/test`
     - `DELETE /api/admin/ai-keys/{id}`

4. **Update app.go**
   - File: `/backend/internal/app/app.go`
   - What: Register middleware + providers + handlers

5. **Create Supabase client**
   - File: `/backend/internal/infra/database/supabase.go`
   - What: Query/update API keys in database

---

## IF YOU SAY "FRONTEND" - I WILL CREATE:

1. **Request signing middleware**
   - File: `/fauntend/src/lib/api/requestSigner.ts`
   - What: Generate HMAC-SHA256 signatures for all requests

2. **HTTP client wrapper**
   - File: `/fauntend/src/lib/api/client.ts`
   - What: Auto-sign all requests before sending

3. **API hooks**
   - File: `/fauntend/src/hooks/useApi.ts`
   - What: React hook for signed API calls

4. **Update admin fetch function**
   - File: `/fauntend/src/app/admin/layout.tsx`
   - What: Use signed HTTP client instead of plain fetch

---

## QUICK START

**Just reply with ONE of these:**

```
BACKEND
```
or
```
FRONTEND
```
or
```
BOTH
```

I will create exactly what's needed and show you where to paste it.

---

## CURRENT STATUS

✅ Already Created:
- Admin dashboard UI
- API key manager functions
- Provider system (Groq, manager, handlers)
- Database schema migration
- Request signing middleware
- Environment documentation

❌ Still Need (You choose):
- Database initialization
- Router endpoints registration
- Supabase client
- Frontend HTTP signing
- API request hooks

---

**What do you want to add: BACKEND, FRONTEND, or BOTH?**
