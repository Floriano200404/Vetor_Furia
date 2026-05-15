/**
 * Cardio Service — persistence + aggregations.
 */

import type { CardioSession, CardioType, CardioIntensity } from '../domain/cardio.types';
import { calculateCardioXP } from '../domain/cardio.types';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { createAdapter } from '@/lib/storage';

const STORAGE_KEY = 'vetor_furia_cardio';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readLocal(): CardioSession[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as CardioSession[]) : [];
}

function writeLocal(sessions: CardioSession[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}

export function getCardioSessions(): CardioSession[] {
  return readLocal().sort((a, b) => b.date - a.date);
}

export interface AddCardioInput {
  type: CardioType;
  customName?: string;
  durationMinutes: number;
  distanceKm?: number;
  caloriesKcal?: number;
  intensity: CardioIntensity;
  notes?: string;
}

export function addCardioSession(data: AddCardioInput): CardioSession {
  const sessions = readLocal();
  const session: CardioSession = {
    id: generateId(),
    userId: DEFAULT_USER_ID,
    type: data.type,
    customName: data.customName,
    durationMinutes: data.durationMinutes,
    distanceKm: data.distanceKm,
    caloriesKcal: data.caloriesKcal,
    intensity: data.intensity,
    notes: data.notes,
    totalXP: calculateCardioXP(data.durationMinutes, data.intensity, data.distanceKm),
    date: Date.now(),
    createdAt: Date.now(),
  };
  sessions.unshift(session);
  writeLocal(sessions);
  createAdapter<CardioSession>('cardio', DEFAULT_USER_ID)
    .add(session)
    .catch(console.error);
  return session;
}

export function deleteCardioSession(id: string): void {
  const sessions = readLocal().filter((s) => s.id !== id);
  writeLocal(sessions);
  createAdapter<CardioSession>('cardio', DEFAULT_USER_ID)
    .delete(id)
    .catch(console.error);
}

/**
 * Sum of cardio minutes during the last 7 days (rolling, not calendar week).
 * Returns 0 if no sessions in window.
 */
export function getWeeklyCardioMinutes(): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return readLocal()
    .filter((s) => s.date >= cutoff)
    .reduce((acc, s) => acc + s.durationMinutes, 0);
}

export function getTotalCardioMinutes(): number {
  return readLocal().reduce((acc, s) => acc + s.durationMinutes, 0);
}

/**
 * Distance progression per session (for charts later). Returns asc by date.
 */
export interface CardioHistoryPoint {
  date: number;
  durationMinutes: number;
  distanceKm: number;
  pace: number | null; // min/km, null when distance is 0
}

export function getCardioHistoryByType(type: CardioType): CardioHistoryPoint[] {
  return readLocal()
    .filter((s) => s.type === type)
    .sort((a, b) => a.date - b.date)
    .map((s) => ({
      date: s.date,
      durationMinutes: s.durationMinutes,
      distanceKm: s.distanceKm ?? 0,
      pace: s.distanceKm && s.distanceKm > 0
        ? Math.round((s.durationMinutes / s.distanceKm) * 10) / 10
        : null,
    }));
}
