import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Vite exposes environment variables as import.meta.env.*
// Create a .env file in the project root with:
// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// VITE_FIREBASE_PROJECT_ID=...
// VITE_FIREBASE_STORAGE_BUCKET=...
// VITE_FIREBASE_MESSAGING_SENDER_ID=...
// VITE_FIREBASE_APP_ID=...

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  // Fail fast (avoids confusing auth errors later)
  throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

