import type { InventoryItem } from '@/lib/types';
import { getFirebaseDb } from './firebase';

const COLLECTION_NAME = 'equipment';

export async function getInventoryItemsFromDB(): Promise<InventoryItem[]> {
  const db = await getFirebaseDb();
  if (!db) {
    console.warn('Firestore not configured. Returning empty inventory.');
    return [];
  }

  try {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    if (snapshot.empty) {
      return [];
    }
    // The data is flat in Firestore, so we need to shape it into the nested
    // InventoryItem structure.
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        category: data.category,
        quantity: data.quantity || {},
        condition: data.condition || {},
      } as InventoryItem;
    });
  } catch (error) {
    console.warn('Firestore read error', error);
    return [];
  }
}

export async function createInventoryItemInDB(row: any): Promise<boolean> {
  const db = await getFirebaseDb();
  if (!db) return false;
  try {
    await db.collection(COLLECTION_NAME).add(row);
    return true;
  } catch (error) {
    console.warn('Firestore insert error', error);
    return false;
  }
}

export async function updateInventoryItemInDB(id: string, updates: Partial<InventoryItem>): Promise<{ ok: boolean; error?: any }> {
  const db = await getFirebaseDb();
  if (!db) return { ok: false, error: { message: 'no_firestore_client' } };
  if (!id) {
    return { ok: false, error: { message: 'no_id_provided' } };
  }

  try {
    const docRef = db.collection(COLLECTION_NAME).doc(id);
    await docRef.update(updates);
    return { ok: true };
  } catch (error) {
    console.warn('Firestore update error', error);
    return { ok: false, error };
  }
}
