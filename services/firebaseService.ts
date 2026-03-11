import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { firestore } from "./firebase";

/**
 * Service for handling Firestore operations related to content caching and storage.
 */

// Collection names
const COLLECTIONS = {
  LESSON_PACKAGES: "lesson_packages",
  PROBLEM_BANKS: "problem_banks",
  EXPLANATIONS: "explanations"
};

/**
 * Retrieves a cached lesson package from Firestore.
 */
export const getCachedLessonPackage = async (grade: string, topic: string, lessonTitle: string) => {
  try {
    const docId = `${grade}_${topic}_${lessonTitle}`.replace(/\s+/g, '_').toLowerCase();
    const docRef = doc(firestore, COLLECTIONS.LESSON_PACKAGES, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching cached lesson package:", error);
    return null;
  }
};

/**
 * Saves a generated lesson package to Firestore.
 */
export const saveLessonPackage = async (grade: string, topic: string, lessonTitle: string, data: any) => {
  try {
    const docId = `${grade}_${topic}_${lessonTitle}`.replace(/\s+/g, '_').toLowerCase();
    const docRef = doc(firestore, COLLECTIONS.LESSON_PACKAGES, docId);
    
    await setDoc(docRef, {
      ...data,
      grade,
      topic,
      lessonTitle,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error saving lesson package:", error);
    return false;
  }
};

/**
 * Retrieves a problem bank for a specific topic and grade.
 */
export const getProblemBank = async (grade: string, topic: string) => {
  try {
    const docId = `${grade}_${topic}`.replace(/\s+/g, '_').toLowerCase();
    const docRef = doc(firestore, COLLECTIONS.PROBLEM_BANKS, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().problems || [];
    }
    return null;
  } catch (error) {
    console.error("Error fetching problem bank:", error);
    return null;
  }
};

/**
 * Saves a batch of problems to a problem bank.
 */
export const saveProblemBank = async (grade: string, topic: string, problems: any[]) => {
  try {
    const docId = `${grade}_${topic}`.replace(/\s+/g, '_').toLowerCase();
    const docRef = doc(firestore, COLLECTIONS.PROBLEM_BANKS, docId);
    
    await setDoc(docRef, {
      problems,
      grade,
      topic,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error saving problem bank:", error);
    return false;
  }
};

/**
 * Caches an explanation for a specific problem.
 */
export const cacheExplanation = async (problemId: string, explanation: string) => {
  try {
    const docRef = doc(firestore, COLLECTIONS.EXPLANATIONS, problemId);
    await setDoc(docRef, {
      explanation,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error caching explanation:", error);
    return false;
  }
};

/**
 * Retrieves a cached explanation.
 */
export const getCachedExplanation = async (problemId: string) => {
  try {
    const docRef = doc(firestore, COLLECTIONS.EXPLANATIONS, problemId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().explanation;
    }
    return null;
  } catch (error) {
    console.error("Error fetching cached explanation:", error);
    return null;
  }
};
