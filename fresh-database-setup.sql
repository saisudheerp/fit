-- ============================================
-- FITTRACK - COMPLETE DATABASE SETUP
-- Fresh Supabase Database Installation
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: exercises (static exercise database)
-- ============================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  muscles JSONB NOT NULL,
  met_value DECIMAL(4,2) NOT NULL,
  volume_coefficient DECIMAL(6,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: profiles (user profile data)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  body_weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  age INTEGER,
  gender TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: workout_sessions
-- ============================================
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calories DECIMAL(8,2) DEFAULT 0,
  total_volume DECIMAL(10,2) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: exercise_logs
-- ============================================
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg DECIMAL(6,2),
  duration_minutes INTEGER,
  calories_burned DECIMAL(8,2),
  volume DECIMAL(10,2),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: step_logs
-- ============================================
CREATE TABLE step_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER NOT NULL,
  distance_km DECIMAL(6,2),
  calories_burned DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- TABLE: routines
-- ============================================
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: routine_exercises
-- ============================================
CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_kg DECIMAL(6,2),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
CREATE INDEX idx_exercise_logs_user_date ON exercise_logs(user_id, date DESC);
CREATE INDEX idx_exercise_logs_session ON exercise_logs(session_id);
CREATE INDEX idx_step_logs_user_date ON step_logs(user_id, date DESC);
CREATE INDEX idx_routines_user ON routines(user_id);
CREATE INDEX idx_routine_exercises_routine ON routine_exercises(routine_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Workout sessions policies
CREATE POLICY "Users can view own workout sessions"
  ON workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions"
  ON workout_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions"
  ON workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Exercise logs policies
CREATE POLICY "Users can view own exercise logs"
  ON exercise_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise logs"
  ON exercise_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise logs"
  ON exercise_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise logs"
  ON exercise_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Step logs policies
CREATE POLICY "Users can view own step logs"
  ON step_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own step logs"
  ON step_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own step logs"
  ON step_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own step logs"
  ON step_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Routines policies
CREATE POLICY "Users can view own routines"
  ON routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines"
  ON routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON routines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON routines FOR DELETE
  USING (auth.uid() = user_id);

-- Routine exercises policies (inherited from parent routine)
CREATE POLICY "Users can view own routine exercises"
  ON routine_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM routines
    WHERE routines.id = routine_exercises.routine_id
    AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own routine exercises"
  ON routine_exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM routines
    WHERE routines.id = routine_exercises.routine_id
    AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own routine exercises"
  ON routine_exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM routines
    WHERE routines.id = routine_exercises.routine_id
    AND routines.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own routine exercises"
  ON routine_exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM routines
    WHERE routines.id = routine_exercises.routine_id
    AND routines.user_id = auth.uid()
  ));

