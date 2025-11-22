-- FitTrack Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exercises table (you will populate this)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  body_part TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  type TEXT NOT NULL CHECK (type IN ('strength', 'bodyweight', 'cardio')),
  met DECIMAL(4,2) NOT NULL,
  volume_coefficient DECIMAL(6,4) NOT NULL,
  equipment TEXT NOT NULL,
  primary_muscle JSONB,
  secondary_muscle JSONB,
  tertiary_muscle JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  body_weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout sessions
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise logs
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER,
  reps INTEGER,
  weight_kg DECIMAL(6,2),
  duration_minutes DECIMAL(6,2),
  calories_time DECIMAL(8,2),
  calories_volume DECIMAL(8,2),
  total_calories DECIMAL(8,2),
  volume DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step tracking
CREATE TABLE step_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL,
  distance_km DECIMAL(6,3),
  calories DECIMAL(8,2),
  activity_type TEXT DEFAULT 'walking',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Routines
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('gym', 'home', 'custom')),
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine exercises (many-to-many)
CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  suggested_sets INTEGER,
  suggested_reps INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
CREATE INDEX idx_exercise_logs_session ON exercise_logs(session_id);
CREATE INDEX idx_step_logs_user_date ON step_logs(user_id, date DESC);
CREATE INDEX idx_exercises_body_part ON exercises(body_part);
CREATE INDEX idx_exercises_type ON exercises(type);
CREATE INDEX idx_routines_user ON routines(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Workout sessions policies
CREATE POLICY "Users can view own sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Exercise logs policies
CREATE POLICY "Users can view own exercise logs" ON exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = exercise_logs.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own exercise logs" ON exercise_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = exercise_logs.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own exercise logs" ON exercise_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = exercise_logs.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own exercise logs" ON exercise_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = exercise_logs.session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- Step logs policies
CREATE POLICY "Users can view own step logs" ON step_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own step logs" ON step_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own step logs" ON step_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own step logs" ON step_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Routines policies
CREATE POLICY "Users can view own routines and templates" ON routines
  FOR SELECT USING (auth.uid() = user_id OR is_template = TRUE);

CREATE POLICY "Users can create own routines" ON routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines" ON routines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines" ON routines
  FOR DELETE USING (auth.uid() = user_id);

-- Routine exercises policies
CREATE POLICY "Users can view routine exercises" ON routine_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND (routines.user_id = auth.uid() OR routines.is_template = TRUE)
    )
  );

CREATE POLICY "Users can manage own routine exercises" ON routine_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.user_id = auth.uid()
    )
  );

-- Exercises table is public read (no RLS needed, or enable with public SELECT policy)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are publicly readable" ON exercises
  FOR SELECT USING (TRUE);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: 79 EXERCISES
-- ============================================

