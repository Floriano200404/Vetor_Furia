/**
 * XP Ledger Service — persists XP entries via Storage Adapter.
 * Automatically uses Firestore when configured, localStorage otherwise.
 */

import type { XPEntry } from '../domain/xp-ledger.types';
import type { Player } from '../domain/player.types';
import { calculateLevel, getAvatarStage } from './level-calculator';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { createAdapter, type IStorageAdapter } from '@/lib/storage';

const STORAGE_KEYS = {
  PLAYER: 'vetor_furia_player',
  LEDGER: 'vetor_furia_xp_ledger',
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// --- Adapters (lazy singleton per userId) ---
let currentUserId: string | null = null;
let playerAdapter: IStorageAdapter<Player> | null = null;
let ledgerAdapter: IStorageAdapter<XPEntry> | null = null;

function getAdapters(userId?: string) {
  const uid = userId || DEFAULT_USER_ID;
  if (currentUserId !== uid || !playerAdapter || !ledgerAdapter) {
    currentUserId = uid;
    playerAdapter = createAdapter<Player>('users', uid);
    ledgerAdapter = createAdapter<XPEntry>('xp_ledgers', uid);
  }
  return { playerAdapter, ledgerAdapter };
}

// --- Player (sync wrappers for backward compatibility) ---

function createDefaultPlayer(uid?: string): Player {
  const finalUid = uid || DEFAULT_USER_ID;
  return {
    id: finalUid,
    uid: finalUid,
    displayName: 'Guerreiro',
    email: '',
    totalXP: 0,
    level: 1,
    avatarStage: 1,
    hp: 100,
    maxHp: 100,
    gold: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Get player data — synchronous for backward compatibility.
 * Uses localStorage directly for reads (fast), adapter for writes.
 */
export function getPlayer(userId?: string): Player {
  if (typeof window === 'undefined') return createDefaultPlayer(userId);
  const stored = localStorage.getItem(STORAGE_KEYS.PLAYER);
  if (stored) {
    const player = JSON.parse(stored);
    // If userId doesn't match, return default (multi-user transition)
    if (userId && player.uid !== userId) {
      return createDefaultPlayer(userId);
    }
    if (!player.id) {
      player.id = player.uid;
    }
    if (player.hp === undefined) player.hp = 100;
    if (player.maxHp === undefined) player.maxHp = 100;
    if (player.gold === undefined) player.gold = 0;
    return player;
  }
  const player = createDefaultPlayer(userId);
  localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
  return player;
}

export function savePlayer(player: Player): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
  // Also persist to adapter (Firestore when available)
  const { playerAdapter: pa } = getAdapters(player.uid);
  pa.set(player.uid, player).catch(console.error);
}

// --- XP Ledger ---

export function getLedgerEntries(): XPEntry[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.LEDGER);
  const entries: XPEntry[] = stored ? JSON.parse(stored) : [];
  // Remove duplicatas por id — protege a UI de "chaves repetidas" no React
  // caso o histórico tenha entradas duplicadas (resquício do antigo bug de XP em dobro).
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

function saveLedgerEntries(entries: XPEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(entries));
}

export function addXPEntry(entry: Omit<XPEntry, 'id' | 'createdAt'>): {
  entry: XPEntry;
  player: Player;
  leveledUp: boolean;
  previousLevel: number;
} {
  const newEntry: XPEntry = {
    ...entry,
    id: generateId(),
    createdAt: Date.now(),
  };

  // Save entry to ledger (localStorage for instant read, adapter for cloud)
  const entries = getLedgerEntries();
  entries.unshift(newEntry);
  saveLedgerEntries(entries);

  // Also persist to adapter
  const { ledgerAdapter: la } = getAdapters(entry.userId);
  la.add(newEntry).catch(console.error);

  // Update player
  const player = getPlayer(entry.userId);
  const previousLevel = player.level;
  player.totalXP += entry.amount;
  player.level = calculateLevel(player.totalXP);
  player.avatarStage = getAvatarStage(player.level).stage;
  player.updatedAt = Date.now();
  savePlayer(player);

  return {
    entry: newEntry,
    player,
    leveledUp: player.level > previousLevel,
    previousLevel,
  };
}

export function getRecentEntries(limit: number = 10): XPEntry[] {
  return getLedgerEntries().slice(0, limit);
}

/**
 * Sync player data from Firestore on login.
 * Merges cloud data with local data, taking the higher XP.
 */
export async function syncFromCloud(userId: string): Promise<void> {
  const { playerAdapter: pa, ledgerAdapter: la } = getAdapters(userId);

  try {
    const cloudPlayer = await pa.getById(userId);
    const localPlayer = getPlayer(userId);

    if (cloudPlayer && cloudPlayer.totalXP > localPlayer.totalXP) {
      // Cloud has more progress — use it
      savePlayer(cloudPlayer);
    } else if (localPlayer.totalXP > 0 && (!cloudPlayer || localPlayer.totalXP > cloudPlayer.totalXP)) {
      // Local has more progress — push to cloud
      localPlayer.uid = userId;
      await pa.set(userId, localPlayer);
    }
  } catch (error) {
    console.warn('[XP Ledger] Cloud sync failed, using local data:', error);
  }
}
