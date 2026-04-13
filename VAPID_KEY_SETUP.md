# VAPID Key Setup - Push Notifications Documentation

## What is VAPID?

**VAPID** (Voluntary Application Server Identification) is a security protocol for Web Push Notifications.

- **VAPID Public Key**: Shared with browser (included in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
- **VAPID Private Key**: Kept secret on backend (never sent to client)
- **Purpose**: Authenticate push notification requests between server and browser push service

---

## Quick Start

### Step 1: Generate VAPID Keys

#### Option A: Using Docker (Recommended)
```bash
docker run -it node:20-alpine npx web-push generate-vapid-keys
```

#### Option B: Local Node.js
```bash
npx web-push generate-vapid-keys
```

#### Option C: Online Generator
Visit: https://vapidkey.com/

**Output will look like:**
```
Public Key: BErMiW8...remainder...
Private Key: eW1I3/...remainder...
```

### Step 2: Save Public Key to Frontend

**File:** `fauntend/.env.local` (or `.env.production` for production)

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BErMiW8...your_public_key...
```

### Step 3: Save Private Key to Backend

**File:** `backend/.env` (or Render dashboard for production)

```env
VAPID_PRIVATE_KEY=eW1I3/...your_private_key...
VAPID_PUBLIC_KEY=BErMiW8...your_public_key...
VAPID_SUBJECT=mailto:your-email@example.com
```

### Step 4: Restart Services
```bash
# Development
npm run dev

# Production (Render will auto-restart)
git push origin main
```

---

## Detailed Setup Instructions

### For Development Environment

#### 1. Generate Keys
```bash
# In project root or any directory
npx web-push generate-vapid-keys
```

#### 2. Frontend Configuration

**File:** `/workspaces/NAFIJPRO-DOWNLOADER/fauntend/.env.local`

```env
# Add to existing .env.local or create new file
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here

# example:
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPyaMu...
```

#### 3. Backend Configuration

**File:** `/workspaces/NAFIJPRO-DOWNLOADER/backend/.env`

```env
# Add to existing .env or create new file
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Example:
VAPID_PRIVATE_KEY=eW1I3/...
VAPID_PUBLIC_KEY=BPyaMu...
VAPID_SUBJECT=mailto:nafij@downloader.me
```

#### 4. Test Push Notifications
```bash
# Start dev server
npm run dev

# In browser:
# 1. Go to Settings page
# 2. Click "Enable Push Notifications"
# 3. Allow browser permission
# 4. Check admin → Communications page
# 5. Send test notification
```

---

### For Production Environment (Render + Vercel)

#### Step 1: Generate New Keys for Production
```bash
npx web-push generate-vapid-keys
```

**Important:** Use DIFFERENT keys for production than development.

#### Step 2: Vercel Dashboard (Frontend)

1. Go to: https://vercel.com/dashboard → Select your project
2. Go to **Settings** → **Environment Variables**
3. Add new environment variable:
   - **Name:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - **Value:** Your generated public key
   - **Environments:** Check `Production`
4. Click **Save**

#### Step 3: Render Dashboard (Backend)

1. Go to: https://render.com/dashboard → Select your service
2. Go to **Environment** section
3. Add new environment variables:

```
Variable Name: VAPID_PRIVATE_KEY
Value: your_private_key_here
```

```
Variable Name: VAPID_PUBLIC_KEY
Value: your_public_key_here
```

```
Variable Name: VAPID_SUBJECT
Value: mailto:admin@yoursite.com
```

4. Click **Save Changes**
5. Service will auto-restart

#### Step 4: Update Environment Files

Update the example files for future reference:

**File:** `.env.example`
```env
# VAPID Keys for Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_from_web_push_generate
VAPID_PRIVATE_KEY=your_private_key_from_web_push_generate
VAPID_SUBJECT=mailto:admin@downloader.me
```

**File:** `fauntend/.env.example`
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_from_web_push_generate
```

**File:** `backend/.env.example`
```env
VAPID_PRIVATE_KEY=your_private_key_from_web_push_generate
VAPID_PUBLIC_KEY=your_public_key_from_web_push_generate
VAPID_SUBJECT=mailto:admin@downloader.me
```

---

## How VAPID Keys Are Used

### Frontend Flow
1. User clicks "Enable Notifications" in Settings
2. Browser requests permission
3. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is used to subscribe to push service
4. Subscription object sent to backend
5. Backend stores subscription

### Backend Flow
1. Admin sends notification from Communications page
2. Backend uses `VAPID_PRIVATE_KEY` to sign notification
3. Notification sent to browser push service
4. Browser receives and displays notification
5. Service worker handles the push event

---

## Troubleshooting

### Issue: "VAPID public key not configured"
**Cause:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is empty or missing

**Solution:**
```bash
# Check .env.local file exists
cat fauntend/.env.local | grep VAPID

# If missing, add:
echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_key_here" >> fauntend/.env.local

# Restart dev server
npm run dev
```

### Issue: Notifications not sending from admin panel
**Cause:** Backend doesn't have VAPID keys configured

**Solution:**
```bash
# Check backend .env has both keys
cat backend/.env | grep VAPID

# Should have:
# VAPID_PRIVATE_KEY=...
# VAPID_PUBLIC_KEY=...
# VAPID_SUBJECT=...

# Restart backend
cd backend && go run ./cmd/server
```

### Issue: "Subscription failed"
**Cause:** Public key format is invalid

**Solution:**
1. Regenerate keys using:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Copy FULL key value (entire string)
3. Update both frontend and backend
4. Clear browser cache: `Ctrl+Shift+Delete` → Clear all

### Issue: Keys don't work after update
**Cause:** Using old keys or mismatched keys

**Solution:**
1. Must regenerate NEW keys together
2. Both must be from same `web-push` generation
3. Don't mix old and new keys
4. Clear browser notifications cache:
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(reg => reg.unregister())
   })
   ```

### Issue: Production notifications not working
**Cause:** Environment variables not set in Render/Vercel

**Solution:**
1. Verify in Vercel Dashboard:
   - Settings → Environment Variables
   - Check `NEXT_PUBLIC_VAPID_PUBLIC_KEY` exists
   - Check it's marked for Production

2. Verify in Render Dashboard:
   - Service → Environment
   - Check `VAPID_PRIVATE_KEY` exists
   - Check `VAPID_PUBLIC_KEY` exists
   - Check `VAPID_SUBJECT` exists

3. Restart services:
   - Vercel: Rerun build or push new commit
   - Render: Click "Manual Deploy" button

---

## Testing Push Notifications

### Step 1: Generate Test Keys
```bash
npx web-push generate-vapid-keys
```

### Step 2: Setup Development Environment
```bash
# Frontend
echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key" > fauntend/.env.local

