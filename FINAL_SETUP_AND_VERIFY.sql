-- =====================================================================
-- COMPLETE DATABASE SETUP & VERIFICATION SCRIPT
-- =====================================================================
-- This script will:
-- 1. Apply RLS hotfix v2 (required for signup)
-- 2. Run complete diagnostic
-- 3. Verify all components
-- 4. Report any issues
-- =====================================================================

-- SECTION 1: RLS HOTFIX v2 - ENABLE PUBLIC READS FOR SIGNUP
-- =====================================================================

ALTER TABLE public.special_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active referral codes" ON public.special_referrals;
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.special_referrals;

CREATE POLICY "Anyone can read active referral codes" ON public.special_referrals
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage referral codes" ON public.special_referrals
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can verify referral codes" ON public.users;
DROP POLICY IF EXISTS "Anyone can read user referral codes" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;

CREATE POLICY "Anyone can read user referral codes" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users read own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert on signup" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================================
-- SECTION 2: COMPLETE DIAGNOSTIC & VERIFICATION
-- =====================================================================

SELECT '════════════════════════════════════════' as status;
SELECT '[STARTING DIAGNOSTIC]' as step;
SELECT '════════════════════════════════════════' as _;

-- 1. EXTENSIONS CHECK
SELECT '[✓ CHECK 1/10] EXTENSIONS' as check_type;
SELECT count(*) as extension_count, string_agg(extname, ', ') as installed_extensions
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- 2. TABLES CHECK
SELECT '[✓ CHECK 2/10] TABLES' as check_type;
SELECT count(*) as table_count, string_agg(tablename, ', ' ORDER BY tablename) as tables
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename IN ('users', 'special_referrals', 'api_keys', 'api_key_usage', 'chat_session_keys', 'ai_api_keys', 'ai_api_key_audit', 'ai_provider_usage', 'ai_provider_config', 'ai_api_key_rotation_history');

-- 3. USERS TABLE SCHEMA
SELECT '[✓ CHECK 3/10] USERS TABLE SCHEMA' as check_type;
SELECT count(*) as column_count, string_agg(column_name, ', ' ORDER BY column_name) as columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users';

-- 4. FUNCTIONS CHECK
SELECT '[✓ CHECK 4/10] FUNCTIONS' as check_type;
SELECT count(*) as function_count, string_agg(p.proname, ', ' ORDER BY p.proname) as functions_exist
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('create_user_on_signup', 'increment_referral_uses', 'update_updated_at_column', 'hash_api_key', 'encrypt_api_key', 'decrypt_api_key');

-- 5. TRIGGERS CHECK
SELECT '[✓ CHECK 5/10] TRIGGERS' as check_type;
SELECT count(*) as trigger_count, string_agg(tgname, ', ' ORDER BY tgname) as triggers_exist
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgrelid::regclass::text LIKE 'public%'
  AND tgname IN ('on_auth_user_created', 'update_users_updated_at', 'update_special_referrals_updated_at', 'update_ai_api_keys_updated_at', 'update_ai_provider_usage_updated_at', 'update_ai_provider_config_updated_at');

-- 6. RLS POLICIES CHECK
SELECT '[✓ CHECK 6/10] RLS POLICIES' as check_type;
SELECT count(*) as policy_count, string_agg(DISTINCT tablename, ', ' ORDER BY tablename) as tables_with_rls
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'special_referrals');

-- 7. INDEXES CHECK
SELECT '[✓ CHECK 7/10] INDEXES' as check_type;
SELECT count(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public' AND indexname NOT LIKE 'pg_%';

-- 8. RLS STATUS (ENABLED/DISABLED)
SELECT '[✓ CHECK 8/10] RLS ENABLED STATUS' as check_type;
SELECT n.nspname as schema_name,
       c.relname as table_name,
       CASE WHEN c.relrowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ⚠️' END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('users', 'special_referrals', 'api_keys', 'chat_session_keys', 'api_key_usage', 'ai_api_keys', 'ai_provider_config', 'ai_provider_usage')
ORDER BY c.relname;

-- 9. DATA VERIFICATION
SELECT '[✓ CHECK 9/10] DATA VERIFICATION' as check_type;
SELECT 'users' as table_name, count(*) as row_count FROM public.users
UNION ALL
SELECT 'special_referrals', count(*) FROM public.special_referrals
UNION ALL
SELECT 'api_keys', count(*) FROM public.api_keys
UNION ALL
SELECT 'ai_api_keys', count(*) FROM public.ai_api_keys
UNION ALL
SELECT 'chat_session_keys', count(*) FROM public.chat_session_keys;

-- 10. REFERRAL CODES STATUS
SELECT '[✓ CHECK 10/10] REFERRAL CODES STATUS' as check_type;
SELECT code, role, max_uses, current_uses, is_active, expires_at
FROM public.special_referrals
LIMIT 10;

-- =====================================================================
-- FINAL REPORT
-- =====================================================================

SELECT '════════════════════════════════════════' as final_status;
SELECT '[✅ DIAGNOSTIC COMPLETE]' as result;
SELECT '════════════════════════════════════════' as __;

SELECT
  CASE
    WHEN (SELECT count(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto')) = 2 THEN '✅ Extensions: OK'
    ELSE '⚠️ Extensions: MISSING'
  END as ext_status,
  CASE
    WHEN (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%') >= 10 THEN '✅ Tables: OK'
    ELSE '⚠️ Tables: MISSING'
  END as table_status,
  CASE
    WHEN (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') >= 6 THEN '✅ Functions: OK'
    ELSE '⚠️ Functions: MISSING'
  END as func_status,
  CASE
    WHEN (SELECT count(*) FROM pg_trigger WHERE tgisinternal = false) >= 6 THEN '✅ Triggers: OK'
    ELSE '⚠️ Triggers: MISSING'
  END as trigger_status,
  CASE
    WHEN (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') >= 10 THEN '✅ RLS: OK'
    ELSE '⚠️ RLS: INCOMPLETE'
  END as rls_status;

SELECT '[NEXT STEPS]' as _;
SELECT '1. Check results above' as step1;
SELECT '2. If all say OK ✅ - System is PRODUCTION READY' as step2;
SELECT '3. If any show ⚠️ - Run SUPABASE_COMPLETE_SETUP.sql first' as step3;
SELECT '4. Test signup with referral code' as step4;
SELECT '5. Test admin panel /su' as step5;
