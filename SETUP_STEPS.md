# FitTrack Setup Guide

## ⚠️ IMPORTANT: Complete These Steps Before Using the App

Your app is currently stuck on "Loading..." because the Supabase database hasn't been initialized yet. Follow these steps:

---

## Step 1: Run the SQL Schema in Supabase ⚡

1. **Open Supabase Dashboard**

   - Go to: https://supabase.com/dashboard
   - Select your project: `czfbrgywwngszjzgjyib`

2. **Open SQL Editor**

   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Schema**

   - Open `supabase-schema.sql` from your project
   - Copy the **ENTIRE FILE** (all 361 lines)
   - Paste into the SQL Editor
   - Click **"Run"** button

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check "Table Editor" → You should see 7 tables:
     - ✅ exercises (with 79 exercises)
     - ✅ profiles
     - ✅ workout_sessions
     - ✅ exercise_logs
     - ✅ step_logs
     - ✅ routines
     - ✅ routine_exercises

---

## Step 2: Enable Email Authentication 📧

1. **Go to Authentication Settings**

   - Dashboard → Authentication → Providers

2. **Enable Email Provider**
   - Toggle "Email" to ON
   - (Optional) Disable "Confirm email" for testing
   - Click "Save"

---

## Step 3: Test Your App 🚀

1. **Refresh your browser** (http://localhost:5174)

2. **Sign Up**

   - You should now see the Auth page (not stuck on loading)
   - Create an account with email/password

3. **Complete Profile**

   - Go to Settings
   - Add your name, weight, height, etc.
   - Click "Save Settings"

4. **Check Dashboard**

   - Return to Dashboard
   - See "WELCOME, [YOUR NAME]"

5. **Log an Exercise**
   - Go to "Log Exercise"
   - Select an exercise
   - Enter sets, reps, weight
   - Calculate calories
   - Save to history

---

## Troubleshooting 🔧

### Still Stuck on "Loading..."?

**Check Browser Console (F12):**

- Look for errors mentioning Supabase
- Common issues:
  - ❌ "relation 'profiles' does not exist" → Run SQL schema
  - ❌ "Invalid API key" → Check `.env` file
  - ❌ "User not authenticated" → This is OK, you'll see auth page

### Can't Sign Up?

- Make sure Email provider is enabled in Supabase
- Check Console for auth errors
- Verify `.env` has correct Supabase URL and key

### No Exercises Showing?

- Verify SQL schema ran successfully
- Check Table Editor → `exercises` table should have 79 rows
- Check Console for database errors

---

## Quick Verification Checklist ✅

Before using the app, confirm:

- [ ] Supabase SQL schema has been run
- [ ] 7 tables exist in Table Editor
- [ ] 79 exercises are in `exercises` table
- [ ] Email authentication is enabled
- [ ] `.env` file has correct credentials
- [ ] App is running at http://localhost:5174
- [ ] No errors in browser console (F12)

---

## Your Supabase Credentials

**Project URL:** https://czfbrgywwngszjzgjyib.supabase.co  
**Schema File:** `supabase-schema.sql`  
**Environment File:** `.env`

---

## Need Help?

1. Open browser console (F12)
2. Copy any error messages
3. Check if tables exist in Supabase Table Editor
4. Verify authentication is enabled

**Most common fix:** Just run the SQL schema! 99% of "stuck loading" issues are from missing database tables.
