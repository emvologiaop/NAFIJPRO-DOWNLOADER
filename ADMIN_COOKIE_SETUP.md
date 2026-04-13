# Admin Cookie Management Documentation

## Overview

The DownAria platform provides secure admin cookie management for social media platforms. Cookies are encrypted locally using XOR cipher with HMAC validation before storage.

---

## How Admin Cookies Work

### Supported Platforms
- Facebook
- Instagram
- Twitter
- Weibo

### Storage Method
- **Storage Location**: Browser localStorage
- **Storage Key**: `downaria_cookies`
- **Encryption**: XOR cipher with APP_KEY: `DownAria2025!@#$`
- **Integrity Check**: HMAC-SHA256 validation
- **Client-Side Only**: Cookies never sent to backend

---

## Accessing Admin Cookie Page

### Step 1: Login as Admin
1. Navigate to https://downloader.nafij.me/auth
2. Sign in with your admin Supabase account
3. Must have `role: 'admin'` in Supabase users table

### Step 2: Access Admin Panel
1. After login, navigate to: https://downloader.nafij.me/admin
2. You will see admin dashboard with menu options
3. Click **"Settings"** in the admin sidebar

### Step 3: Navigate to Cookie Storage
In the Admin Settings page (`/admin/settings`), you will find:
- Platform-specific cookie input fields
- Current status of stored cookies
- Clear/Reset options

---

## How to Save Admin Cookies

### For Each Platform:

#### Facebook Cookies
1. Go to Admin Settings page
2. Find the **"Facebook Cookies"** input field
3. Copy your Facebook cookies from browser DevTools:
   - Open Chrome/Firefox DevTools (F12)
   - Go to Application → Cookies → facebook.com
   - Copy the value of relevant cookies (usually `c_user`, `xs`, `datr`)
   - Paste into the input field
4. Click **"Save"** button
5. Cookies will be encrypted and stored locally

#### Instagram Cookies
1. Find the **"Instagram Cookies"** input field
2. Copy from browser DevTools:
   - Application → Cookies → instagram.com
   - Copy session cookie values
3. Paste and click **"Save"**

#### Twitter Cookies
1. Find the **"Twitter Cookies"** input field
2. Copy from browser DevTools:
   - Application → Cookies → twitter.com
   - Copy authentication tokens
3. Paste and click **"Save"**

#### Weibo Cookies
1. Find the **"Weibo Cookies"** input field
2. Copy from browser DevTools:
   - Application → Cookies → weibo.com
3. Paste and click **"Save"**

---

## Where Cookies Are Stored

### Browser Storage Location
```
localStorage key: "downaria_cookies"
```

### Storage Structure (After Encryption)
```json
{
  "facebook": "encrypted_cookie_string",
  "instagram": "encrypted_cookie_string",
  "twitter": "encrypted_cookie_string",
  "weibo": "encrypted_cookie_string"
}
```

### Encryption Process
1. Plain cookies are JSON stringified
2. XOR cipher applied with APP_KEY
3. HMAC-SHA256 added for validation
4. Base64 encoded
5. Stored in localStorage

---

## How to Get Platform Cookies

### Method 1: Browser DevTools (Recommended)

#### Firefox
1. Press `F12` to open DevTools
2. Go to **Storage** tab
3. Click **Cookies** in left sidebar
4. Select the platform domain (facebook.com, instagram.com, etc.)
5. Find session/auth cookies (look for `c_user`, `xs`, `datr` for Facebook)
6. Right-click and **Copy Value**

#### Chrome
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Cookies** → Select domain
4. Find and copy relevant cookie values

#### Safari
1. Press `Cmd + Option + I` to open DevTools
2. Go to **Storage** tab
3. Navigate to Cookies for the domain
4. Copy cookie values

### Method 2: Browser Console
```javascript
// Get all cookies as string
document.cookie

// Get specific platform cookies
// For Facebook
console.log(document.cookie.match(/c_user=[^;]+/)?.[0])

// For Instagram  
console.log(document.cookie.match(/sessionid=[^;]+/)?.[0])

// For Twitter
console.log(document.cookie.match(/auth_token=[^;]+/)?.[0])
```

---

## Security Best Practices

### DO:
✅ Use strong, unique session cookies
✅ Keep cookies updated regularly
✅ Use HTTPS only (no HTTP)
✅ Clear cookies after use
✅ Don't share cookie values
✅ Check encryption status

### DON'T:
❌ Commit cookies to git
❌ Share cookies in plain text
❌ Use expired cookies
❌ Store in public files
❌ Use cookies for sensitive transactions
❌ Leave admin panel open unattended

---

## Managing Stored Cookies

### View Stored Cookies
1. Open Admin Settings
2. Check the status indicator next to each platform
3. Shows if cookies are encrypted and valid

### Update Cookies
1. Clear the existing value
2. Paste new cookie
3. Click **"Save"**
4. Old cookies will be replaced

### Clear Cookies
1. Open Admin Settings
2. Click **"Clear All"** button
3. Choose **"Confirm"**
4. All encrypted cookies will be deleted from localStorage

### Reset to Default
1. Click **"Reset to Default"** button
2. This removes encryption and regenerates keys

---

## Troubleshooting

### Issue: Cookies Not Saving
**Solution:**
- Check browser localStorage is enabled
- Clear browser cache and try again
- Ensure you're logged in as admin
- Check browser console for errors (F12)

### Issue: Cookies Keep Disappearing
**Solution:**
- Browser privacy mode doesn't persist localStorage
- Use normal browsing mode
- Check if auto-clear on exit is enabled
- Disable ad blockers that might clear storage

### Issue: Getting "[object Object]" Error
**Solution:**
- Make sure you copied the full cookie value
- Don't paste JSON objects, paste string values only
- Try using browser console method instead
- Ensure no special characters are breaking the format

### Issue: Admin Access Denied
**Solution:**
- Verify account has `role: 'admin'` in Supabase
- Log out and log back in
- Clear auth tokens: `localStorage.removeItem('sb-*-auth-token')`
- Check Supabase dashboard for permissions

---

## File References

| Component | Location |
|-----------|----------|
| Encryption Logic | `/fauntend/src/lib/storage/crypto.ts` |
| Storage Functions | `/fauntend/src/lib/storage/settings.ts` |
| Admin Layout | `/fauntend/src/app/admin/layout.tsx` |
| Settings Page | `/fauntend/src/app/admin/settings/page.tsx` |
| Admin Guard | `/fauntend/src/components/AdminGuard.tsx` |

---

## API Endpoints for Cookie Management

### Migrate Cookies (Advanced)
```
POST /api/admin/cookies/migrate
Headers: Authorization: Bearer {admin_token}
Purpose: Migrate cookies to new encryption scheme
```

### Clear Cache
```
DELETE /api/admin/cache
Headers: Authorization: Bearer {admin_token}
Purpose: Clear server-side cache
```

---

## Support

For issues or questions about admin cookies:
1. Check browser console (F12 → Console tab)
2. Review error messages in DevTools
3. Verify Supabase authentication
4. Check localStorage is not full
5. Try "Clear All and Reset" option

