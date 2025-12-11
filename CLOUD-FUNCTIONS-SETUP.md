# Firebase Cloud Functions Setup

## Steps to Deploy Secure Gemini Integration

Your Gemini API key was leaked because it was in the `.env` file that got committed to GitHub. We've now set up Firebase Cloud Functions to securely store and use the API key on the server side.

### 1. Generate a New Gemini API Key

Go to: https://aistudio.google.com/app/apikey

1. Click "Create API key"
2. Select your project or create a new one
3. Copy the new API key (keep it safe!)

### 2. Install Firebase CLI (if not installed)

```powershell
npm install -g firebase-tools
```

### 3. Login to Firebase

```powershell
firebase login
```

### 4. Install Cloud Functions Dependencies

```powershell
cd functions
npm install
cd ..
```

### 5. Set the Gemini API Key as a Secret

```powershell
firebase functions:secrets:set GEMINI_API_KEY
```

When prompted, paste your NEW Gemini API key.

### 6. Deploy Cloud Functions

```powershell
firebase deploy --only functions
```

### 7. Update Your .env File

Remove `VITE_GEMINI_API_KEY` from your `.env` file - it's no longer needed!

Your `.env` should only contain Firebase config:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## How It Works Now

1. Frontend calls `generateGeminiResponse()` (Firebase callable function)
2. Firebase verifies the user is authenticated
3. Cloud Function retrieves the secret Gemini API key
4. Cloud Function calls Gemini API
5. Response is returned to the frontend

**Benefits:**

- ✅ API key never exposed to frontend/browser
- ✅ Only authenticated users can use AI features
- ✅ API key stored securely in Firebase Secrets
- ✅ Rate limiting and quotas handled by Firebase

## Troubleshooting

### "Permission denied" when deploying

Make sure you're logged in and have the right project selected:

```powershell
firebase login
firebase use fitness-150ca
```

### "GEMINI_API_KEY is not set"

Run the secrets command again:

```powershell
firebase functions:secrets:set GEMINI_API_KEY
```

### Testing Locally

```powershell
cd functions
npm run serve
```

Note: For local testing, you'll need to access the secret value or use a `.secret.local` file.
