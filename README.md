# ArchRevenue

ArchRevenue is a modern, AI-powered B2B revenue intelligence platform designed to secure, score, and manage leads autonomously through secure backend processing.

---

## Features

- **Automated Lead Scoring**: Analyzes self-reported and enriched data to rank leads.
- **Company Intelligence**: Fetches live website context to detect growth and hiring signals.
- **Revenue Strategy Engine**: AI Deal Coach generates custom outreach and tactical recommendations.
- **Secure by Design**: All AI and sensitive processes run within a secure server environment, with no exposed API keys.

---

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Firebase Cloud Functions (Node.js)
- **Database**: Firestore
- **Authentication**: Firebase Auth
- **AI**: Groq API (Llama 3)
- **Analytics**: PostHog
- **Deployment**: Vercel (Frontend), Firebase (Backend/Database)

---

## Architecture

Frontend
↓
Secure API Layer (Firebase Cloud Functions)
↓
AI Services (Groq)
↓
Firestore Database

---

## Local Development

Installation:
```bash
npm install
cd functions && npm install
```

Start the local development server:
```bash
npm run dev
```

---

## Environment Variables

Public variables (frontend):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_SENTRY_DSN`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_STRIPE_PUBLIC_KEY`

Private variables (backend only):
- `GROQ_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

> **Note:** Never commit actual values to version control. Use the `.env.example` as a template.

---

## Build

Compile the frontend production bundle:
```bash
npm run build
```

Compile the backend Cloud Functions:
```bash
cd functions
npm run build
```

---

## Deployment

- **Vercel**: Deploy the root directory for the React frontend.
- **Firebase**: Deploy the backend and database rules via `firebase deploy --only functions,firestore:rules,hosting`.

---

## Security

- **RBAC**: Strict Firestore rules ensure users can only read/write their own leads.
- **Firestore Rules**: Global data like the `companies` collection is read-only for clients. Token usage updates are blocked from the client.
- **Secure API Layer**: All AI-related operations flow through Firebase Cloud Functions.
- **No exposed AI keys**: The `GROQ_API_KEY` is exclusively managed on the backend, completely preventing token theft via client DevTools.
- **Hardened Build**: Content Security Policy and strict headers are enforced in `firebase.json`.

---

## License

All rights reserved. ArchRevenue.
