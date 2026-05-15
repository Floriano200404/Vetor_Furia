/**
 * Achievements Service — builds the evaluation context from localStorage and
 * tracks which achievements have already been "claimed" (Gold paid once).
 */

import {
  evaluateAll,
  type AchievementContext,
  type AchievementStatus,
} from '../domain/achievements';
import type { Workout, CardioSession, Biometry } from '@/features/health';
import { getLedgerEntries } from '@/features/core-rpg/services/xp-ledger.service';

const CLAIMED_KEY = 'vetor_furia_achievements';

function readRaw<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

interface LegacyHabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

/**
 * Best habit streak ever: longest run of consecutive calendar days where at
 * least one habit was completed. Approximation good enough for the milestone.
 */
function computeBestHabitStreak(): number {
  const logs = readRaw<LegacyHabitLog>('vetor_furia_habit_logs').filter((l) => l.completed);
  if (logs.length === 0) return 0;

  const days = Array.from(new Set(logs.map((l) => l.date))).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + 'T12:00:00');
    const cur = new Date(days[i] + 'T12:00:00');
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    if (diff === 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function buildContext(): AchievementContext {
  return {
    workouts: readRaw<Workout>('vetor_furia_workouts'),
    cardio: readRaw<CardioSession>('vetor_furia_cardio'),
    biometry: readRaw<Biometry>('vetor_furia_biometry'),
    ledger: getLedgerEntries(),
    bestHabitStreak: computeBestHabitStreak(),
  };
}

export function getAchievementStatuses(): AchievementStatus[] {
  return evaluateAll(buildContext());
}

export function getClaimedIds(): string[] {
  return readRaw<string>(CLAIMED_KEY);
}

function saveClaimed(ids: string[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLAIMED_KEY, JSON.stringify(ids));
  }
}

/**
 * Returns achievements that are unlocked but not yet claimed, and marks them
 * claimed. Caller is responsible for emitting the Gold reward events.
 */
export function claimNewlyUnlocked(): AchievementStatus[] {
  const statuses = getAchievementStatuses();
  const claimed = new Set(getClaimedIds());
  const newly = statuses.filter((s) => s.unlocked && !claimed.has(s.def.id));
  if (newly.length > 0) {
    for (const n of newly) claimed.add(n.def.id);
    saveClaimed(Array.from(claimed));
  }
  return newly;
}
