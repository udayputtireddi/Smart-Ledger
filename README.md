# Smart Ledger 🤖💰

A modern, AI-powered personal finance tracker that automatically categorizes your transactions using Google Gemini and syncs your data securely to the cloud with Firebase.

![Smart Ledger Banner](https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000)

## ✨ Features

- **AI Auto-Categorization**: Simply enter "Starbucks" or "Uber", and Gemini AI automatically categorizes it as "Food & Drink" or "Transport".
- **Cloud Sync (Firebase)**: Your data is stored in Firestore, accessible from any device.
- **Visual Analytics**: Beautiful monthly summaries, daily trend charts, and spending breakdown pie charts.
- **PWA Ready**: Installable on iOS and Android as a native-like app.
- **Secure Authentication**: Email/Password login via Firebase Auth.
- **Data Backup**: Export your ledger to JSON or restore from backup.
- **Mobile First Design**: Fully responsive UI tailored for mobile usage.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Backend/DB**: Firebase (Firestore, Authentication, Hosting)
- **AI**: Google Gemini API (`@google/genai`)
- **Charts**: Recharts

## 🚀 Getting Started

### Prerequisites

1.  **Node.js**: Install from [nodejs.org](https://nodejs.org).
2.  **Firebase Account**: Create a project at [console.firebase.google.com](https://console.firebase.google.com).
3.  **Gemini API Key**: Get one at [aistudio.google.com](https://aistudio.google.com).

### Installation

1.  **Clone the repository** (or download files):
    ```bash
    git clone <your-repo-url>
    cd smart-ledger
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory:
    ```env
    VITE_API_KEY=<Your_Gemini_Key>
    
    # You can also add your firebase config here if you prefer, 
    # but the project is set up to use the 'firebase.ts' hardcoded keys 
    # or you can update firebase.ts to use env vars:
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    # ...etc
    ```

4.  **Firebase Setup**:
    - Enable **Authentication** (Email/Password) in Firebase Console.
    - Enable **Firestore Database** (Start in Production mode).
    - Create a file `firebase.ts` (if not present) and fill in your config keys from Project Settings.


## 📦 Deployment (Firebase Hosting)

1.  **Install Firebase CLI**:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login**:
    ```bash
    firebase login
    ```

3.  **Initialize (if needed)**:
    ```bash
    firebase init hosting
    # Select your project
    # Public directory: dist
    # Configure as single-page app: Yes
    ```

4.  **Build & Deploy**:
    ```bash
    npm run build
    firebase deploy
    ```

## 📱 iOS Installation (PWA)

1.  Open the deployed website in **Safari**.
2.  Tap the **Share** button (Square with arrow up).
3.  Scroll down and tap **"Add to Home Screen"**.

