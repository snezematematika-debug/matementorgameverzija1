
import { firestore, analytics } from "./firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  increment, 
  getDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from "firebase/firestore";
import { logEvent } from "firebase/analytics";

export interface GenerationMetadata {
  contentType: string;
  topic: string;
  grade: string;
  tokens?: number;
  model?: string;
  userId?: string;
}

/**
 * Tracks AI content generation metadata in Firestore.
 */
export const trackGeneration = async (metadata: GenerationMetadata) => {
  try {
    await addDoc(collection(firestore, "generations"), {
      ...metadata,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error tracking generation:", error);
  }
};

/**
 * Logs a custom event to Firebase Analytics.
 */
export const trackEvent = async (eventName: string, params?: Record<string, any>) => {
  try {
    const analyticsInstance = await analytics;
    if (analyticsInstance) {
      logEvent(analyticsInstance, eventName, params);
    }
  } catch (error) {
    console.error("Error logging event:", error);
  }
};

/**
 * Increments the daily AI quota counter in Firestore.
 */
export const incrementDailyQuota = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const quotaRef = doc(firestore, "quotas", today);
    
    await setDoc(quotaRef, {
      count: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error incrementing quota:", error);
  }
};

/**
 * Retrieves the current day's AI usage count.
 */
export const getDailyUsage = async (): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const quotaRef = doc(firestore, "quotas", today);
    const snap = await getDoc(quotaRef);
    
    if (snap.exists()) {
      return snap.data().count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error getting usage:", error);
    return 0;
  }
};

/**
 * Fetches recent generations for the dashboard.
 */
export const getRecentGenerations = async (count: number = 10) => {
  try {
    const q = query(
      collection(firestore, "generations"),
      orderBy("timestamp", "desc"),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching generations:", error);
    return [];
  }
};

/**
 * Fetches daily quotas for the last 7 days.
 */
export const getWeeklyQuotas = async () => {
  try {
    const q = query(
      collection(firestore, "quotas"),
      orderBy("__name__", "desc"),
      limit(7)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ date: d.id, count: d.data().count })).reverse();
  } catch (error) {
    console.error("Error fetching weekly quotas:", error);
    return [];
  }
};
