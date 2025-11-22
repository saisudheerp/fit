# FIT - Fitness Tracker

A modern, feature-rich fitness tracking application built with React, Firebase, and Vite. Track your workouts, monitor progress, and achieve your fitness goals with an intuitive interface.

## 🚀 Features

### 📊 Dashboard
- **User Statistics**: Quick view of total workouts, exercises logged, and active routines
- **Weekly Overview**: Visual bar chart showing workout activity and calories burned for the past 7 days (Monday to Sunday)
- **Workout in Progress**: Resume ongoing workouts with real-time progress tracking and completion percentage
- **Recent Activity**: View your latest exercise logs with detailed stats

### 💪 Workout Routines
- **Predefined Routines**: Choose from pre-built workout plans (Upper Body, Lower Body, Full Body, Core & Abs)
- **Custom Routines**: Create and save your own personalized workout routines
- **Active Workout Tracking**: 
  - Exercise-by-exercise guidance
  - Set and rep tracking
  - Rest timer between sets
  - Weight and reps adjustment controls
  - Real-time progress saving
- **Resume Workouts**: Continue from where you left off
- **Completed Today**: View routines completed on the current day
- **Auto Cleanup**: Automatically clears old workout progress at midnight

### 📝 Exercise Log
- **Quick Logging**: Manually log individual exercises
- **Detailed Stats**: Track exercise name, sets, reps, weight, and calories burned
- **Date Selection**: Log exercises for any date
- **Real-time Updates**: Instant sync with Firebase

### 📅 History
- **Complete Workout History**: View all your past workout sessions
- **Detailed Session Info**: See routine name, date, duration, and exercises performed
- **Exercise Breakdown**: Expand sessions to view all exercises with sets, reps, and weight
- **Chronological View**: Sorted by most recent workouts
- **Empty State**: Helpful prompts when no history exists

### ⚙️ Settings
- **Profile Management**: Update display name and profile picture
- **BMI Calculator**: 
  - Calculate Body Mass Index
  - Color-coded health categories (Underweight, Normal, Overweight, Obese)
  - Personalized health recommendations
- **User Stats**: View account creation date and user ID
- **Sign Out**: Secure logout functionality

### 🔐 Authentication
- **Email/Password Sign In**: Secure login system
- **New User Registration**: Easy account creation
- **Profile Setup**: Set up profile after registration (name, age, weight, height, gender)
- **Firebase Integration**: Secure authentication with Firebase Auth

## 🛠️ Technology Stack

- **Frontend**: React 19.2.0
- **Routing**: React Router DOM 7.9.6
- **Backend**: Firebase 12.6.0 (Firestore, Authentication)
- **Styling**: Tailwind CSS 4.1.17 + Custom CSS
- **Icons**: Google Material Icons
- **Build Tool**: Vite 7.2.4
- **Linting**: ESLint 9.39.1

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fit
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy your Firebase config to `src/lib/firebase-config.js`

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## 🗄️ Database Structure

### Collections:
- **users**: User profiles (name, age, weight, height, gender, BMI)
- **routines**: Custom workout routines
- **workout_progress**: Active workout sessions in progress
- **workout_sessions**: Completed workout history
- **exercise_logs**: Individual exercise logs

## 📱 Responsive Design

Fully responsive across all devices:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## ✨ Key Highlights

- **Real-time Sync**: All data syncs instantly with Firebase
- **Auto-save**: Workout progress automatically saved
- **Progressive Enhancement**: Works offline with cached data
- **Material Design**: Clean, modern UI with Google Material Icons
- **Dark Theme**: Eye-friendly dark mode interface
- **Smart Calculations**: Automatic calorie estimation based on exercise intensity
- **Weekly Analytics**: Track your consistency with weekly stats

## 🎯 Future Enhancements

- Exercise database with detailed instructions
- Progress photos and measurements tracking
- Workout templates and community sharing
- Advanced analytics and insights
- Nutrition tracking
- Goal setting and achievements

## 📄 License

This project is private and not licensed for public use.

## 🤝 Contributing

This is a private project. Contact the repository owner for contribution guidelines.