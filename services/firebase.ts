import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore, getDocFromServer, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { useState, useEffect } from "react";

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'admin' | null;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAIL = 'snezematematika@gmail.com';

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    // Автоматска регистрација при прв login
    if (user.email !== ADMIN_EMAIL) {
      const userRef = doc(firestore, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || 'Наставник',
          photoURL: user.photoURL || null,
          status: 'pending',
          registeredAt: serverTimestamp(),
        });
      }
    }
    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        if (u.email === ADMIN_EMAIL) {
          setUserStatus('admin');
        } else {
          try {
            const snap = await getDoc(doc(firestore, 'users', u.uid));
            setUserStatus(snap.exists() ? (snap.data().status as UserStatus) : null);
          } catch {
            setUserStatus(null);
          }
        }
      } else {
        setUserStatus(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading, userStatus };
}

// --- Admin функции за управување со наставници ---

export interface PendingTeacher {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  registeredAt: Date | null;
}

export const getPendingTeachers = async (): Promise<PendingTeacher[]> => {
  const q = query(collection(firestore, 'users'), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    uid: d.id,
    email: d.data().email,
    displayName: d.data().displayName,
    photoURL: d.data().photoURL || null,
    registeredAt: d.data().registeredAt?.toDate?.() || null,
  }));
};

export const approveTeacher = async (uid: string) => {
  await updateDoc(doc(firestore, 'users', uid), {
    status: 'approved',
    role: 'teacher',
    approvedAt: serverTimestamp(),
  });
};

export const rejectTeacher = async (uid: string) => {
  await updateDoc(doc(firestore, 'users', uid), {
    status: 'rejected',
  });
};

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

export async function testConnection() {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Analytics is only supported in certain environments
export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : Promise.resolve(null);
