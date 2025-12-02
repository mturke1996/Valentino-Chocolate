import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestore<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        
        setData(documents);
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, ...constraints]);

  return { data, loading, error };
}

export async function getFirestoreData<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

