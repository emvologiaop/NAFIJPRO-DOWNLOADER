# 🔐 Super Admin Dashboard - Complete Guide

## Overview

The admin dashboard is located at `/su` and provides full control over:
- **User Management**: Create, edit, delete users, change roles, ban users
- **Referral Codes**: Create, edit, delete referral codes with usage limits
- **Access Control**: Password-protected with ADMIN_PASSWORD from `.env`

---

## 🚀 Quick Start

### 1. Set Admin Password in `.env.local`

```env
ADMIN_PASSWORD=your_strong_password_here
```

Default: `admin@nafij2024`

### 2. Access Dashboard

Go to: **http://localhost:3000/su**

Enter your admin password and click "Access Dashboard"

---

## 📊 Features

### Users Management

#### View All Users
- List all users with pagination (20 per page)
- See: Email, Username, Role, Status, Creation Date
- Search and filter capabilities

#### Edit User
- **Email**: Change user email address
- **Username**: Modify username
- **Role**: Change between `user` and `admin`
- **Ban User**: Mark as banned with reason
  - When banned, user cannot access the app
  - Can add ban reason for record
  - Admin can edit ban status anytime

#### Delete User
- Permanently remove user account
- Also removes from Supabase auth
- Confirmation required before deletion

### Referral Codes Management

#### View All Codes
- List all special referral codes
- Pagination support
- See: Code, Role, Usage, Status, Expiration

#### Create Referral Code
```
Code: NAFIJ26
Role: user or admin
Max Uses: 0 (unlimited) or any number
```

#### Edit Referral Code
- **Code**: Read-only (cannot change)
- **Role**: Change user/admin role
- **Max Uses**: Set usage limit (0 = unlimited)
- **Current Uses**: Manually adjust usage counter
- **Active**: Enable/disable code
- **Expires At**: Set expiration date (optional)

#### Delete Referral Code
- Permanently remove referral code
- Users can no longer use it
- Confirmation required

---

## 🔑 API Endpoints

All endpoints require password in Authorization header:
```bash
Authorization: Bearer YOUR_ADMIN_PASSWORD
```

### Users

```bash
# List users
GET /api/admin/users?page=1&limit=20

# Get single user
GET /api/admin/users/[userId]

# Update user
PATCH /api/admin/users/[userId]
{
  "role": "admin",
  "email": "newemail@example.com",
  "username": "newusername",
  "is_banned": true,
  "ban_reason": "Spam activity"
}

# Delete user
DELETE /api/admin/users/[userId]
```

### Referrals

```bash
# List referrals
GET /api/admin/referrals?page=1&limit=20

# Create referral
POST /api/admin/referrals
{
  "code": "NAFIJ26",
  "role": "user",
  "max_uses": 0,
  "expires_at": "2025-12-31"
}

# Update referral
PATCH /api/admin/referrals/[id]
{
  "role": "admin",
  "max_uses": 50,
  "is_active": true,
  "expires_at": "2025-12-31"
}

# Delete referral
DELETE /api/admin/referrals/[id]
```

---

## 💡 Use Cases

### Scenario 1: Create Promotion Code
```
1. Go to /su → Referrals tab
2. Code: SUMMER_2024
3. Role: user
4. Max Uses: 100
5. Click Create
```
Now users can register with code `SUMMER_2024` (max 100 times)

### Scenario 2: Make Admin
```
1. Go to /su → Users tab
2. Find user
3. Click Edit button
4. Change Role to "admin"
5. Save Changes
```

### Scenario 3: Ban Spammer
```
1. Go to /su → Users tab
2. Find spammer email
3. Click Edit button
4. Enable "Ban User"
5. Set Reason: "Spam content"
6. Save Changes
```

### Scenario 4: Adjust Referral Usage
```
1. Go to /su → Referrals tab
2. Find referral code
3. Click Edit button
4. Change "Current Uses" (e.g., reset to 5)
5. Set "Expires At" date if needed
6. Save Changes
```

---

## 🔒 Security

- **Password Protected**: All admin features require ADMIN_PASSWORD
- **Service Role Key**: Only needed in `.env.local` (not exposed to frontend)
- **Validation**: All inputs validated on both client and server
- **Error Handling**: Clear error messages with no sensitive data exposure
- **Database Integrity**: Proper foreign keys and cascading rules

---

## 📝 Environment Variables

Required in `fauntend/.env.local`:

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role

# Admin Dashboard
ADMIN_PASSWORD=strong_admin_password_here
```

**NEVER commit `.env.local` to git!**

---

## 🎯 Database Schema

### users table
```sql
- id: UUID (primary key)
- email: string
- username: string
- role: 'user' | 'admin'
- is_banned: boolean (default false)
- ban_reason: string (nullable)
- created_at: timestamp
- updated_at: timestamp
```

### special_referrals table
```sql
- id: BIGSERIAL (primary key)
- code: string (unique)
- role: 'user' | 'admin'
- max_uses: integer (0 = unlimited)
- current_uses: integer
- is_active: boolean (default true)
- expires_at: timestamp (nullable)
- created_at: timestamp
- updated_at: timestamp
```

---

## ⚠️ Important Notes

1. **Password Security**: Use a strong password (15+ characters with mix of letters, numbers, symbols)
2. **Backup**: Keep a backup of important referral codes and user records
3. **Audit Log**: Consider logging admin actions in production
4. **Two-Factor Auth**: Consider adding 2FA for extra security
5. **IP Whitelist**: In production, restrict `/su` to trusted IPs only

---

## 🆘 Troubleshooting

**Problem**: /su page shows blank
- **Solution**: Check if ADMIN_PASSWORD is set in .env.local

**Problem**: "Invalid Password" error
- **Solution**: Verify ADMIN_PASSWORD matches exactly in .env.local

**Problem**: Can't see users/referrals
- **Solution**: Check SUPABASE_SERVICE_ROLE_KEY is correct

**Problem**: Password error logs
- **Solution**: Check browser console for detailed error messages

---

## 🚀 Deploy to Production

### Vercel

1. Add environment variable in Vercel Dashboard:
   ```
   ADMIN_PASSWORD = your_strong_password
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
   ```

2. Access admin panel:
   ```
   https://your-app.vercel.app/su
   ```

### Important: Restrict Access

In production, consider adding:
- IP whitelist middleware
- Rate limiting on `/su` routes
- Session timeouts
- Audit logging

---

## 📞 Support

For issues or questions:
1. Check `.env.local` has all required variables
2. Verify database connection in Supabase
3. Check browser console for errors
4. Review API endpoint logs