-- Exercises table: public read access (no RLS needed, it's static data)
-- No RLS on exercises table - everyone can read

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA: Exercise Database (79 exercises)
-- ============================================

-- CHEST EXERCISES (18)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Barbell Bench Press', 'chest', '{"primary": ["pectoralis major"], "secondary": ["anterior deltoid", "triceps"]}', 6.0, 0.0012),
('Incline Barbell Bench Press', 'chest', '{"primary": ["upper pectoralis"], "secondary": ["anterior deltoid", "triceps"]}', 6.0, 0.0012),
('Decline Barbell Bench Press', 'chest', '{"primary": ["lower pectoralis"], "secondary": ["triceps"]}', 6.0, 0.0011),
('Dumbbell Bench Press', 'chest', '{"primary": ["pectoralis major"], "secondary": ["anterior deltoid", "triceps"]}', 6.0, 0.0011),
('Incline Dumbbell Press', 'chest', '{"primary": ["upper pectoralis"], "secondary": ["anterior deltoid", "triceps"]}', 6.0, 0.0011),
('Decline Dumbbell Press', 'chest', '{"primary": ["lower pectoralis"], "secondary": ["triceps"]}', 6.0, 0.0010),
('Dumbbell Flyes', 'chest', '{"primary": ["pectoralis major"], "secondary": []}', 5.0, 0.0008),
('Incline Dumbbell Flyes', 'chest', '{"primary": ["upper pectoralis"], "secondary": []}', 5.0, 0.0008),
('Cable Flyes', 'chest', '{"primary": ["pectoralis major"], "secondary": []}', 4.5, 0.0007),
('Chest Dips', 'chest', '{"primary": ["lower pectoralis"], "secondary": ["triceps"]}', 8.0, 0.0015),
('Push-ups', 'chest', '{"primary": ["pectoralis major"], "secondary": ["anterior deltoid", "triceps"]}', 8.0, 0.0001),
('Incline Push-ups', 'chest', '{"primary": ["lower pectoralis"], "secondary": ["triceps"]}', 6.0, 0.0001),
('Decline Push-ups', 'chest', '{"primary": ["upper pectoralis"], "secondary": ["anterior deltoid", "triceps"]}', 10.0, 0.0001),
('Machine Chest Press', 'chest', '{"primary": ["pectoralis major"], "secondary": ["anterior deltoid", "triceps"]}', 5.5, 0.0010),
('Pec Deck Machine', 'chest', '{"primary": ["pectoralis major"], "secondary": []}', 4.5, 0.0008),
('Landmine Press', 'chest', '{"primary": ["pectoralis major"], "secondary": ["anterior deltoid", "triceps"]}', 6.0, 0.0011),
('Svend Press', 'chest', '{"primary": ["inner pectoralis"], "secondary": ["anterior deltoid"]}', 5.0, 0.0009),
('Cable Crossover', 'chest', '{"primary": ["pectoralis major"], "secondary": []}', 4.5, 0.0007);

-- BACK EXERCISES (15)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Deadlift', 'back', '{"primary": ["erector spinae", "latissimus dorsi"], "secondary": ["trapezius", "glutes", "hamstrings"]}', 8.0, 0.0015),
('Barbell Row', 'back', '{"primary": ["latissimus dorsi", "rhomboids"], "secondary": ["trapezius", "biceps"]}', 6.5, 0.0012),
('T-Bar Row', 'back', '{"primary": ["latissimus dorsi", "rhomboids"], "secondary": ["trapezius", "biceps"]}', 6.5, 0.0012),
('Dumbbell Row', 'back', '{"primary": ["latissimus dorsi", "rhomboids"], "secondary": ["trapezius", "biceps"]}', 6.0, 0.0011),
('Pull-ups', 'back', '{"primary": ["latissimus dorsi"], "secondary": ["biceps", "trapezius"]}', 8.0, 0.0002),
('Chin-ups', 'back', '{"primary": ["latissimus dorsi"], "secondary": ["biceps"]}', 8.0, 0.0002),
('Lat Pulldown', 'back', '{"primary": ["latissimus dorsi"], "secondary": ["biceps", "trapezius"]}', 5.5, 0.0010),
('Seated Cable Row', 'back', '{"primary": ["latissimus dorsi", "rhomboids"], "secondary": ["biceps"]}', 5.5, 0.0010),
('Face Pulls', 'back', '{"primary": ["rear deltoid", "trapezius"], "secondary": ["rhomboids"]}', 4.5, 0.0008),
('Shrugs', 'back', '{"primary": ["trapezius"], "secondary": []}', 5.0, 0.0010),
('Hyperextensions', 'back', '{"primary": ["erector spinae"], "secondary": ["glutes", "hamstrings"]}', 5.5, 0.0001),
('Rack Pulls', 'back', '{"primary": ["erector spinae", "trapezius"], "secondary": ["latissimus dorsi"]}', 7.5, 0.0014),
('Pendlay Row', 'back', '{"primary": ["latissimus dorsi", "rhomboids"], "secondary": ["trapezius"]}', 6.5, 0.0012),
('Inverted Row', 'back', '{"primary": ["latissimus dorsi", "rhomboids"], "secondary": ["biceps"]}', 6.0, 0.0001),
('Good Mornings', 'back', '{"primary": ["erector spinae"], "secondary": ["glutes", "hamstrings"]}', 6.0, 0.0011);

-- SHOULDER EXERCISES (9)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Overhead Press', 'shoulders', '{"primary": ["anterior deltoid", "medial deltoid"], "secondary": ["triceps"]}', 6.5, 0.0012),
('Dumbbell Shoulder Press', 'shoulders', '{"primary": ["anterior deltoid", "medial deltoid"], "secondary": ["triceps"]}', 6.0, 0.0011),
('Arnold Press', 'shoulders', '{"primary": ["anterior deltoid", "medial deltoid"], "secondary": ["triceps"]}', 6.0, 0.0011),
('Lateral Raises', 'shoulders', '{"primary": ["medial deltoid"], "secondary": []}', 4.5, 0.0008),
('Front Raises', 'shoulders', '{"primary": ["anterior deltoid"], "secondary": []}', 4.5, 0.0008),
('Rear Delt Flyes', 'shoulders', '{"primary": ["posterior deltoid"], "secondary": []}', 4.5, 0.0008),
('Upright Row', 'shoulders', '{"primary": ["medial deltoid", "trapezius"], "secondary": []}', 5.5, 0.0010),
('Cable Lateral Raises', 'shoulders', '{"primary": ["medial deltoid"], "secondary": []}', 4.5, 0.0008),
('Push Press', 'shoulders', '{"primary": ["anterior deltoid", "medial deltoid"], "secondary": ["triceps", "quadriceps"]}', 8.0, 0.0013);

-- BICEPS EXERCISES (6)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Barbell Curl', 'biceps', '{"primary": ["biceps brachii"], "secondary": ["brachialis"]}', 4.5, 0.0009),
('Dumbbell Curl', 'biceps', '{"primary": ["biceps brachii"], "secondary": ["brachialis"]}', 4.5, 0.0009),
('Hammer Curl', 'biceps', '{"primary": ["brachialis", "brachioradialis"], "secondary": ["biceps brachii"]}', 4.5, 0.0009),
('Preacher Curl', 'biceps', '{"primary": ["biceps brachii"], "secondary": []}', 4.5, 0.0009),
('Cable Curl', 'biceps', '{"primary": ["biceps brachii"], "secondary": []}', 4.5, 0.0009),
('Concentration Curl', 'biceps', '{"primary": ["biceps brachii"], "secondary": []}', 4.0, 0.0008);

-- TRICEPS EXERCISES (6)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Close-Grip Bench Press', 'triceps', '{"primary": ["triceps"], "secondary": ["pectoralis major"]}', 6.0, 0.0011),
('Tricep Dips', 'triceps', '{"primary": ["triceps"], "secondary": ["pectoralis major"]}', 8.0, 0.0015),
('Overhead Tricep Extension', 'triceps', '{"primary": ["triceps"], "secondary": []}', 4.5, 0.0009),
('Tricep Pushdown', 'triceps', '{"primary": ["triceps"], "secondary": []}', 4.5, 0.0009),
('Skull Crushers', 'triceps', '{"primary": ["triceps"], "secondary": []}', 4.5, 0.0009),
('Diamond Push-ups', 'triceps', '{"primary": ["triceps"], "secondary": ["pectoralis major"]}', 8.0, 0.0001);

-- LEG EXERCISES (11)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Barbell Squat', 'legs', '{"primary": ["quadriceps", "glutes"], "secondary": ["hamstrings", "erector spinae"]}', 8.0, 0.0014),
('Front Squat', 'legs', '{"primary": ["quadriceps"], "secondary": ["glutes", "erector spinae"]}', 8.0, 0.0014),
('Leg Press', 'legs', '{"primary": ["quadriceps", "glutes"], "secondary": ["hamstrings"]}', 6.0, 0.0012),
('Romanian Deadlift', 'legs', '{"primary": ["hamstrings", "glutes"], "secondary": ["erector spinae"]}', 7.0, 0.0013),
('Leg Curl', 'legs', '{"primary": ["hamstrings"], "secondary": []}', 5.0, 0.0009),
('Leg Extension', 'legs', '{"primary": ["quadriceps"], "secondary": []}', 5.0, 0.0009),
('Bulgarian Split Squat', 'legs', '{"primary": ["quadriceps", "glutes"], "secondary": ["hamstrings"]}', 7.0, 0.0012),
('Lunges', 'legs', '{"primary": ["quadriceps", "glutes"], "secondary": ["hamstrings"]}', 7.0, 0.0001),
('Calf Raises', 'legs', '{"primary": ["gastrocnemius", "soleus"], "secondary": []}', 4.5, 0.0009),
('Seated Calf Raises', 'legs', '{"primary": ["soleus"], "secondary": []}', 4.0, 0.0008),
('Hip Thrust', 'legs', '{"primary": ["glutes"], "secondary": ["hamstrings"]}', 6.5, 0.0012);

-- CORE EXERCISES (5)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Plank', 'core', '{"primary": ["rectus abdominis", "transverse abdominis"], "secondary": ["obliques"]}', 4.0, 0.0001),
('Crunches', 'core', '{"primary": ["rectus abdominis"], "secondary": []}', 4.5, 0.0001),
('Russian Twists', 'core', '{"primary": ["obliques"], "secondary": ["rectus abdominis"]}', 5.0, 0.0001),
('Hanging Leg Raises', 'core', '{"primary": ["rectus abdominis"], "secondary": ["hip flexors"]}', 6.0, 0.0001),
('Cable Woodchoppers', 'core', '{"primary": ["obliques"], "secondary": ["rectus abdominis"]}', 5.0, 0.0008);

-- FOREARM EXERCISES (4)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Wrist Curl', 'forearms', '{"primary": ["flexor carpi"], "secondary": []}', 3.5, 0.0007),
('Reverse Wrist Curl', 'forearms', '{"primary": ["extensor carpi"], "secondary": []}', 3.5, 0.0007),
('Farmers Walk', 'forearms', '{"primary": ["forearm flexors"], "secondary": ["trapezius", "core"]}', 6.0, 0.0010),
('Dead Hang', 'forearms', '{"primary": ["forearm flexors"], "secondary": ["latissimus dorsi"]}', 5.0, 0.0001);

-- CARDIO EXERCISES (4)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Running', 'cardio', '{"primary": ["cardiovascular"], "secondary": ["quadriceps", "hamstrings", "calves"]}', 9.0, 0.0000),
('Cycling', 'cardio', '{"primary": ["cardiovascular"], "secondary": ["quadriceps"]}', 7.5, 0.0000),
('Rowing Machine', 'cardio', '{"primary": ["cardiovascular"], "secondary": ["latissimus dorsi", "quadriceps"]}', 8.5, 0.0000),
('Jump Rope', 'cardio', '{"primary": ["cardiovascular"], "secondary": ["calves"]}', 11.0, 0.0000);

-- NECK EXERCISES (1)
INSERT INTO exercises (name, category, muscles, met_value, volume_coefficient) VALUES
('Neck Curls', 'neck', '{"primary": ["sternocleidomastoid"], "secondary": []}', 3.5, 0.0007);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count exercises by category
SELECT 
  category,
  COUNT(*) as count
FROM exercises
GROUP BY category
ORDER BY category;

-- Total exercise count (should be 79)
SELECT COUNT(*) as total_exercises FROM exercises;

-- Verify all tables exist
SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Done!
SELECT 'Database setup complete! Ready to use.' as status;
