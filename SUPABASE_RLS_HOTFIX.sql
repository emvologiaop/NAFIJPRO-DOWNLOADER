-- =====================================================================
-- SUPABASE RLS HOTFIX - Allow Public Reads for Signup Verification
-- =====================================================================
-- The auth page needs to verify referral codes during signup (unauthenticated)
-- These policies allow public reads only for necessary signup verification

-- ─────────────────────────────────────────────────────────────────────
-- Fix special_referrals RLS - Allow public read for verification
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.special_referrals ENABLE ROW LEVEL SECURITY;

-- Public can read active referral codes (for signup verification)
DROP POLICY IF EXISTS "Public can read active referral codes" ON public.special_referrals;
CREATE POLICY "Public can read active referral codes" ON public.special_referrals
  FOR SELECT USING (is_active = true);

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.special_referrals;
CREATE POLICY "Admins can manage referrals" ON public.special_referrals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────
-- Fix users table RLS - Allow public read of referral_code lookup
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Public can read referral_code, username, email (for signup verification)
DROP POLICY IF EXISTS "Public can verify referral codes" ON public.users;
CREATE POLICY "Public can verify referral codes" ON public.users
  FOR SELECT USING (true);

-- Users can read own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
CREATE POLICY "Admins can read all profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Admins can update any user
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Admins can delete users
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Users can update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================================
-- Verification
-- =====================================================================

SELECT 'RLS Policies Fixed' as status;
SELECT
  schemaname,
  tablename,
  count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('users', 'special_referrals')
GROUP BY schemaname, tablename;