-- CHEST (18 exercises)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Push-ups', 'chest', 'beginner', 'bodyweight', 3.8, 0.0012, 'none', '{"muscle": "Chest", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders, Triceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Incline Push-ups', 'chest', 'beginner', 'bodyweight', 3.0, 0.0010, 'bench', '{"muscle": "Upper Chest", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, '{"muscle": "Triceps", "difficulty": "beginner"}'::jsonb),
('Decline Push-ups', 'chest', 'intermediate', 'bodyweight', 5.5, 0.0015, 'bench', '{"muscle": "Lower Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb),
('Chest Dips', 'chest', 'advanced', 'bodyweight', 6.0, 0.0018, 'parallel bars', '{"muscle": "Lower Chest", "difficulty": "advanced"}'::jsonb, '{"muscle": "Triceps, Shoulders", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Flat Barbell Bench Press', 'chest', 'intermediate', 'strength', 6.0, 0.0025, 'barbell', '{"muscle": "Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Incline Barbell Bench Press', 'chest', 'advanced', 'strength', 6.5, 0.0028, 'barbell', '{"muscle": "Upper Chest", "difficulty": "advanced"}'::jsonb, '{"muscle": "Shoulders, Triceps", "difficulty": "advanced"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Decline Barbell Bench Press', 'chest', 'intermediate', 'strength', 5.8, 0.0023, 'barbell', '{"muscle": "Lower Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Dumbbell Bench Press', 'chest', 'intermediate', 'strength', 6.0, 0.0024, 'dumbbells', '{"muscle": "Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb),
('Incline Dumbbell Press', 'chest', 'advanced', 'strength', 6.5, 0.0027, 'dumbbells', '{"muscle": "Upper Chest", "difficulty": "advanced"}'::jsonb, '{"muscle": "Shoulders, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Decline Dumbbell Press', 'chest', 'intermediate', 'strength', 5.8, 0.0022, 'dumbbells', '{"muscle": "Lower Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Dumbbell Fly', 'chest', 'intermediate', 'strength', 5.0, 0.0020, 'dumbbells', '{"muscle": "Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Incline Dumbbell Fly', 'chest', 'intermediate', 'strength', 5.2, 0.0021, 'dumbbells', '{"muscle": "Upper Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Dumbbell Pullover', 'chest', 'intermediate', 'strength', 5.5, 0.0020, 'dumbbell', '{"muscle": "Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Lats, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb),
('Cable Fly (Mid)', 'chest', 'beginner', 'strength', 4.5, 0.0018, 'cables', '{"muscle": "Chest", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, NULL),
('Cable Fly (High to Low)', 'chest', 'intermediate', 'strength', 4.8, 0.0019, 'cables', '{"muscle": "Lower Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Cable Fly (Low to High)', 'chest', 'intermediate', 'strength', 4.8, 0.0019, 'cables', '{"muscle": "Upper Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Pec Deck Machine', 'chest', 'beginner', 'strength', 4.0, 0.0016, 'machine', '{"muscle": "Chest", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, NULL),
('Chest Press Machine', 'chest', 'intermediate', 'strength', 5.5, 0.0022, 'machine', '{"muscle": "Chest", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb);

-- BACK (15 exercises)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Pull-ups', 'back', 'advanced', 'bodyweight', 6.0, 0.0020, 'pull-up bar', '{"muscle": "Lats", "difficulty": "advanced"}'::jsonb, '{"muscle": "Biceps, Rear Delts", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb),
('Chin-ups', 'back', 'intermediate', 'bodyweight', 5.5, 0.0018, 'pull-up bar', '{"muscle": "Lats", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Biceps, Forearms", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Lat Pulldown (Wide Grip)', 'back', 'intermediate', 'strength', 5.0, 0.0020, 'cable machine', '{"muscle": "Lats", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Biceps, Rear Delts", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Lat Pulldown (Close Grip)', 'back', 'beginner', 'strength', 4.8, 0.0019, 'cable machine', '{"muscle": "Lats", "difficulty": "beginner"}'::jsonb, '{"muscle": "Biceps, Mid Back", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Barbell Bent-Over Row', 'back', 'intermediate', 'strength', 6.0, 0.0025, 'barbell', '{"muscle": "Mid Back", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Lats, Biceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb),
('Pendlay Row', 'back', 'advanced', 'strength', 6.5, 0.0028, 'barbell', '{"muscle": "Back", "difficulty": "advanced"}'::jsonb, '{"muscle": "Lats, Biceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "advanced"}'::jsonb),
('T-Bar Row', 'back', 'intermediate', 'strength', 6.0, 0.0024, 't-bar', '{"muscle": "Mid Back", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Lats, Biceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Lower Back", "difficulty": "intermediate"}'::jsonb),
('Dumbbell Row', 'back', 'beginner', 'strength', 5.5, 0.0022, 'dumbbells', '{"muscle": "Lats", "difficulty": "beginner"}'::jsonb, '{"muscle": "Mid Back, Biceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Chest-Supported Row', 'back', 'intermediate', 'strength', 5.0, 0.0020, 'machine', '{"muscle": "Mid Back", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Lats, Biceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Rear Delts", "difficulty": "beginner"}'::jsonb),
('Seated Cable Row', 'back', 'beginner', 'strength', 5.0, 0.0020, 'cable machine', '{"muscle": "Back", "difficulty": "beginner"}'::jsonb, '{"muscle": "Lats, Biceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Rear Delts", "difficulty": "beginner"}'::jsonb),
('Deadlift', 'back', 'advanced', 'strength', 7.0, 0.0030, 'barbell', '{"muscle": "Back", "difficulty": "advanced"}'::jsonb, '{"muscle": "Hamstrings, Glutes, Core", "difficulty": "advanced"}'::jsonb, '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb),
('Romanian Deadlift', 'back', 'advanced', 'strength', 6.5, 0.0028, 'barbell', '{"muscle": "Hamstrings", "difficulty": "advanced"}'::jsonb, '{"muscle": "Glutes, Lower Back", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb),
('Hyperextensions', 'back', 'beginner', 'bodyweight', 4.0, 0.0012, 'hyperextension bench', '{"muscle": "Lower Back", "difficulty": "beginner"}'::jsonb, '{"muscle": "Glutes, Hamstrings", "difficulty": "beginner"}'::jsonb, NULL),
('Straight Arm Pulldown', 'back', 'beginner', 'strength', 4.5, 0.0018, 'cable machine', '{"muscle": "Lats", "difficulty": "beginner"}'::jsonb, '{"muscle": "Rear Delts", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Inverted Row', 'back', 'beginner', 'bodyweight', 4.5, 0.0015, 'bar', '{"muscle": "Back", "difficulty": "beginner"}'::jsonb, '{"muscle": "Biceps, Rear Delts", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb);

-- SHOULDERS (9 exercises)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Overhead Barbell Press', 'shoulders', 'intermediate', 'strength', 6.0, 0.0025, 'barbell', '{"muscle": "Front Delts", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Side Delts, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb),
('Dumbbell Shoulder Press', 'shoulders', 'beginner', 'strength', 5.5, 0.0023, 'dumbbells', '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, '{"muscle": "Triceps, Upper Chest", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Arnold Press', 'shoulders', 'advanced', 'strength', 6.5, 0.0027, 'dumbbells', '{"muscle": "Shoulders", "difficulty": "advanced"}'::jsonb, '{"muscle": "Upper Chest, Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb),
('Lateral Raises', 'shoulders', 'beginner', 'strength', 4.5, 0.0015, 'dumbbells', '{"muscle": "Side Delts", "difficulty": "beginner"}'::jsonb, '{"muscle": "Upper Traps", "difficulty": "beginner"}'::jsonb, NULL),
('Front Raise', 'shoulders', 'beginner', 'strength', 4.0, 0.0014, 'dumbbells', '{"muscle": "Front Delts", "difficulty": "beginner"}'::jsonb, '{"muscle": "Upper Chest", "difficulty": "beginner"}'::jsonb, NULL),
('Rear Delt Fly', 'shoulders', 'intermediate', 'strength', 4.5, 0.0016, 'dumbbells', '{"muscle": "Rear Delts", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Mid Back", "difficulty": "beginner"}'::jsonb, NULL),
('Cable Face Pull', 'shoulders', 'beginner', 'strength', 4.0, 0.0015, 'cable machine', '{"muscle": "Rear Delts", "difficulty": "beginner"}'::jsonb, '{"muscle": "Rotator Cuff, Upper Back", "difficulty": "beginner"}'::jsonb, NULL),
('Barbell Shrugs', 'shoulders', 'intermediate', 'strength', 5.0, 0.0020, 'barbell', '{"muscle": "Traps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb),
('Dumbbell Shrugs', 'shoulders', 'beginner', 'strength', 4.5, 0.0018, 'dumbbells', '{"muscle": "Traps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb);

-- BICEPS (6 exercises)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Dumbbell Curl', 'biceps', 'beginner', 'strength', 4.0, 0.0015, 'dumbbells', '{"muscle": "Biceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb, NULL),
('Hammer Curl', 'biceps', 'beginner', 'strength', 4.0, 0.0015, 'dumbbells', '{"muscle": "Brachialis/Biceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb, NULL),
('Barbell Curl', 'biceps', 'intermediate', 'strength', 4.5, 0.0018, 'barbell', '{"muscle": "Biceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb),
('Concentration Curl', 'biceps', 'beginner', 'strength', 3.5, 0.0012, 'dumbbell', '{"muscle": "Biceps", "difficulty": "beginner"}'::jsonb, NULL, NULL),
('Preacher Curl', 'biceps', 'beginner', 'strength', 4.0, 0.0016, 'barbell or dumbbells', '{"muscle": "Biceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb, NULL),
('Cable Curl', 'biceps', 'beginner', 'strength', 4.0, 0.0015, 'cable machine', '{"muscle": "Biceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb, NULL);

-- TRICEPS (6 exercises)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Tricep Pushdown', 'triceps', 'beginner', 'strength', 4.0, 0.0015, 'cable machine', '{"muscle": "Triceps", "difficulty": "beginner"}'::jsonb, NULL, NULL),
('Skull Crushers', 'triceps', 'intermediate', 'strength', 5.0, 0.0020, 'barbell or dumbbells', '{"muscle": "Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, NULL),
('Overhead Tricep Extension', 'triceps', 'intermediate', 'strength', 4.5, 0.0018, 'dumbbell', '{"muscle": "Triceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb),
('Close Grip Bench Press', 'triceps', 'advanced', 'strength', 6.0, 0.0025, 'barbell', '{"muscle": "Triceps", "difficulty": "advanced"}'::jsonb, '{"muscle": "Chest, Shoulders", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Dips', 'triceps', 'advanced', 'bodyweight', 6.0, 0.0020, 'parallel bars', '{"muscle": "Triceps", "difficulty": "advanced"}'::jsonb, '{"muscle": "Chest, Shoulders", "difficulty": "advanced"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Bench Dips', 'triceps', 'beginner', 'bodyweight', 4.0, 0.0012, 'bench', '{"muscle": "Triceps", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders, Chest", "difficulty": "beginner"}'::jsonb, NULL);

-- LEGS (11 exercises)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Back Squat', 'legs', 'advanced', 'strength', 7.0, 0.0030, 'barbell', '{"muscle": "Quads", "difficulty": "advanced"}'::jsonb, '{"muscle": "Glutes, Hamstrings, Core", "difficulty": "advanced"}'::jsonb, '{"muscle": "Lower Back", "difficulty": "intermediate"}'::jsonb),
('Front Squat', 'legs', 'advanced', 'strength', 7.0, 0.0030, 'barbell', '{"muscle": "Quads", "difficulty": "advanced"}'::jsonb, '{"muscle": "Core, Glutes", "difficulty": "advanced"}'::jsonb, '{"muscle": "Upper Back", "difficulty": "intermediate"}'::jsonb),
('Lunges', 'legs', 'intermediate', 'bodyweight', 5.5, 0.0018, 'dumbbells optional', '{"muscle": "Quads", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Glutes, Hamstrings", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Leg Press', 'legs', 'intermediate', 'strength', 6.0, 0.0024, 'machine', '{"muscle": "Quads", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Glutes, Hamstrings", "difficulty": "intermediate"}'::jsonb, NULL),
('Calf Raises', 'legs', 'beginner', 'strength', 3.5, 0.0012, 'machine or dumbbells', '{"muscle": "Calves", "difficulty": "beginner"}'::jsonb, NULL, NULL),
('Hip Thrust', 'legs', 'intermediate', 'strength', 5.5, 0.0022, 'barbell', '{"muscle": "Glutes", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Hamstrings", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Bulgarian Split Squat', 'legs', 'advanced', 'bodyweight', 6.5, 0.0024, 'dumbbells optional', '{"muscle": "Quads", "difficulty": "advanced"}'::jsonb, '{"muscle": "Glutes, Hamstrings", "difficulty": "advanced"}'::jsonb, '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb),
('Step-ups', 'legs', 'beginner', 'bodyweight', 5.0, 0.0016, 'dumbbells optional', '{"muscle": "Quads", "difficulty": "beginner"}'::jsonb, '{"muscle": "Glutes", "difficulty": "beginner"}'::jsonb, '{"muscle": "Hamstrings", "difficulty": "beginner"}'::jsonb),
('Leg Extension', 'legs', 'beginner', 'strength', 4.0, 0.0015, 'machine', '{"muscle": "Quads", "difficulty": "beginner"}'::jsonb, NULL, NULL),
('Leg Curl (Seated/Lying)', 'legs', 'beginner', 'strength', 4.0, 0.0015, 'machine', '{"muscle": "Hamstrings", "difficulty": "beginner"}'::jsonb, '{"muscle": "Glutes", "difficulty": "beginner"}'::jsonb, NULL),
('Walking Lunges', 'legs', 'intermediate', 'bodyweight', 5.5, 0.0018, 'dumbbells optional', '{"muscle": "Quads", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Glutes, Hamstrings", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb);

-- CORE/ABS (5 exercises)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Crunch', 'core', 'beginner', 'bodyweight', 3.0, 0.0008, 'none', '{"muscle": "Upper Abs", "difficulty": "beginner"}'::jsonb, NULL, NULL),
('Leg Raise', 'core', 'intermediate', 'bodyweight', 5.0, 0.0015, 'none', '{"muscle": "Lower Abs", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Hip Flexors", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Plank', 'core', 'beginner', 'bodyweight', 3.5, 0.0010, 'none', '{"muscle": "Core", "difficulty": "beginner"}'::jsonb, '{"muscle": "Lower Back", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb),
('Russian Twist', 'core', 'beginner', 'bodyweight', 4.0, 0.0012, 'weight optional', '{"muscle": "Obliques", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb, '{"muscle": "Hip Flexors", "difficulty": "beginner"}'::jsonb),
('Mountain Climbers', 'core', 'intermediate', 'bodyweight', 6.0, 0.0015, 'none', '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Shoulders, Glutes", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Legs", "difficulty": "beginner"}'::jsonb);

-- FOREARMS (4 exercises)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Wrist Curls', 'forearms', 'beginner', 'strength', 3.0, 0.0010, 'dumbbells or barbell', '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb, NULL, NULL),
('Reverse Wrist Curls', 'forearms', 'beginner', 'strength', 3.0, 0.0010, 'dumbbells or barbell', '{"muscle": "Forearms", "difficulty": "beginner"}'::jsonb, NULL, NULL),
('Farmer Carry', 'forearms', 'intermediate', 'strength', 5.5, 0.0020, 'dumbbells or kettlebells', '{"muscle": "Forearms", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Traps, Core", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Legs", "difficulty": "beginner"}'::jsonb),
('Dead Hang', 'forearms', 'intermediate', 'bodyweight', 4.0, 0.0012, 'pull-up bar', '{"muscle": "Forearms", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Lats", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb);

-- CARDIO (4 exercises)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Burpees', 'cardio', 'advanced', 'bodyweight', 8.0, 0.0020, 'none', '{"muscle": "Legs", "difficulty": "advanced"}'::jsonb, '{"muscle": "Chest, Shoulders", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "intermediate"}'::jsonb),
('Jump Rope', 'cardio', 'beginner', 'cardio', 10.0, 0.0000, 'jump rope', '{"muscle": "Calves", "difficulty": "beginner"}'::jsonb, '{"muscle": "Shoulders", "difficulty": "beginner"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Rowing Machine', 'cardio', 'intermediate', 'cardio', 7.0, 0.0000, 'rowing machine', '{"muscle": "Back", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Legs, Biceps", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb),
('Running', 'cardio', 'intermediate', 'cardio', 9.8, 0.0000, 'none', '{"muscle": "Legs", "difficulty": "intermediate"}'::jsonb, '{"muscle": "Core", "difficulty": "beginner"}'::jsonb, '{"muscle": "Glutes", "difficulty": "beginner"}'::jsonb);

-- NECK (1 exercise)
INSERT INTO exercises (name, body_part, difficulty, type, met, volume_coefficient, equipment, primary_muscle, secondary_muscle, tertiary_muscle) VALUES
('Neck Flexion', 'neck', 'beginner', 'strength', 3.0, 0.0008, 'plate or harness', '{"muscle": "Neck", "difficulty": "beginner"}'::jsonb, NULL, NULL);
