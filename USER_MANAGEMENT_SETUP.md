# User Management System Setup

## Overview
Complete user management system with referral code support and role assignment.

## Key Changes Made

### 1. Referral-Based Role Assignment
**File:** `fauntend/src/lib/supabase.ts`
- Updated `signUp()` to accept an optional `role` parameter
- Role is now passed in auth user metadata during signup

**File:** `fauntend/src/app/auth/page.tsx`
- When a user signs up with a referral code, their role is passed to `signUp()`
- Special referral codes (`special_referrals` table) assign admin/user roles
- Normal user referrals assign 'user' role

### 2. Database Trigger for Auto-Creation
**File:** `SUPABASE_AUTH_TRIGGER.sql` (NEW - MUST RUN IN SUPABASE)
- Creates automatic trigger: `on_auth_user_created`
- When new `auth.users` record created → automatically create `public.users` record
- Role from auth metadata is captured in the trigger
- This ensures every auth user has a corresponding public user record with correct role

**Action Required:**
```sql
-- Run this SQL in Supabase SQL Editor before users start signing up
-- See SUPABASE_AUTH_TRIGGER.sql
```

### 3. Admin User Management (/su page)
**File:** `fauntend/src/app/su/page.tsx`
- **Create User:** Email + Role selection → POST `/api/admin/users`
- **Edit User:** Change role, username, ban status → PATCH `/api/admin/users/[id]`
- **Delete User:** With confirmation dialog → DELETE `/api/admin/users/[id]`
- All operations require admin password

**Files:** Frontend API endpoints
- `fauntend/src/app/api/admin/users/route.ts` - GET (list), POST (create)
- `fauntend/src/app/api/admin/users/[id]/route.ts` - PATCH (update), DELETE

### 4. Database Schema
**File:** `SUPABASE_USERS_SETUP.sql`
- Users table with role, username, display_name, status, is_banned fields
- Proper indexes and RLS policies
- Must be run before users can be created

## Sign-Up Flow with Referral Codes

### Normal (Non-Referral) Signup
1. User signs up without referral code
2. Role defaults to 'user'
3. `auth.users` created → trigger automatically creates `public.users` with role='user'

### Admin Referral Code
1. User enters special referral code (e.g., "ADMIN_CODE_123")
2. System verifies code is active and not expired
3. User signs up with role='admin' passed to `signUp()`
4. `auth.users` created with role='admin' in metadata
5. Trigger creates `public.users` with role='admin'
6. Referral usage counter incremented

### User Referral Code
1. User enters normal user's referral code
2. System verifies code exists and is active
3. User signs up with role='user'
4. `auth.users` created with role='user'
5. Trigger creates `public.users` with role='user'
6. Referrer's `total_referrals` incremented

## Testing Checklist

- [ ] **Run SUPABASE_AUTH_TRIGGER.sql** in Supabase SQL Editor
- [ ] Create new test referral code as "admin" role via /su admin panel
- [ ] Sign up with this referral code → verify role is 'admin'
- [ ] Create new test referral code as "user" role via /su admin panel  
- [ ] Sign up with this referral code → verify role is 'user'
- [ ] Sign up without referral code → verify role is 'user'
- [ ] Admin adds user via /su panel → verify user appears and role is correct
- [ ] Admin edits user role → verify changes persist
- [ ] Admin deletes user → verify user is removed

## Admin Panel (/su)
- **Login:** Use ADMIN_PASSWORD from environment variables
- **Users Tab:** View, add, edit, delete users
- **Referrals Tab:** Manage referral codes for new signups

## Important Environment Variables
- `ADMIN_PASSWORD` - Password for /su admin panel
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

## Architecture Summary

```
User Creation Flow:
├── Direct (via /su password panel)
│   └── Admin creates user → POST /api/admin/users
│       └── Creates in public.users with specified role
│
└── Signup (with referral code)
    ├── User enters referral code
    ├── System verifies code and its role
    └── User signs up with role='admin'|'user' depending on code
        └── auth.users created with role in metadata
            └── Trigger automatically creates public.users with same role
```

## Troubleshooting

**Issue: Users not appearing after signup**
- Check SUPABASE_AUTH_TRIGGER.sql was executed
- Verify trigger exists: `SELECT * FROM pg_trigger WHERE relname = 'auth_users'`
- Check auth user metadata has 'role' field

**Issue: Wrong role assigned**
- For signup: Check referral code has correct role
- For admin add: Check role dropdown was set correctly

**Issue: /su page authentication fails**
- Verify ADMIN_PASSWORD environment variable is set
- Check for whitespace in password
- Confirm URL is http://yourdomain.com/su

