# FitTrack - Supabase Setup Instructions

## 1. Database Setup

Run the SQL schema in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard → SQL Editor → New Query
# Copy and paste the entire content from: supabase-schema.sql
# Click "Run" to execute
```

This creates:
- ✅ Exercises table (you will populate)
- ✅ User profiles (auto-created on signup)
- ✅ Workout sessions & exercise logs
- ✅ Step tracking
- ✅ Routines & templates
- ✅ Row-level security policies

---

## 2. Add Your Exercises

You need to populate the `exercises` table. Example insert:

```sql
INSERT INTO exercises (
  name,
  body_part,
  difficulty,
  type,
  met,
  volume_coefficient,
  equipment,
  primary_muscle,
  secondary_muscle,
  tertiary_muscle
) VALUES
(
  'Push-ups',
  'chest',
  'beginner',
  'bodyweight',
  3.8,
  0.0012,
  'none',
  '{"muscle": "Chest", "difficulty": "beginner"}'::jsonb,
  '{"muscle": "Shoulders, Triceps", "difficulty": "beginner"}'::jsonb,
  '{"muscle": "Core", "difficulty": "beginner"}'::jsonb
),
(
  'Flat Barbell Bench Press',
  'chest',
  'intermediate',
  'strength',
  6.0,
  0.0025,
  'barbell',
  '{"muscle": "Chest", "difficulty": "intermediate"}'::jsonb,
  '{"muscle": "Shoulders, Triceps", "difficulty": "intermediate"}'::jsonb,
  '{"muscle": "Core", "difficulty": "beginner"}'::jsonb
);
-- Add all 79 exercises here...
```

**Or** use CSV import:
1. Create a CSV file with columns: `name,body_part,difficulty,type,met,volume_coefficient,equipment`
2. Go to Supabase → Table Editor → exercises → Insert → Import CSV

---

## 3. Auth Configuration

Enable email auth in Supabase:

1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Configure email templates (optional)
4. **Disable** email confirmation for testing (or leave enabled for production)

---

## 4. Environment Variables

Your `.env` file is already configured with your Supabase credentials:

```
VITE_SUPABASE_URL=https://czfbrgywwngszjzgjyib.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 5. Test the App

1. **Sign Up**: Go to `/auth` and create an account
2. **Add Exercises**: Populate the `exercises` table in Supabase
3. **Log Exercise**: Select exercise, enter sets/reps/weight, calculate & save
4. **View History**: Check saved workout sessions

---

## API Functions Available

### Auth (`src/lib/auth.js`)
- `signUp(email, password)`
- `signIn(email, password)`
- `signOut()`
- `getCurrentUser()`
- `getSession()`

### Database (`src/lib/database.js`)
- `getExercises()` - Fetch all exercises
- `createWorkoutSession(userId, data)` - Create new session
- `logExercise(sessionId, data)` - Log exercise with calories
- `getWorkoutSessions(userId)` - Get user history
- `getUserProfile(userId)` - Get user profile
- `updateUserProfile(userId, updates)` - Update profile
- `logSteps(userId, data)` - Log daily steps
- `getUserStats(userId, startDate, endDate)` - Get aggregated stats

---

## Next Steps

1. **Populate exercises table** with your 79 exercises
2. **Test auth flow** (sign up → sign in → sign out)
3. **Log a workout** and verify it saves to database
4. **Build dashboard stats** pulling from `getUserStats()`
5. **Add step tracking** integration with mobile sensors

---

## Database Schema Overview

```
exercises
├── id (uuid, primary key)
├── name, body_part, difficulty, type
├── met, volume_coefficient, equipment
└── primary/secondary/tertiary muscles (jsonb)

profiles (auto-created on signup)
├── id (references auth.users)
├── body_weight_kg, height_cm, age, gender

workout_sessions
├── id, user_id, date, notes
└── exercise_logs[]
    ├── exercise_id, sets, reps, weight_kg
    ├── duration_minutes
    └── calories_time, calories_volume, total_calories

step_logs
├── user_id, date, steps
└── distance_km, calories, activity_type

routines
├── user_id, name, type, is_template
└── routine_exercises[]
```

---

Ready to go. Provide your exercises and start tracking.
