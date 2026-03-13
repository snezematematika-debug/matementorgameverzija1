
import { firestore, handleFirestoreError, OperationType } from "./firebase";
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

const CACHE_TTL_DAYS = 30;

/**
 * Checks if a response for the given prompt/parameters is already cached.
 * Returns null if the cache entry is older than CACHE_TTL_DAYS days.
 */
export const getCachedResponse = async (type: string, params: any): Promise<any | null> => {
  const key = await generateHash(JSON.stringify({ type, ...params }));
  const path = `ai_cache/${key}`;
  try {
    const cacheRef = doc(firestore, "ai_cache", key);
    const snap = await getDoc(cacheRef);

    if (snap.exists()) {
      const data = snap.data();
      const timestamp = data.timestamp?.toDate?.();
      if (timestamp) {
        const ageMs = Date.now() - timestamp.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays > CACHE_TTL_DAYS) {
          console.log(`Cache expired (${Math.floor(ageDays)} days old) for ${type}:`, params);
          return null;
        }
      }
      console.log(`Cache hit for ${type}:`, params);
      return data.response;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

/**
 * Saves an AI response to the cache.
 */
export const saveToCache = async (type: string, params: any, response: any) => {
  const key = await generateHash(JSON.stringify({ type, ...params }));
  const path = `ai_cache/${key}`;
  try {
    const cacheRef = doc(firestore, "ai_cache", key);
    
    await setDoc(cacheRef, {
      type,
      params,
      response,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
