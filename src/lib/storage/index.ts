/**
 * Storage Factory — Returns the appropriate adapter based on Firebase config.
 * When Firebase is configured + user is authenticated → Firestore.
 * Otherwise → localStorage (fallback).
 */

import type { IStorageAdapter } from './storage-adapter';
import { LocalAdapter } from './local-adapter';
import { FirestoreAdapter } from './firestore-adapter';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';

// Map of localStorage keys used in MVP (for backward compatibility)
const LOCAL_STORAGE_KEYS: Record<string, string> = {
  users: 'vetor_furia_player',
  xp_ledgers: 'vetor_furia_xp_ledger',
  habits: 'vetor_furia_habits',
  habit_logs: 'vetor_furia_habit_logs',
  workouts: 'vetor_furia_workouts',
  biometry: 'vetor_furia_biometry',
  study_sessions: 'vetor_furia_study_sessions',
  rewards: 'vetor_furia_rewards',
  redemptions: 'vetor_furia_redemptions',
};

/**
 * Create a storage adapter for the given collection.
 * @param collectionName - Firestore collection or localStorage key identifier
 * @param userId - Current user ID (from Auth or default)
 */
export function createAdapter<T extends { id: string }>(
  collectionName: string,
  userId?: string,
): IStorageAdapter<T> {
  if (isFirebaseConfigured && db && userId) {
    return new FirestoreAdapter<T>(db, collectionName, userId);
  }
  const localKey = LOCAL_STORAGE_KEYS[collectionName] || `vetor_furia_${collectionName}`;
  return new LocalAdapter<T>(localKey);
}

export type { IStorageAdapter } from './storage-adapter';
export { LocalAdapter } from './local-adapter';
export { FirestoreAdapter } from './firestore-adapter';
