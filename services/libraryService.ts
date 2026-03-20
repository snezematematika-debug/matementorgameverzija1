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
  try {
    const docRef = await addDoc(collection(firestore, 'library'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving to library:', error);
    throw error;
  }
};
