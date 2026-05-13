/**
 * IStorageAdapter — Interface genérica para persistência.
 * Permite trocar entre localStorage e Firestore transparentemente.
 */

export interface IStorageAdapter<T extends { id: string }> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  add(item: T): Promise<void>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  set(id: string, item: T): Promise<void>; // upsert
  query(filterFn: (item: T) => boolean): Promise<T[]>;
}

export type StorageType = 'local' | 'firestore';
