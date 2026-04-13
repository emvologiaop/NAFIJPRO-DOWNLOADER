# ⚡ Admin Dashboard - Quick Reference

## 🚀 Access Dashboard

```
URL: http://localhost:3000/su
Password: Check .env.local ADMIN_PASSWORD
```

---

## 👥 User Management Quick Guide

### View All Users
1. Go to **Users** tab
2. See: Email | Username | Role | Status | Created

### Make Someone Admin
1. Find user in **Users** tab
2. Click **Edit** button
3. Change Role → **admin**
4. Click **Save Changes** ✅

### Ban a User
1. Find user in **Users** tab
2. Click **Edit** button
3. Enable **Ban User** → Yes
4. Enter **Ban Reason** (optional)
5. Click **Save Changes** ✅
6. User is now locked out immediately

### Change User Email
1. Find user in **Users** tab
2. Click **Edit** button
3. Change **Email** field
4. Click **Save Changes** ✅

### Delete a User
1. Find user in **Users** tab
2. Click **Delete** button (🗑️)
3. Confirm deletion
4. User account removed ✅

### Change User Role
- **user** → Normal user
- **admin** → Administrator with full access

---

## 🎁 Referral Codes Quick Guide

### Create New Code
1. Go to **Referrals** tab
2. Fill in **Create New Referral** form:
   - Code: `NAFIJ26` (20 chars max)
   - Role: `user` or `admin`
   - Max Uses: `0` (unlimited) or `50` (limit)
3. Click **Create** ✅

### Make Code Admin-Only
1. Go to **Referrals** tab
2. Find code → Click **Edit** button
3. Change Role → **admin**
4. Click **Save Changes** ✅
5. Only code users get admin role

### Limit Code Usage
1. Go to **Referrals** tab
2. Find code → Click **Edit** button
3. Set **Max Uses**: `100` (stops after 100 registrations)
4. Click **Save Changes** ✅

### Expire a Code
1. Go to **Referrals** tab
2. Find code → Click **Edit** button
3. Set **Expires At**: `2024-12-31`
4. Click **Save Changes** ✅
5. Code stops working on that date

### Deactivate Code (Without Deleting)
1. Go to **Referrals** tab
2. Find code → Click **Edit** button
3. Set **Active**: Off
4. Click **Save Changes** ✅
5. Code still exists but can't be used

### Check Code Usage
1. Go to **Referrals** tab
2. Look at **Uses** column: `5 / 50`
   - `5` = current uses
   - `50` = max uses
   - `5 / ∞` = unlimited

### Reset Usage Counter
1. Go to **Referrals** tab
2. Find code → Click **Edit** button
3. Change **Current Uses**: `0`
4. Click **Save Changes** ✅
5. Counter resets (for analytics reset)

### Delete Code
1. Go to **Referrals** tab
2. Find code → Click **Delete** button (🗑️)
3. Confirm deletion
4. Code removed ✅

---

## 📊 Common Tasks

| Need | Steps | Time |
|------|-------|------|
| Create referral for campaign | Referrals → Create → Enter code/role → Done | 1 min |
| Make existing user admin | Users → Edit → Role=admin → Save | 30 sec |
| Ban spammer | Users → Edit → Ban User=Yes → Reason → Save | 30 sec |
| Limit code registrations | Referrals → Edit → Max Uses=100 → Save | 30 sec |
| Expire old code | Referrals → Edit → Expires=date → Save | 30 sec |
| Check who signed up | Users → View list with creation dates | 1 min |
| Reset spam user password | Users → Delete → Have them re-signup | 1 min |

---

## 🔢 Status Meanings

### User Role
- **user** = Normal user
- **admin** = Full administrative access

### User Status
- **Active** = Can login and use app
- **Banned** = Locked out, cannot login

### Referral Status
- **Active** = Can be used for signup
- **Inactive** = Cannot be used (won't work)

### Code Usage
- `0 / 0` = Unlimited uses (no tracking)
- `5 / 50` = 5 used, max 50
- `50 / 50` = At max, no more signups allowed

---

## ⌨️ Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Submit form | `Enter` |
| Cancel edit | `Esc` (or click Cancel) |
| Next page | Click "Next" or PageDown |
| Previous page | Click "Previous" or PageUp |
| Logout | Click Logout button |

---

## 🎯 Real-World Examples

### Example 1: Create Summer Campaign
```
1. Referrals → Create
2. Code: SUMMER_2024
3. Role: user
4. Max Uses: 100
5. Expires: 2024-08-31
6. Done! Now max 100 users can signup
```

### Example 2: Create Admin Code
```
1. Referrals → Create
2. Code: ADMIN_TEAM_2024
3. Role: admin
4. Max Uses: 5
5. Done! First 5 users get admin access
```

### Example 3: Ban Troublemaker
```
1. Users → Find "spammer@test.com"
2. Click Edit
3. Ban User: Yes
4. Reason: "Multiple rule violations"
5. Save → User is banned immediately
```

### Example 4: Promote User
```
1. Users → Find "good_user@test.com"
2. Click Edit
3. Role: admin
4. Save → User now has admin access
```

---

## ⚠️ Important Notes

- ❌ **Can't undo delete** → Deleted users/codes are gone forever
- ❌ **Can't edit code name** → Delete and recreate if needed
- ✅ **Can deactivate safely** → Disable instead of delete to keep history
- ✅ **Can restrict anytime** → Change max uses on active codes
- ✅ **Bans are instant** → Banned users locked out immediately

---

## 🚨 Emergency Actions

### Code is Being Abused
1. Referrals → Find code
2. Click Edit
3. Set **Active**: Off
4. Save
5. Code stops working instantly ✅

### User is Spamming
1. Users → Find user
2. Click Edit
3. Ban User: Yes
4. Save
5. User locked out immediately ✅

### Need to Check Usage
1. Referrals tab
2. Look at Uses column
3. See exactly how many times used ✅

---

## 💡 Pro Tips

1. **Use Descriptive Codes**
   - ✅ `SUMMER_2024_50` (describes code)
   - ❌ `X32K` (confusing)

2. **Set Realistic Limits**
   - ✅ `Max Uses: 100` (reasonable)
   - ❌ `Max Uses: 1000000` (defeats purpose)

3. **Document Codes**
   - Keep list: Code | Purpose | Date Created
   - Example: SUMMER_2024 | Campaign | 2024-06-01

4. **Regular Audits**
   - Check usage stats weekly
   - Review user roles monthly
   - Clean up expired codes

5. **Backup Data**
   - Export user list periodically
   - Screenshot important settings
   - Keep referral code record

---

## 🆘 Common Issues

| Problem | Fix |
|---------|-----|
| Can't login to admin | Check ADMIN_PASSWORD in .env.local |
| Can't see users | Browser cache - try Ctrl+Shift+Del |
| Edit button not working | Check password is still valid |
| Changes not saving | Check for error message in alerts |
| User still active after ban | Try refreshing page or logout/login |

---

## 📞 Need Help?

1. Check `ADMIN_DASHBOARD.md` for full docs
2. Check your `.env.local` has correct password
3. Check browser console (F12) for errors
4. Verify Supabase connection

---

**You're all set! Happy managing! 🎉**
