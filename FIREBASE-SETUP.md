# Firebase Setup Guide for FitTrack

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `fittrack` (or your choice)
4. Disable Google Analytics (optional, but simpler)
5. Click "Create project"

## Step 2: Register Web App

1. In your Firebase project, click the **Web icon** (`</>`) to add a web app
2. App nickname: `FitTrack Web`
3. **DO NOT** check "Firebase Hosting" (we're using Vite)
4. Click "Register app"
5. **Copy the firebaseConfig** object values

## Step 3: Update .env File

Replace the values in `d:\Github\fit\.env` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

## Step 4: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click "Email/Password" under Sign-in providers
4. Enable "Email/Password" (leave Email link disabled)
5. Click "Save"

## Step 5: Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose "Start in **production mode**" (we'll add rules next)
4. Select a Cloud Firestore location (choose closest to you)
5. Click "Enable"

## Step 6: Set Firestore Security Rules

Click on the "Rules" tab and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Profiles: users can only read/write their own
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Exercises: public read access (static data)
    match /exercises/{exerciseId} {
      allow read: if true;
      allow write: if false; // Only admins via Firebase Console
    }
    
    // Exercise logs: users can only access their own
    match /exercise_logs/{logId} {
      allow read, write: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
    }
    
    // Workout sessions: users can only access their own
    match /workout_sessions/{sessionId} {
      allow read, write: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
    }
    
    // Step logs: users can only access their own
    match /step_logs/{logId} {
      allow read, write: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
    }
    
    // Routines: users can only access their own
    match /routines/{routineId} {
      allow read, write: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
    }
  }
}
```

Click "Publish"

## Step 7: Seed Exercise Data

Go to **Build** → **Firestore Database** → **Data** tab

I'll provide a script to seed the exercises. For now, you can manually add one exercise to test:

Collection: `exercises`
Document ID: Auto-ID
Fields:
- name: "Barbell Bench Press"
- category: "chest"
- muscles: (map)
  - primary: (array) ["pectoralis major"]
  - secondary: (array) ["anterior deltoid", "triceps"]
- met_value: 6.0
- volume_coefficient: 0.0012

## Step 8: Test the App

1. Save your `.env` file with Firebase credentials
2. Restart the dev server: `npm run dev`
3. Open http://localhost:5174
4. Sign up with a new account (no email verification needed!)
5. Should go straight to Dashboard

## Done!

Firebase is much simpler than Supabase:
- ✅ No RLS policy headaches
- ✅ No email verification by default
- ✅ Easier security rules
- ✅ Better real-time updates
- ✅ Free tier is generous

Need help? Check the console for any errors.
