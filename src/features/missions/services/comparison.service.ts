/**
 * Comparison Service — "you vs past you": current 30-day window vs the
 * previous 30-day window across key metrics.
 */

import type { Workout, CardioSession, Biometry } from '@/features/health';
import { getLedgerEntries } from '@/features/core-rpg/services/xp-ledger.service';

const MS_DAY = 86_400_000;
const WINDOW = 30 * MS_DAY;

function readRaw<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function workoutVolume(workouts: Workout[], from: number, to: number): number {
  let v = 0;
  for (const w of workouts) {
    if (w.date < from || w.date >= to) continue;
    for (const ex of w.exercises) for (const s of ex.sets) v += s.weight * s.reps;
  }
  return Math.round(v);
}

export interface ComparisonMetric {
  key: string;
  label: string;
  icon: string;
  current: number;
  previous: number;
  unit: string;
  /** percentage change; null when previous is 0 (no baseline) */
  deltaPct: number | null;
  /** true = up is good (most), false = neutral/contextual (weight) */
  higherIsBetter: boolean;
}

export function buildComparison(): ComparisonMetric[] {
  const now = Date.now();
  const curFrom = now - WINDOW;
  const prevFrom = now - 2 * WINDOW;
  const prevTo = curFrom;

  const workouts = readRaw<Workout>('vetor_furia_workouts');
  const cardio = readRaw<CardioSession>('vetor_furia_cardio');
  const bio = readRaw<Biometry>('vetor_furia_biometry').sort(
    (a, b) => a.measuredAt - b.measuredAt,
  );
  const ledger = getLedgerEntries();

  const inRange = <T extends { date?: number; measuredAt?: number; createdAt?: number }>(
    arr: T[],
    from: number,
    to: number,
    field: 'date' | 'measuredAt' | 'createdAt',
  ) => arr.filter((x) => {
    const t = x[field] as number | undefined;
    return t !== undefined && t >= from && t < to;
  });

  const curWk = inRange(workouts, curFrom, now, 'date');
  const prevWk = inRange(workouts, prevFrom, prevTo, 'date');
  const curCardio = inRange(cardio, curFrom, now, 'date');
  const prevCardio = inRange(cardio, prevFrom, prevTo, 'date');
  const curXP = inRange(ledger, curFrom, now, 'createdAt').reduce((a, e) => a + e.amount, 0);
  const prevXP = inRange(ledger, prevFrom, prevTo, 'createdAt').reduce((a, e) => a + e.amount, 0);

  const pct = (cur: number, prev: number): number | null =>
    prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);

  const metrics: ComparisonMetric[] = [
    {
      key: 'volume',
      label: 'Volume levantado',
      icon: '🏋️',
      current: workoutVolume(workouts, curFrom, now),
      previous: workoutVolume(workouts, prevFrom, prevTo),
      unit: 'kg',
      deltaPct: null,
      higherIsBetter: true,
    },
    {
      key: 'workouts',
      label: 'Treinos',
      icon: '💪',
      current: curWk.length,
      previous: prevWk.length,
      unit: '',
      deltaPct: null,
      higherIsBetter: true,
    },
    {
      key: 'cardio',
      label: 'Minutos de cardio',
      icon: '🫁',
      current: curCardio.reduce((a, c) => a + c.durationMinutes, 0),
      previous: prevCardio.reduce((a, c) => a + c.durationMinutes, 0),
      unit: 'min',
      deltaPct: null,
      higherIsBetter: true,
    },
    {
      key: 'xp',
      label: 'XP ganho',
      icon: '⚡',
      current: curXP,
      previous: prevXP,
      unit: '',
      deltaPct: null,
      higherIsBetter: true,
    },
  ];

  for (const m of metrics) m.deltaPct = pct(m.current, m.previous);
  return metrics.filter((m) => m.current > 0 || m.previous > 0);
}
