import { firestore } from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";

/**
 * Simple hash function to create a unique key for a string
 */
async function generateHash(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Checks if a response for the given prompt/parameters is already cached.
 * Catches all errors silently so missing Firestore permissions never block generation.
 */
export const getCachedResponse = async (type: string, params: any): Promise<any | null> => {
  try {
    const key = await generateHash(JSON.stringify({ type, ...params }));
    
    // Fast path: Check browser localStorage cache first
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem(`matementor_cache_${key}`);
        if (local) {
          const parsed = JSON.parse(local);
          return parsed.response;
        }
      } catch (e) {}
    }

    // Try reading from Firestore without throwing on permission errors
    try {
      const cacheRef = doc(firestore, "ai_cache", key);
      const snap = await getDoc(cacheRef);
      
      if (snap.exists()) {
        console.log(`Cache hit for ${type}:`, params);
        return snap.data().response;
      }
    } catch (firestoreError) {
      console.warn(`[ai_cache] Firestore getDoc permission bypassed:`, firestoreError);
    }
  } catch (error) {
    console.warn(`[ai_cache] getCachedResponse bypassed:`, error);
  }
  return null;
};

/**
 * Saves an AI response to the cache.
 * Catches all errors silently so missing Firestore write permissions never crash generation.
 */
export const saveToCache = async (type: string, params: any, response: any) => {
  try {
    const key = await generateHash(JSON.stringify({ type, ...params }));

    // Always persist to local cache for fast reload
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`matementor_cache_${key}`, JSON.stringify({
          type,
          params,
          response,
          timestamp: Date.now()
        }));
      } catch (e) {}
    }

    // Attempt to save to Firestore; catch error safely if unauthorized
    try {
      const cacheRef = doc(firestore, "ai_cache", key);
      await setDoc(cacheRef, {
        type,
        params,
        response,
        timestamp: serverTimestamp()
      });
    } catch (firestoreError) {
      console.warn(`[ai_cache] Firestore setDoc bypassed (no permission):`, firestoreError);
    }
  } catch (error) {
    console.warn(`[ai_cache] saveToCache bypassed:`, error);
  }
};
