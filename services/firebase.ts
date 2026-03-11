import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "placeholder",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "placeholder",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "placeholder"
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Firebase initialization failed:", e);
  app = null;
}

export const db = app ? getDatabase(app) : null;
export const firestore = app ? getFirestore(app) : null;

// Analytics is only supported in certain environments
export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : Promise.resolve(null);
