/**
 * FirestoreAdapter — Implementação Firestore do IStorageAdapter.
 * Usa Firebase Client SDK para persistir dados na nuvem.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  type Firestore,
} from 'firebase/firestore';
import type { IStorageAdapter } from './storage-adapter';

export class FirestoreAdapter<T extends { id: string }> implements IStorageAdapter<T> {
  constructor(
    private db: Firestore,
    private collectionName: string,
    private userId: string,
  ) {}

  private get collRef() {
    return collection(this.db, this.collectionName);
  }

  private docRef(id: string) {
    return doc(this.db, this.collectionName, id);
  }

  async getAll(): Promise<T[]> {
    try {
      const q = query(this.collRef, where('userId', '==', this.userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    } catch (error) {
      console.error(`[FirestoreAdapter] getAll error (${this.collectionName}):`, error);
      return [];
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const snap = await getDoc(this.docRef(id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`[FirestoreAdapter] getById error:`, error);
      return null;
    }
  }

  async add(item: T): Promise<void> {
    try {
      await setDoc(this.docRef(item.id), { ...item, userId: this.userId });
    } catch (error) {
      console.error(`[FirestoreAdapter] add error:`, error);
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      await updateDoc(this.docRef(id), data as Record<string, unknown>);
    } catch (error) {
      console.error(`[FirestoreAdapter] update error:`, error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(this.docRef(id));
    } catch (error) {
      console.error(`[FirestoreAdapter] delete error:`, error);
    }
  }

  async set(id: string, item: T): Promise<void> {
    await this.add(item);
  }

  async query(filterFn: (item: T) => boolean): Promise<T[]> {
    const all = await this.getAll();
    return all.filter(filterFn);
  }
}
