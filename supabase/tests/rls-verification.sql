-- Orbit RLS Verification Tests
-- Run these tests to verify row-level security is properly configured.
-- These tests should be run in a Supabase development environment.

-- ============================================================
-- SECTION 1: RLS ENABLED VERIFICATION
-- ============================================================

-- Verify RLS is enabled on all critical tables
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles',
    'tasks',
    'task_instances', 
    'repeat_rules',
    'reminders',
    'gamification_stats',
    'money_accounts',
    'transactions',
    'notes',
    'notes_task_links',
    'daily_snapshots',
    'audit_logs',
    'point_logs',
    'reminder_deliveries',
    'idempotency_keys',
    'transaction_categories',
    'entity_links',
    'recurring_transactions'
  )
ORDER BY tablename;

-- Expected: All tables should show rls_enabled = true

-- ============================================================
-- SECTION 2: POLICY EXISTENCE VERIFICATION
-- ============================================================

-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- SECTION 3: USER ISOLATION TEST QUERIES
-- These simulate cross-tenant access attempts
-- ============================================================

-- Test 1: User cannot see other user's tasks
-- As User A, try to select User B's tasks
-- Expected: 0 rows (should only see own tasks)
/*
-- Test with authenticated user A
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'user-a-uuid';

SELECT * FROM tasks WHERE user_id = 'user-b-uuid';
-- Expected: 0 rows returned

SELECT * FROM tasks;
-- Expected: Only tasks belonging to user-a-uuid
*/

-- Test 2: User cannot insert into other user's records
/*
-- As User A, try to insert task for User B
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'user-a-uuid';

INSERT INTO tasks (user_id, title) VALUES ('user-b-uuid', 'Hacked Task');
-- Expected: Error - violates RLS policy
*/

-- Test 3: User cannot update other user's records  
/*
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'user-a-uuid';

UPDATE tasks SET title = 'Hacked' WHERE user_id = 'user-b-uuid';
-- Expected: 0 rows affected
*/

-- Test 4: User cannot delete other user's records
/*
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'user-a-uuid';

DELETE FROM tasks WHERE user_id = 'user-b-uuid';
-- Expected: 0 rows affected
*/

-- ============================================================
-- SECTION 4: FINANCE ISOLATION (CRITICAL)
-- ============================================================

-- Test 5: User cannot see other user's transactions
/*
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'user-a-uuid';

SELECT * FROM transactions WHERE user_id = 'user-b-uuid';
-- Expected: 0 rows (financial data is NEVER shared)
*/

-- Test 6: User cannot see other user's money accounts
/*
SELECT * FROM money_accounts WHERE user_id = 'user-b-uuid';
-- Expected: 0 rows
*/

-- ============================================================
-- SECTION 5: SERVER-ONLY TABLES VERIFICATION
-- ============================================================

-- Tables that should NOT have client policies:
-- - idempotency_keys (server-managed)
-- - point_logs (insert via server only in Phase 2+)
-- - reminder_deliveries (server-managed)

-- List policies on server-only tables
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('idempotency_keys', 'point_logs', 'reminder_deliveries');

-- Note: These tables should have RLS enabled but minimal/no client policies
-- Writes should come from service_role only

-- ============================================================
-- SECTION 6: ANONYMOUS ACCESS DENIAL
-- ============================================================

-- Test 7: Anonymous users cannot access user data
/*
SET LOCAL role = 'anon';

SELECT * FROM tasks;
-- Expected: 0 rows or permission denied

SELECT * FROM transactions;  
-- Expected: 0 rows or permission denied

SELECT * FROM profiles;
-- Expected: 0 rows (except maybe public profiles)
*/

-- ============================================================
-- SUMMARY CHECKLIST
-- ============================================================

-- Run this query to get a summary of RLS coverage
SELECT
  COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls,
  COUNT(*) FILTER (WHERE rowsecurity = false) as tables_without_rls,
  COUNT(*) as total_tables
FROM pg_tables 
WHERE schemaname = 'public';

-- Expected: All user-scoped tables should have RLS enabled
