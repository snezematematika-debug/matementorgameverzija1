import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore, getDocFromServer, doc } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState, useEffect } from "react";

// Direct Firebase configuration from firebase-applet-config.json
export const firebaseConfig = {
  apiKey: "AIzaSyAtXI1kYErR34Cnv9MnxhW6XCobD5dCous",
  authDomain: "matementorgameverzija1.firebaseapp.com",
  databaseURL: "https://matementorgameverzija1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "matementorgameverzija1",
  storageBucket: "matementorgameverzija1.firebasestorage.app",
  messagingSenderId: "544726317445",
  appId: "1:544726317445:web:59976435497c6b511c6cec",
  measurementId: "G-7311KEZ9HK"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    return result.user;
  } catch (error) {
    console.error("Error registering with email", error);
    throw error;
  }
};

const DEMO_USER_KEY = 'matementor_demo_user';

export const getDemoUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(DEMO_USER_KEY) || localStorage.getItem(DEMO_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

export const loginAsDemoUser = (name = "Снежана Златковска", email = "snezematematika@gmail.com", role: 'TEACHER' | 'STUDENT' = 'TEACHER') => {
  const demoUser = {
    uid: "demo-teacher-uid",
    displayName: name,
    email: email,
    emailVerified: true,
    isAnonymous: false,
    photoURL: null,
    providerData: [],
  } as unknown as User;

  try {
    sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    sessionStorage.setItem('matementor_role', role);
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: demoUser }));
  return demoUser;
};

export const logout = async () => {
  try {
    sessionStorage.removeItem(DEMO_USER_KEY);
    localStorage.removeItem(DEMO_USER_KEY);
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: null }));
  try {
    await signOut(auth);
  } catch (e) {
    // ignore
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getDemoUser() || auth.currentUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentDemo = getDemoUser();
    if (currentDemo) {
      setUser(currentDemo);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const activeDemo = getDemoUser();
      if (!activeDemo) {
        setUser(firebaseUser);
      }
      setLoading(false);
    });

    const handleCustomAuth = (e: Event) => {
      const customUser = (e as CustomEvent).detail;
      setUser(customUser);
      setLoading(false);
    };

    window.addEventListener('auth-state-changed', handleCustomAuth);

    return () => {
      unsubscribe();
      window.removeEventListener('auth-state-changed', handleCustomAuth);
    };
  }, []);

  return { user, loading };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

// Analytics is only supported in certain environments
export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : Promise.resolve(null);
