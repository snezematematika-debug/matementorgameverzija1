import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // Проверуваме со и без VITE_ префикс за да нема грешка
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || import.meta.env.FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID
};

// Иницијализација
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
