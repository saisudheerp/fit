-- ============================================
-- COMPLETE DATABASE RESET (NUCLEAR OPTION)
-- WARNING: This deletes EVERYTHING including auth users
-- Use with caution!
-- ============================================

-- Step 1: Disable RLS on all tables
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercise_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS step_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routine_exercises DISABLE ROW LEVEL SECURITY;

-- Step 2: Clear all user data
TRUNCATE TABLE routine_exercises CASCADE;
TRUNCATE TABLE routines CASCADE;
TRUNCATE TABLE step_logs CASCADE;
TRUNCATE TABLE exercise_logs CASCADE;
TRUNCATE TABLE workout_sessions CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Step 3: Delete all auth users (THIS WILL SIGN EVERYONE OUT!)
-- Note: You need to be a service_role to do this
-- If this fails, delete users manually from Dashboard → Authentication → Users
DELETE FROM auth.users;

-- Step 4: Re-enable RLS
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routine_exercises ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify everything is clean
SELECT 
  'Exercises (should have 79)' as table_name, 
  COUNT(*) as count 
FROM exercises
UNION ALL
SELECT 'Profiles (should be 0)', COUNT(*) FROM profiles
UNION ALL
SELECT 'Workout Sessions (should be 0)', COUNT(*) FROM workout_sessions
UNION ALL
SELECT 'Exercise Logs (should be 0)', COUNT(*) FROM exercise_logs
UNION ALL
SELECT 'Step Logs (should be 0)', COUNT(*) FROM step_logs
UNION ALL
SELECT 'Routines (should be 0)', COUNT(*) FROM routines
UNION ALL
SELECT 'Routine Exercises (should be 0)', COUNT(*) FROM routine_exercises
UNION ALL
SELECT 'Auth Users (should be 0)', COUNT(*) FROM auth.users;
