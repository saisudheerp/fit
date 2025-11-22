-- ============================================
-- COMPLETE RLS POLICIES - NO ERRORS
-- This file sets up ALL RLS policies correctly
-- Run this in Supabase SQL Editor
-- ============================================

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;

DROP POLICY IF EXISTS "Users can view own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can insert own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can update own workout sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can delete own workout sessions" ON workout_sessions;

DROP POLICY IF EXISTS "Users can view own exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can insert own exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can update own exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can delete own exercise logs" ON exercise_logs;

DROP POLICY IF EXISTS "Users can view own step logs" ON step_logs;
DROP POLICY IF EXISTS "Users can insert own step logs" ON step_logs;
DROP POLICY IF EXISTS "Users can update own step logs" ON step_logs;
DROP POLICY IF EXISTS "Users can delete own step logs" ON step_logs;

DROP POLICY IF EXISTS "Users can view own routines" ON routines;
DROP POLICY IF EXISTS "Users can insert own routines" ON routines;
DROP POLICY IF EXISTS "Users can update own routines" ON routines;
DROP POLICY IF EXISTS "Users can delete own routines" ON routines;

DROP POLICY IF EXISTS "Users can view own routine exercises" ON routine_exercises;
DROP POLICY IF EXISTS "Users can insert own routine exercises" ON routine_exercises;
DROP POLICY IF EXISTS "Users can update own routine exercises" ON routine_exercises;
DROP POLICY IF EXISTS "Users can delete own routine exercises" ON routine_exercises;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to INSERT their profile (for first-time creation)
-- This allows both authenticated users AND the trigger to create profiles
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    OR auth.role() = 'service_role'
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- WORKOUT SESSIONS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own workout sessions"
  ON workout_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions"
  ON workout_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions"
  ON workout_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions"
  ON workout_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- EXERCISE LOGS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own exercise logs"
  ON exercise_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise logs"
  ON exercise_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise logs"
  ON exercise_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise logs"
  ON exercise_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- STEP LOGS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own step logs"
  ON step_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own step logs"
  ON step_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own step logs"
  ON step_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own step logs"
  ON step_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ROUTINES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own routines"
  ON routines
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines"
  ON routines
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON routines
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON routines
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ROUTINE EXERCISES TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view own routine exercises"
  ON routine_exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own routine exercises"
  ON routine_exercises
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own routine exercises"
  ON routine_exercises
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own routine exercises"
  ON routine_exercises
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

-- ============================================
-- VERIFY ALL POLICIES ARE CREATED
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected results:
-- profiles: 4 policies
-- workout_sessions: 4 policies
-- exercise_logs: 4 policies
-- step_logs: 4 policies
-- routines: 4 policies
-- routine_exercises: 4 policies
-- Total: 24 policies

SELECT 'RLS Policies setup complete! Total policies: ' || COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public';
