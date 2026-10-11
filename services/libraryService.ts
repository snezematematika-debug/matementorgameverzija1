import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from './firebase';

export interface LibraryItemData {
  title: string;
  content: string;
  type: string;
  userId: string;
  grade: string | number;
}

export const saveToLibrary = async (data: LibraryItemData) => {
  // Always update local storage first so the item is instantly accessible
  try {
    const localKey = 'matementor_local_library';
    const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
    const localItem = {
      id: 'item_' + Date.now(),
      ...data,
      createdAt: { seconds: Math.floor(Date.now() / 1000) }
    };
    existing.unshift(localItem);
    localStorage.setItem(localKey, JSON.stringify(existing));
  } catch (e) {
    console.warn('Could not save to local storage cache:', e);
  }

  try {
    const docRef = await addDoc(collection(firestore, 'library'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.warn('Firestore save failed, saved to local cache:', error);
    return 'local_' + Date.now();
  }
};
