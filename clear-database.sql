-- ============================================
-- CLEAR AND RESET DATABASE
-- Run this in Supabase SQL Editor to start fresh
-- ============================================

-- Disable RLS temporarily to allow deletions
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercise_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS step_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routine_exercises DISABLE ROW LEVEL SECURITY;

-- Delete all user data (exercises table is static data, keep it)
TRUNCATE TABLE routine_exercises CASCADE;
TRUNCATE TABLE routines CASCADE;
TRUNCATE TABLE step_logs CASCADE;
TRUNCATE TABLE exercise_logs CASCADE;
TRUNCATE TABLE workout_sessions CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Re-enable RLS
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routine_exercises ENABLE ROW LEVEL SECURITY;

-- Verify exercises table still has data
SELECT COUNT(*) as exercise_count FROM exercises;

-- Verify all user tables are empty
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM workout_sessions) as sessions_count,
  (SELECT COUNT(*) FROM exercise_logs) as logs_count,
  (SELECT COUNT(*) FROM step_logs) as steps_count,
  (SELECT COUNT(*) FROM routines) as routines_count,
  (SELECT COUNT(*) FROM routine_exercises) as routine_exercises_count;
