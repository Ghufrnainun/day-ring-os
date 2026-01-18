-- P2+ Migration: Server-Only RLS Policies
-- These tables should only be written by service_role (server)
-- Users can only read their own delivery/point logs

-- ============================================================
-- idempotency_keys - Server-only writes
-- ============================================================

-- Remove any existing insert policies (users shouldn't insert directly)
DROP POLICY IF EXISTS "Users can create own idempotency_keys" ON public.idempotency_keys;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies
-- Service role bypasses RLS, so no explicit policy needed for inserts
-- Users can only read their own keys (for debugging)
CREATE POLICY "Users can view own idempotency keys"
  ON public.idempotency_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- point_logs - Server-only writes (Phase 2+)
-- ============================================================

-- Remove any existing insert policies
DROP POLICY IF EXISTS "Users can create point_logs" ON public.point_logs;
DROP POLICY IF EXISTS "Users can insert point_logs" ON public.point_logs;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.point_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own point history
-- Policy already exists but let's make sure
CREATE POLICY IF NOT EXISTS "Users can view own point logs"
  ON public.point_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for users
-- All writes go through server actions using service_role

-- ============================================================
-- reminder_deliveries - Server-only writes
-- ============================================================

-- Remove any existing insert policies
DROP POLICY IF EXISTS "Users can create reminder_deliveries" ON public.reminder_deliveries;
DROP POLICY IF EXISTS "Users can insert reminder_deliveries" ON public.reminder_deliveries;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.reminder_deliveries ENABLE ROW LEVEL SECURITY;

-- Users can only view their own delivery history
-- Policy already exists but let's make sure
CREATE POLICY IF NOT EXISTS "Users can view own delivery logs"
  ON public.reminder_deliveries
  FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for users
-- All writes go through system job using service_role

-- ============================================================
-- daily_snapshots - Server-only writes (end-of-day job)
-- ============================================================

-- Remove any existing insert policies
DROP POLICY IF EXISTS "Users can create daily_snapshots" ON public.daily_snapshots;
DROP POLICY IF EXISTS "Users can insert daily_snapshots" ON public.daily_snapshots;
DROP POLICY IF EXISTS "Users can update daily_snapshots" ON public.daily_snapshots;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.daily_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only view their own snapshots
-- Policy already exists but ensure it's correct
CREATE POLICY IF NOT EXISTS "Users can view own snapshots"
  ON public.daily_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- gamification_stats - Restrict updates to server
-- ============================================================

-- Keep SELECT for users
-- Keep existing SELECT policy

-- Remove direct UPDATE policy from users (updates come from server actions)
-- Note: We'll keep the update policy for now as users can trigger updates via actions
-- but actual point calculations happen server-side

-- ============================================================
-- VERIFICATION QUERIES
-- Run these to verify policies are correctly configured
-- ============================================================

-- List all policies on server-only tables
SELECT 
  tablename,
  policyname,
  cmd AS operation,
  permissive
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('idempotency_keys', 'point_logs', 'reminder_deliveries', 'daily_snapshots')
ORDER BY tablename, cmd;

-- Verify no INSERT policies exist for users on server-only tables
-- Expected: Only SELECT policies should exist
