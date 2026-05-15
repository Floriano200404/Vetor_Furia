/**
 * Achievements — declarative milestones evaluated against the full app state.
 *
 * Each achievement has an `evaluate(ctx)` returning current progress; the
 * service decides when it flips to unlocked and pays Gold once.
 */

import type { Workout } from '@/features/health';
import type { CardioSession } from '@/features/health';
import type { Biometry } from '@/features/health';
import type { XPEntry } from '@/features/core-rpg';

export interface AchievementContext {
  workouts: Workout[];
  cardio: CardioSession[];
  biometry: Biometry[];
  ledger: XPEntry[];
  /** Best streak ever reached across all habits. */
  bestHabitStreak: number;
}

export type AchievementTier = 'bronze' | 'prata' | 'ouro' | 'lendario';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  goldReward: number;
  /** Returns { current, target }. Unlocked when current >= target. */
  evaluate: (ctx: AchievementContext) => { current: number; target: number };
}

export const TIER_META: Record<AchievementTier, { label: string; color: string }> = {
  bronze: { label: 'Bronze', color: '#cd7f32' },
  prata: { label: 'Prata', color: '#c0c0c0' },
  ouro: { label: 'Ouro', color: '#f59e0b' },
  lendario: { label: 'Lendário', color: '#a855f7' },
};

function totalVolume(workouts: Workout[]): number {
  let v = 0;
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) v += s.weight * s.reps;
    }
  }
  return Math.round(v);
}

function uniqueActiveDays(ledger: XPEntry[]): number {
  const days = new Set(ledger.map((e) => new Date(e.createdAt).toISOString().slice(0, 10)));
  return days.size;
}

function totalCardioMinutes(cardio: CardioSession[]): number {
  return cardio.reduce((a, c) => a + c.durationMinutes, 0);
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // --- Volume ---
  {
    id: 'vol-1t',
    title: '1 Tonelada',
    description: 'Levante 1.000 kg de volume total acumulado.',
    icon: '🏋️',
    tier: 'bronze',
    goldReward: 25,
    evaluate: (c) => ({ current: totalVolume(c.workouts), target: 1_000 }),
  },
  {
    id: 'vol-10t',
    title: '10 Toneladas',
    description: 'Volume total acumulado de 10.000 kg.',
    icon: '💪',
    tier: 'prata',
    goldReward: 60,
    evaluate: (c) => ({ current: totalVolume(c.workouts), target: 10_000 }),
  },
  {
    id: 'vol-100t',
    title: 'Atlas',
    description: 'Volume total acumulado de 100.000 kg.',
    icon: '🗿',
    tier: 'lendario',
    goldReward: 200,
    evaluate: (c) => ({ current: totalVolume(c.workouts), target: 100_000 }),
  },

  // --- Workout count ---
  {
    id: 'wk-10',
    title: 'Iniciado',
    description: 'Registre 10 treinos.',
    icon: '🔰',
    tier: 'bronze',
    goldReward: 20,
    evaluate: (c) => ({ current: c.workouts.length, target: 10 }),
  },
  {
    id: 'wk-50',
    title: 'Veterano de Ferro',
    description: 'Registre 50 treinos.',
    icon: '⚔️',
    tier: 'ouro',
    goldReward: 100,
    evaluate: (c) => ({ current: c.workouts.length, target: 50 }),
  },

  // --- Habit streak ---
  {
    id: 'streak-7',
    title: 'Semana de Aço',
    description: 'Mantenha um hábito por 7 dias seguidos.',
    icon: '🔥',
    tier: 'bronze',
    goldReward: 25,
    evaluate: (c) => ({ current: c.bestHabitStreak, target: 7 }),
  },
  {
    id: 'streak-30',
    title: 'Imortal',
    description: 'Mantenha um hábito por 30 dias seguidos.',
    icon: '👑',
    tier: 'ouro',
    goldReward: 120,
    evaluate: (c) => ({ current: c.bestHabitStreak, target: 30 }),
  },
  {
    id: 'streak-100',
    title: 'Lenda Viva',
    description: 'Mantenha um hábito por 100 dias seguidos.',
    icon: '🌟',
    tier: 'lendario',
    goldReward: 300,
    evaluate: (c) => ({ current: c.bestHabitStreak, target: 100 }),
  },

  // --- Cardio ---
  {
    id: 'cardio-300',
    title: 'Fôlego de Maratonista',
    description: 'Acumule 300 minutos de cardio.',
    icon: '🫁',
    tier: 'prata',
    goldReward: 60,
    evaluate: (c) => ({ current: totalCardioMinutes(c.cardio), target: 300 }),
  },

  // --- Consistency ---
  {
    id: 'active-30',
    title: 'Constante',
    description: 'Esteja ativo em 30 dias diferentes.',
    icon: '📅',
    tier: 'prata',
    goldReward: 70,
    evaluate: (c) => ({ current: uniqueActiveDays(c.ledger), target: 30 }),
  },
  {
    id: 'active-100',
    title: 'Disciplina Absoluta',
    description: 'Esteja ativo em 100 dias diferentes.',
    icon: '🏆',
    tier: 'lendario',
    goldReward: 250,
    evaluate: (c) => ({ current: uniqueActiveDays(c.ledger), target: 100 }),
  },

  // --- Biometry ---
  {
    id: 'bio-5',
    title: 'Sob Controle',
    description: 'Registre biometria 5 vezes.',
    icon: '⚖️',
    tier: 'bronze',
    goldReward: 20,
    evaluate: (c) => ({ current: c.biometry.length, target: 5 }),
  },
];

export interface AchievementStatus {
  def: AchievementDef;
  current: number;
  target: number;
  progress: number; // 0..1
  unlocked: boolean;
}

export function evaluateAll(ctx: AchievementContext): AchievementStatus[] {
  return ACHIEVEMENTS.map((def) => {
    const { current, target } = def.evaluate(ctx);
    const clamped = Math.min(current, target);
    return {
      def,
      current: clamped,
      target,
      progress: target > 0 ? clamped / target : 0,
      unlocked: current >= target,
    };
  });
}
