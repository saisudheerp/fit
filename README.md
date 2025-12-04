# FitTrack 💪

A fitness tracking app to help you build and follow workout routines, track your progress, and hit your personal records.

## Features

### 🤖 AI Coach - Sai

- **Personal AI Assistant**: Meet Sai, your AI fitness coach who knows all your workout data
- **Personalized Insights**: Get advice based on YOUR actual workout history and PRs
- **Workout Analysis**: Ask about your training patterns, muscle balance, and progress
- **Smart Suggestions**: Receive tips tailored to your fitness level and goals
- **Chat Interface**: Natural conversation - just ask Sai anything about your fitness

### 🏋️ Workout Routines

- **4 Types of Routines**: Choose from Push/Pull/Legs, Upper/Lower, Full Body, or Custom routines
- **Day-by-Day Progression**: Follow structured workout plans that progress automatically
- **Skip Day Option**: Missed a workout? Skip to the next day without losing progress
- **Rest Day Tracking**: The app knows when you need rest and shows your next workout day

### 📊 Dashboard

- **Weekly Overview**: See your workout activity for the current week at a glance
- **Muscle Heatmap**: Visual display of which muscles you've trained most
- **Active Program Display**: Always know what routine you're currently following
- **Quick Stats**: View your workout streak, total workouts, and more

### 🏆 Personal Records

- **Automatic PR Detection**: The app tracks when you hit new personal records
- **PR Categories**: Filter PRs by Chest, Back, Shoulders, Legs, Arms, and Core
- **Progress Charts**: See your strength gains over time with visual charts
- **Search PRs**: Quickly find records for specific exercises

### 📝 Exercise Logging

- **Set Tracking**: Log weight, reps, and sets for each exercise
- **Rest Timer**: Built-in timer between sets
- **Exercise History**: View your past performance on any exercise
- **Notes**: Add notes to remember form cues or equipment settings

### ⚙️ Settings

- **Profile Management**: Update your name and body weight
- **Unit Preferences**: Switch between kg and lbs
- **Data Export**: Export your workout data
- **Account Management**: Sign out or manage your account

### 📱 Mobile Friendly

- **Responsive Design**: Works great on phones, tablets, and desktops
- **Touch Optimized**: Easy to use during workouts with large tap targets
- **Quick Actions**: Swipe and tap gestures for fast logging

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS + Custom CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Email + Google Sign-In)
- **AI**: Firebase AI (Gemini 2.0 Flash via Google AI backend)
- **Charts**: Recharts
- **Hosting**: Vercel

## Getting Started

1. Clone the repo
2. Run `npm install`
3. Create a Firebase project and add your config to `.env`
4. Enable the AI in your Firebase project (Firebase console > Build > AI)
5. Run `npm run dev`

## Environment Variables

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## License

MIT