# Backend  
echo "VAPID_PRIVATE_KEY=your_private_key" >> backend/.env
echo "VAPID_PUBLIC_KEY=your_public_key" >> backend/.env
echo "VAPID_SUBJECT=mailto:test@test.com" >> backend/.env
```

### Step 3: Start Services
```bash
npm run dev
```

### Step 4: Test Flow
1. Browser: Go to https://localhost:3001/settings
2. Click "Enable Push Notifications"
3. Browser: Allow permission popup
4. Browser: Check notification icon shows enabled
5. Admin: Go to /admin/communications
6. Admin: Check "Push Configured" shows ✓
7. Admin: Click "Send Test Notification"
8. Browser: Should receive notification after a few seconds

### Step 5: Verify Data
```bash
# Check subscriptions were saved
# Browser console:
const sw = await navigator.serviceWorker.ready
console.log(await sw.pushManager.getSubscription())
```

---

## Key Management Best Practices

### DO:
✅ Regenerate keys every 6-12 months
✅ Keep private key secret and encrypted
✅ Use separate keys for dev and production
✅ Store keys in environment variables
✅ Update both frontend AND backend when regenerating
✅ Test after updating keys
✅ Document key update dates

### DON'T:
❌ Commit VAPID keys to git
❌ Share private key publicly
❌ Use same keys across environments
❌ Store keys in plain text files  
❌ Mix frontend public with backend private
❌ Forget to update both frontend and backend
❌ Use expired or invalid key formats

---

## Key Locations in Codebase

| Component | Location | Usage |
|-----------|----------|-------|
| VAPID Loading | `/fauntend/src/lib/utils/push-notifications.ts` | Load public key |
| Admin Settings | `/fauntend/src/app/admin/communications/page.tsx` | Show VAPID status |
| Service Worker | `/fauntend/public/sw.js` | Handle push events |
| Push Hook | `/fauntend/src/hooks/admin/useCommunications.ts` | Check VAPID config |
| TypeScript Types | `/fauntend/src/types/web-push.d.ts` | Type definitions |

---

## API Endpoints for Push Notifications

### Subscribe to Push
```
POST /api/v1/push/subscribe
Body: { endpoint, keys }
Response: { status: "subscribed" }
```

### Unsubscribe from Push
```
DELETE /api/v1/push/subscribe
Body: { endpoint }
Response: { status: "unsubscribed" }
```

### Check Subscription Status
```
GET /api/v1/push/subscribe
Query: ?endpoint=...
Response: { subscribed: true/false }
```

### Send Admin Notification
```
POST /api/admin/communications/push
Body: { title, body, url }
Headers: Authorization: Bearer {token}
Response: { sent: number }
```

### Get Push Status (Admin)
```
GET /api/admin/communications/push
Headers: Authorization: Bearer {token}
Response: {
  vapidConfigured: true/false,
  subscriberCount: number,
  recentNotifications: []
}
```

---

## Support Resources

- **Web Push Specification:** https://w3c.github.io/push-api/
- **VAPID RFC:** https://tools.ietf.org/html/draft-thomson-webpush-vapid
- **web-push npm:** https://www.npmjs.com/package/web-push
- **MDN Web Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Push_API

