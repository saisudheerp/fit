# Next Rep 💪

A modern fitness tracking app to help you build workout routines, track progress, and crush your personal records.

## Features

### 🤖 AI Coaches

**Sai - Beast Mode Coach**

- High-energy, disciplined coaching style
- Pushes you to beat your personal bests
- Knows all your workout data, PRs, and progress
- Helps create workout routines based on your goals
- Answers fitness questions with real talk

**Daisy - Supportive Coach**

- Warm, caring, and uplifting approach
- Tracks progress and celebrates your wins
- Builds balanced workout routines
- Keeps you consistent without pressure
- Gentle guidance for your fitness journey

### 🏋️ Workout Routines

- **4 Routine Types**: Push/Pull/Legs, Upper/Lower, Full Body, or Custom
- **Day-by-Day Structure**: Follow structured plans with automatic progression
- **Skip Days**: Missed a workout? Skip to the next day
- **Rest Day Tracking**: Shows when you need rest and your next workout
- **Routine Management**: Edit, duplicate, or delete routines anytime

### 📊 Dashboard

- **Weekly Overview**: Visual calendar showing this week's workout activity
- **Muscle Heatmap**: See which muscle groups you've trained recently
- **Active Program**: Displays your current routine and progress
- **Quick Stats**: Total workouts, streak count, and weekly summary
- **Recent Activity**: Last logged workouts and exercises

### 🏆 Personal Records (PRs)

- **Automatic Detection**: App tracks when you hit new personal records
- **Filter by Muscle**: View PRs by Chest, Back, Shoulders, Legs, Arms, Core
- **Progress History**: See all your strength gains over time
- **Search Function**: Find records for specific exercises
- **PR Badges**: Visual indicators for recent achievements

### 📝 Workout Logging

- **Exercise Database**: 100+ exercises organized by muscle group
- **Set Tracking**: Log weight, reps, and sets for each exercise
- **Rest Timer**: Built-in countdown timer between sets
- **Exercise History**: View past performance on any exercise
- **Custom Exercises**: Add your own exercises to the database
- **Notes**: Add form cues or equipment settings

### ⚙️ Settings

- **Profile**: Update name, body weight, and personal info
- **Unit Preference**: Switch between kg and lbs
- **Account Management**: Sign out option
- **Theme**: Dark mode interface (default)

### 📱 Responsive Design

- Works on mobile, tablet, and desktop
- Touch-optimized for gym use
- Clean, modern interface
- Fast navigation between pages

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Email + Google Sign-In)
- **AI**: Google Gemini API (gemini-1.5-flash)
- **Charts**: Recharts
- **Routing**: React Router
- **Hosting**: Vercel

## Getting Started

1. Clone the repository

```bash
git clone <your-repo-url>
cd fit
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase and Gemini API credentials

4. Run the development server

```bash
npm run dev
```

## Environment Variables

Create a `.env` file with:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Get API Keys:**

- Firebase: https://console.firebase.google.com/
- Gemini AI: https://aistudio.google.com/app/apikey

## Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Add your web app and copy the config
5. Set up Firestore security rules (see `firestore.rules`)

## Project Structure

```
src/
├── assets/          # Images and static files
├── components/      # Reusable components
├── contexts/        # React contexts (Auth, Toast)
├── lib/            # Firebase and Gemini API setup
├── pages/          # Main app pages
│   ├── Dashboard.jsx
│   ├── Coach.jsx
│   ├── PRs.jsx
│   ├── Routines.jsx
│   ├── Settings.jsx
│   ├── Landing.jsx
│   └── Log.jsx
├── App.jsx         # Main app component
└── main.jsx        # Entry point
```

## License

MIT
