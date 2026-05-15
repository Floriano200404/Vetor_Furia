/**
 * Mentor Service — pure local heuristics that turn raw data into 1-3
 * actionable coaching insights. No API, no IO besides localStorage reads.
 */

import type { Workout, CardioSession, Biometry } from '@/features/health';

export type InsightTone = 'warning' | 'info' | 'positive';

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  text: string;
  /** Higher = shown first. */
  priority: number;
}

const MS_DAY = 86_400_000;

function readRaw<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function daysSince(ts: number | undefined): number {
  if (!ts) return Infinity;
  return Math.floor((Date.now() - ts) / MS_DAY);
}

function volumeInRange(workouts: Workout[], from: number, to: number): number {
  let v = 0;
  for (const w of workouts) {
    if (w.date < from || w.date >= to) continue;
    for (const ex of w.exercises) for (const s of ex.sets) v += s.weight * s.reps;
  }
  return v;
}

/**
 * Produce up to `max` insights sorted by priority.
 */
export function getInsights(max = 3): Insight[] {
  const workouts = readRaw<Workout>('vetor_furia_workouts').sort((a, b) => b.date - a.date);
  const cardio = readRaw<CardioSession>('vetor_furia_cardio').sort((a, b) => b.date - a.date);
  const biometry = readRaw<Biometry>('vetor_furia_biometry').sort(
    (a, b) => b.measuredAt - a.measuredAt,
  );

  const out: Insight[] = [];

  // 1) Days without workout
  const wkDays = daysSince(workouts[0]?.date);
  if (wkDays !== Infinity && wkDays >= 4) {
    out.push({
      id: 'no-workout',
      tone: 'warning',
      icon: '🏋️',
      text: `Você não treina há ${wkDays} dias. Que tal hoje?`,
      priority: 90,
    });
  }

  // 2) Muscle group neglected
  const groupLastSeen = new Map<string, number>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (!groupLastSeen.has(ex.muscleGroup)) groupLastSeen.set(ex.muscleGroup, w.date);
    }
  }
  let worstGroup: { g: string; d: number } | null = null;
  for (const [g, ts] of groupLastSeen) {
    const d = daysSince(ts);
    if (d >= 8 && (!worstGroup || d > worstGroup.d)) worstGroup = { g, d };
  }
  if (worstGroup) {
    out.push({
      id: 'neglected-group',
      tone: 'warning',
      icon: '🎯',
      text: `Você não treina ${worstGroup.g} há ${worstGroup.d} dias — ponto fraco à vista.`,
      priority: 80,
    });
  }

  // 3) Volume trend (this 30d vs previous 30d)
  const now = Date.now();
  const cur = volumeInRange(workouts, now - 30 * MS_DAY, now);
  const prev = volumeInRange(workouts, now - 60 * MS_DAY, now - 30 * MS_DAY);
  if (prev > 0 && cur > 0) {
    const delta = Math.round(((cur - prev) / prev) * 100);
    if (delta <= -15) {
      out.push({
        id: 'volume-down',
        tone: 'warning',
        icon: '📉',
        text: `Seu volume caiu ${Math.abs(delta)}% vs os 30 dias anteriores.`,
        priority: 70,
      });
    } else if (delta >= 15) {
      out.push({
        id: 'volume-up',
        tone: 'positive',
        icon: '📈',
        text: `Volume subiu ${delta}% no último mês. Progressão sólida!`,
        priority: 60,
      });
    }
  }

  // 4) Cardio absent this week
  const cardioDays = daysSince(cardio[0]?.date);
  if (cardioDays !== Infinity && cardioDays >= 7) {
    out.push({
      id: 'cardio-gap',
      tone: 'info',
      icon: '🫁',
      text: `Última sessão de cardio há ${cardioDays} dias. Constituição precisa de você.`,
      priority: 55,
    });
  }

  // 5) Biometry stale
  const bioDays = daysSince(biometry[0]?.measuredAt);
  if (bioDays !== Infinity && bioDays >= 21) {
    out.push({
      id: 'bio-stale',
      tone: 'info',
      icon: '⚖️',
      text: `Sua biometria está desatualizada há ${bioDays} dias.`,
      priority: 40,
    });
  }

  // 6) Positive reinforcement when streaky
  if (workouts.length >= 3 && wkDays <= 1) {
    out.push({
      id: 'on-fire',
      tone: 'positive',
      icon: '🔥',
      text: 'Treino em dia e consistente. Continue nesse ritmo!',
      priority: 30,
    });
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, max);
}
