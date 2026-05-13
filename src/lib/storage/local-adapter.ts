/**
 * LocalAdapter — Implementação localStorage do IStorageAdapter.
 * Mantém compatibilidade com dados existentes do MVP.
 */

import type { IStorageAdapter } from './storage-adapter';

export class LocalAdapter<T extends { id: string }> implements IStorageAdapter<T> {
  constructor(private storageKey: string) {}

  async getAll(): Promise<T[]> {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  async getById(id: string): Promise<T | null> {
    const all = await this.getAll();
    return all.find((item) => item.id === id) || null;
  }

  async add(item: T): Promise<void> {
    const all = await this.getAll();
    all.unshift(item);
    this.save(all);
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const all = await this.getAll();
    const idx = all.findIndex((item) => item.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...data };
      this.save(all);
    }
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    this.save(all.filter((item) => item.id !== id));
  }

  async set(id: string, item: T): Promise<void> {
    const all = await this.getAll();
    const idx = all.findIndex((i) => i.id === id);
    if (idx >= 0) {
      all[idx] = item;
    } else {
      all.unshift(item);
    }
    this.save(all);
  }

  async query(filterFn: (item: T) => boolean): Promise<T[]> {
    const all = await this.getAll();
    return all.filter(filterFn);
  }

  private save(data: T[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  }
}
