/**
 * Recovery Service — estimates per-muscle-group fatigue based on the last
 * time each group was trained. Pure read from workouts in localStorage.
 *
 * Recovery model (simplified, not medical):
 *   < 24h   → fatigado     (red)
 *   24-48h  → recuperando  (orange)
 *   48-72h  → quase pronto (yellow)
 *   > 72h   → recuperado   (green)
 *   nunca   → recuperado   (neutral green)
 */

import type { Workout } from '../domain/workout.types';

const MS_HOUR = 3_600_000;

export type RecoveryLevel = 'fatigado' | 'recuperando' | 'quase' | 'recuperado';

export interface MuscleRecovery {
  group: string;
  hoursSince: number | null; // null = never trained
  level: RecoveryLevel;
  color: string;
}

const LEVEL_COLOR: Record<RecoveryLevel, string> = {
  fatigado: '#ef4444',
  recuperando: '#f59e0b',
  quase: '#eab308',
  recuperado: '#10b981',
};

export const MUSCLE_GROUPS_ALL = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Abdômen',
];

function levelFor(hours: number | null): RecoveryLevel {
  if (hours === null) return 'recuperado';
  if (hours < 24) return 'fatigado';
  if (hours < 48) return 'recuperando';
  if (hours < 72) return 'quase';
  return 'recuperado';
}

function readWorkouts(): Workout[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('vetor_furia_workouts');
    return raw ? (JSON.parse(raw) as Workout[]) : [];
  } catch {
    return [];
  }
}

export function getRecoveryMap(): MuscleRecovery[] {
  const workouts = readWorkouts();
  const lastSeen = new Map<string, number>();

  for (const w of workouts) {
    for (const ex of w.exercises) {
      const prev = lastSeen.get(ex.muscleGroup);
      if (prev === undefined || w.date > prev) {
        lastSeen.set(ex.muscleGroup, w.date);
      }
    }
  }

  const now = Date.now();
  return MUSCLE_GROUPS_ALL.map((group) => {
    const ts = lastSeen.get(group);
    const hoursSince = ts === undefined ? null : Math.floor((now - ts) / MS_HOUR);
    const level = levelFor(hoursSince);
    return { group, hoursSince, level, color: LEVEL_COLOR[level] };
  });
}

/**
 * Suggests the best group to train today: the most-recovered group that
 * isn't fatigued. Returns null if everything is fresh (free choice).
 */
export function suggestNextGroup(map: MuscleRecovery[]): string | null {
  const trained = map.filter((m) => m.hoursSince !== null);
  if (trained.length === 0) return null;
  const recovered = map
    .filter((m) => m.level === 'recuperado')
    .sort((a, b) => (b.hoursSince ?? 0) - (a.hoursSince ?? 0));
  return recovered[0]?.group ?? null;
}
