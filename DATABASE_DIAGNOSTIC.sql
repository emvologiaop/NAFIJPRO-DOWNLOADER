-- =====================================================================
-- COMPREHENSIVE DATABASE DIAGNOSTIC CHECK
-- =====================================================================
-- Run this to verify EVERYTHING is installed and working correctly

-- 1. CHECK EXTENSIONS
SELECT '[1] EXTENSIONS' as check_type, count(*) as count, string_agg(extname, ', ') as details
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- 2. CHECK ALL TABLES EXIST
SELECT '[2] TABLES' as check_type, count(*) as count, string_agg(tablename, ', ') as details
FROM pg_tables
WHERE schemaname = 'public';

-- 3. CHECK TABLE COLUMNS
SELECT '[3] TABLE SCHEMAS' as check_type, 'users' as table_name, count(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
UNION ALL
SELECT '[3] TABLE SCHEMAS', 'special_referrals', count(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'special_referrals'
UNION ALL
SELECT '[3] TABLE SCHEMAS', 'api_keys', count(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'api_keys'
UNION ALL
SELECT '[3] TABLE SCHEMAS', 'chat_session_keys', count(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'chat_session_keys'
UNION ALL
SELECT '[3] TABLE SCHEMAS', 'ai_api_keys', count(*)
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ai_api_keys';

-- 4. CHECK ALL FUNCTIONS EXIST
SELECT '[4] FUNCTIONS' as check_type, count(*) as count, string_agg(p.proname, ', ') as details
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname IN ('create_user_on_signup', 'increment_referral_uses', 'update_updated_at_column', 'hash_api_key', 'encrypt_api_key', 'decrypt_api_key');

-- 5. CHECK ALL TRIGGERS
SELECT '[5] TRIGGERS' as check_type, count(*) as count, string_agg(t.tgname, ', ') as details
FROM pg_trigger t
WHERE NOT t.tgisinternal
AND t.tgrelid::regclass::text LIKE 'public%';

-- 6. CHECK RLS POLICIES
SELECT '[6] RLS POLICIES' as check_type,
       count(*) as count,
       string_agg(DISTINCT tablename, ', ') as tables_with_rls
FROM pg_policies
WHERE schemaname = 'public';

-- 7. CHECK INDEXES
SELECT '[7] INDEXES' as check_type, count(*) as count, string_agg(indexname, ', ' ORDER BY indexname) as details
FROM pg_indexes
WHERE schemaname = 'public' AND indexname NOT LIKE 'pg_%';

-- 8. VERIFY KEY DATA EXISTS
SELECT '[8] DATA VERIFICATION' as check_type,
       'users' as table_name,
       count(*) as row_count
FROM public.users
UNION ALL
SELECT '[8] DATA VERIFICATION', 'special_referrals', count(*) FROM public.special_referrals
UNION ALL
SELECT '[8] DATA VERIFICATION', 'api_keys', count(*) FROM public.api_keys
UNION ALL
SELECT '[8] DATA VERIFICATION', 'ai_api_keys', count(*) FROM public.ai_api_keys;

-- 9. TEST RLS POLICIES (see which are working)
SELECT '[9] RLS POLICY DETAILS' as check_type,
       tablename,
       count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('users', 'special_referrals', 'api_keys')
GROUP BY tablename
ORDER BY tablename;

-- 10. CHECK FOR ANY RLS DISABLED TABLES
SELECT '[10] RLS STATUS' as check_type,
       schemaname,
       tablename,
       CASE WHEN rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ⚠️' END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN information_schema.tables t ON c.relname = t.table_name AND t.table_schema = n.nspname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('users', 'special_referrals', 'api_keys', 'chat_session_keys', 'api_key_usage', 'ai_api_keys', 'ai_provider_config', 'ai_provider_usage')
ORDER BY tablename;

-- 11. FINAL STATUS
SELECT '=== DIAGNOSTIC COMPLETE ===' as status;
SELECT 'Run signup verification test to ensure referral codes work' as next_step;
