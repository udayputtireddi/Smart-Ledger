# Smart Ledger 🤖💰

A modern, AI-powered personal finance tracker that automatically categorizes your transactions using Google Gemini and syncs your data securely to the cloud with Firebase.

![Smart Ledger Banner](https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000)

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
    firebase deploy --only hosting
    ```

## 📱 iOS Installation (PWA)

1.  Open the deployed website in **Safari**.
2.  Tap the **Share** button (Square with arrow up).
3.  Scroll down and tap **"Add to Home Screen"**.


## Firestore security and validation

Only a signed-in owner can access `users/{uid}/transactions/{id}`. Other paths
are denied. See [firestore.rules](firestore.rules) and the
[security validation report](docs/firestore-security-audit.md) for compatibility,
limitations and release gates.

Use Node.js 22 and Java 21 for the security tests:

```bash
npm ci
npm run test:unit
npm run typecheck
npm run build
npm ci --prefix tests --ignore-scripts --no-audit --no-fund
npm run test:rules
```

The rules suite requires `127.0.0.1:8080` and uses only `demo-smart-ledger`.
Do not change the test project to the live `.firebaserc` project. Test tooling is
isolated in `tests/package.json`; direct versions are pinned and transitive versions
are recorded in `tests/package-lock.json`, resolved by GitHub Actions. The application
lockfile is unchanged.

[CI](.github/workflows/security.yml) runs checks only; it has no deployment step
or Firebase credentials. No production rules have been inspected or deployed by
this change. Do not run bare `firebase deploy`: it now includes Firestore rules.
Rules deployment requires separate explicit approval after comparing the deployed
rules, confirming the project/database and reviewing any legacy schema conflicts.

Status: proposed security hardening; 47 emulator tests, 15 client tests, typecheck
and build passed in CI. See the report for evidence and remaining release gates. Restore is
explicitly disabled to prevent delete-before-import data loss; export remains
available. Next security priority: move Gemini credentials and requests behind an
authenticated, rate-limited backend. See the report for follow-up details.
