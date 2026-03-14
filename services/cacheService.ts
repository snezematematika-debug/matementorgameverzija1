
import { firestore, handleFirestoreError, OperationType } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// ─── Константи ────────────────────────────────────────────────────────────────
const CACHE_TTL_DAYS      = 30;   // Firestore TTL
const LOCAL_TTL_DAYS      = 7;    // localStorage TTL (побрз refresh)
const LS_PREFIX           = 'mm_cache_';
const LS_MAX_ENTRIES      = 60;   // максимум записи во localStorage

// ─── Слој 1: In-memory (0ms, живее до refresh) ────────────────────────────────
const _memoryCache = new Map<string, any>();

// ─── Слој 2b: In-flight deduplication ─────────────────────────────────────────
// Ако истото барање е веќе во тек → врати ист Promise, не прави нов API повик
const _inFlight = new Map<string, Promise<any>>();

// ─── Hash helper ──────────────────────────────────────────────────────────────
async function generateHash(text: string): Promise<string> {
  // Нормализирај пред хеширање → "Множество" и " множество " = ист кеш
  const normalized = text.trim().toLowerCase();
  const msgUint8 = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Слој 2: localStorage helpers ─────────────────────────────────────────────
function lsGet(key: string): any | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const { response, timestamp } = JSON.parse(raw);
    const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    if (ageDays > LOCAL_TTL_DAYS) {
      localStorage.removeItem(LS_PREFIX + key);
      return null;
    }
    return response;
  } catch {
    return null;
  }
}

function lsSet(key: string, response: any): void {
  try {
    // Евиктирај стари записи ако е полно
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX));
    if (allKeys.length >= LS_MAX_ENTRIES) {
      // Избриши го најстариот
      let oldest = { key: '', ts: Infinity };
      allKeys.forEach(k => {
        try {
          const { timestamp } = JSON.parse(localStorage.getItem(k) || '{}');
          if (timestamp < oldest.ts) oldest = { key: k, ts: timestamp };
        } catch { /* skip */ }
      });
      if (oldest.key) localStorage.removeItem(oldest.key);
    }
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ response, timestamp: Date.now() }));
  } catch {
    // localStorage може да е полно (Safari private mode) — тивко игнорирај
  }
}

// ─── Главни функции ───────────────────────────────────────────────────────────

/**
 * Проверува ги сите кеш слоеви по ред: Memory → localStorage → Firestore
 */
export const getCachedResponse = async (type: string, params: any): Promise<any | null> => {
  const key = await generateHash(JSON.stringify({ type, ...params }));

  // Слој 1: Memory
  if (_memoryCache.has(key)) {
    console.log(`[Cache] Memory hit — ${type}`);
    return _memoryCache.get(key);
  }

  // Слој 2: localStorage
  const local = lsGet(key);
  if (local !== null) {
    console.log(`[Cache] localStorage hit — ${type}`);
    _memoryCache.set(key, local); // промовирај во memory
    return local;
  }

  // Слој 3: Firestore
  const path = `ai_cache/${key}`;
  try {
    const snap = await getDoc(doc(firestore, 'ai_cache', key));
    if (snap.exists()) {
      const data = snap.data();
      const timestamp = data.timestamp?.toDate?.();
      if (timestamp) {
        const ageDays = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > CACHE_TTL_DAYS) {
          console.log(`[Cache] Firestore expired (${Math.floor(ageDays)} дена) — ${type}`);
          return null;
        }
      }
      console.log(`[Cache] Firestore hit — ${type}`);
      // Промовирај надолу во побрзите слоеви
      _memoryCache.set(key, data.response);
      lsSet(key, data.response);
      return data.response;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  return null;
};

/**
 * Зачувува одговор во сите кеш слоеви истовремено
 */
export const saveToCache = async (type: string, params: any, response: any): Promise<void> => {
  const key = await generateHash(JSON.stringify({ type, ...params }));

  // Запиши во сите слоеви
  _memoryCache.set(key, response);
  lsSet(key, response);

  const path = `ai_cache/${key}`;
  try {
    await setDoc(doc(firestore, 'ai_cache', key), {
      type,
      params,
      response,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

/**
 * In-flight deduplication wrapper.
 * Ако истото барање е веќе во тек, врати го истиот Promise.
 * Спречува N наставници да предизвикаат N API повици за иста тема.
 */
export const deduplicatedFetch = async <T>(
  cacheKey: string,
  fetcher: () => Promise<T>
): Promise<T> => {
  if (_inFlight.has(cacheKey)) {
    console.log(`[Cache] In-flight dedup — ${cacheKey}`);
    return _inFlight.get(cacheKey) as Promise<T>;
  }
  const promise = fetcher().finally(() => _inFlight.delete(cacheKey));
  _inFlight.set(cacheKey, promise);
  return promise;
};
