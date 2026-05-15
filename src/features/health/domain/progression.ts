/**
 * Progression Engine — "double progression" coach.
 *
 * Reads the LAST recorded session for an exercise and tells the user whether
 * to add weight, chase more reps, or back off — the call a real personal
 * trainer would make, expressed the way lifters think (per-side plates).
 */

import type { ExerciseSet } from './workout.types';

/** Default hypertrophy rep range. Stay until you hit `max` on every set. */
export const DEFAULT_REP_RANGE = { min: 8, max: 12 } as const;

/** Standard Olympic barbell weight (kg), used for per-side math. */
export const BARBELL_KG = 20;

/**
 * Exercises performed on a straight barbell (per-side plate logic applies).
 * Names match EXERCISE_CATALOG entries.
 */
const BARBELL_EXERCISES = new Set<string>([
  'Supino Reto',
  'Supino Inclinado',
  'Remada Curvada',
  'Agachamento Livre',
]);

/** Lower-body compounds jump faster than upper-body / isolators. */
const HEAVY_LEG_EXERCISES = new Set<string>([
  'Agachamento Livre',
  'Leg Press',
]);

const ISOLATION_EXERCISES = new Set<string>([
  'Crucifixo', 'Elevação Lateral', 'Rosca Direta', 'Rosca Martelo',
  'Tríceps Pulley', 'Tríceps Francês', 'Extensora', 'Flexora', 'Panturrilha',
]);

export function isBarbell(exerciseName: string): boolean {
  return BARBELL_EXERCISES.has(exerciseName);
}

/**
 * Minimum sensible weight increment for an exercise.
 *  - heavy legs: 5 kg
 *  - isolation:  1 kg
 *  - default (upper compound): 2.5 kg
 */
export function weightIncrement(exerciseName: string): number {
  if (HEAVY_LEG_EXERCISES.has(exerciseName)) return 5;
  if (ISOLATION_EXERCISES.has(exerciseName)) return 1;
  return 2.5;
}

export type ProgressionStatus = 'progress' | 'hold' | 'deload' | 'first-time';

export interface ProgressionAdvice {
  status: ProgressionStatus;
  headline: string;
  detail: string;
  /** Weight to put on the bar/stack next time. */
  suggestedWeight: number;
  /** Reps to aim for with the suggested weight. */
  suggestedReps: number;
  /** kg added vs the last working weight (0 when holding). */
  addedTotal: number;
  /** kg added per side (barbell only; equals addedTotal/2). */
  addedPerSide: number | null;
  /** Human string e.g. "barra 20kg + 12,5kg de cada lado". */
  loadBreakdown: string | null;
  lastWeight: number;
  lastTopReps: number;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

/**
 * Builds the per-side breakdown for barbell lifts.
 * Returns null for non-barbell exercises (no plate concept).
 */
export function loadBreakdown(exerciseName: string, totalWeight: number): string | null {
  if (!isBarbell(exerciseName)) return null;
  if (totalWeight < BARBELL_KG) {
    return `${fmt(totalWeight)}kg (abaixo do peso da barra)`;
  }
  const perSide = (totalWeight - BARBELL_KG) / 2;
  if (perSide === 0) return `só a barra (${BARBELL_KG}kg)`;
  return `barra ${BARBELL_KG}kg + ${fmt(perSide)}kg de cada lado`;
}

interface LastSession {
  sets: ExerciseSet[];
  date: number;
}

/**
 * Core decision. Given the last session's sets, returns coaching advice.
 *
 * Rules (double progression):
 *  - no history            → first-time
 *  - every set reached max  → PROGRESS: +increment, drop to range.min
 *  - any set below range.min → DELOAD: hold or shave the weight
 *  - otherwise (in range)   → HOLD: same weight, chase +1 rep
 */
export function getProgressionAdvice(
  exerciseName: string,
  last: LastSession | null,
  range: { min: number; max: number } = DEFAULT_REP_RANGE,
): ProgressionAdvice {
  const inc = weightIncrement(exerciseName);
  const barbell = isBarbell(exerciseName);

  if (!last || last.sets.length === 0) {
    return {
      status: 'first-time',
      headline: 'Primeira vez nesse exercício',
      detail: `Escolha um peso que você faça ${range.min}–${range.max} reps com boa forma. Vou acompanhar a partir daqui.`,
      suggestedWeight: 0,
      suggestedReps: range.max,
      addedTotal: 0,
      addedPerSide: null,
      loadBreakdown: null,
      lastWeight: 0,
      lastTopReps: 0,
    };
  }

  // The "working weight" = the heaviest weight used; reps at that weight.
  const workingWeight = Math.max(...last.sets.map((s) => s.weight));
  const setsAtWorking = last.sets.filter((s) => s.weight === workingWeight);
  const repsAtWorking = setsAtWorking.map((s) => s.reps);
  const minReps = Math.min(...repsAtWorking);
  const topReps = Math.max(...repsAtWorking);

  // All working sets hit the top of the range → progress.
  const allMaxed = repsAtWorking.length >= 1 && minReps >= range.max;
  // Any working set fell below the floor → deload signal.
  const anyBelowFloor = minReps < range.min;

  if (allMaxed) {
    const suggested = Math.round((workingWeight + inc) * 100) / 100;
    const perSide = barbell ? inc / 2 : null;
    return {
      status: 'progress',
      headline: 'Hora de subir! 🟢',
      detail: barbell
        ? `Você fechou ${range.max}+ reps em todas as séries com ${fmt(workingWeight)}kg. Adicione ${fmt(perSide as number)}kg de cada lado e volte pra ${range.min} reps.`
        : `Você fechou ${range.max}+ reps em todas as séries. Suba ${fmt(inc)}kg e volte pra ${range.min} reps.`,
      suggestedWeight: suggested,
      suggestedReps: range.min,
      addedTotal: inc,
      addedPerSide: perSide,
      loadBreakdown: loadBreakdown(exerciseName, suggested),
      lastWeight: workingWeight,
      lastTopReps: topReps,
    };
  }

  if (anyBelowFloor) {
    return {
      status: 'deload',
      headline: 'Semana leve 🔴',
      detail: `Alguma série caiu abaixo de ${range.min} reps com ${fmt(workingWeight)}kg. Mantenha esse peso (ou tire ${fmt(inc)}kg) e reconstrua a base com boa forma.`,
      suggestedWeight: workingWeight,
      suggestedReps: range.min,
      addedTotal: 0,
      addedPerSide: null,
      loadBreakdown: loadBreakdown(exerciseName, workingWeight),
      lastWeight: workingWeight,
      lastTopReps: topReps,
    };
  }

  // In range → hold weight, chase reps.
  const repsToGo = range.max - minReps;
  return {
    status: 'hold',
    headline: 'Mantenha o peso 🟡',
    detail: `Você está em ${minReps}–${topReps} reps com ${fmt(workingWeight)}kg. Fique nesse peso e mire +1 rep por série (faltam ${repsToGo} pra liberar o aumento).`,
    suggestedWeight: workingWeight,
    suggestedReps: Math.min(range.max, topReps + 1),
    addedTotal: 0,
    addedPerSide: null,
    loadBreakdown: loadBreakdown(exerciseName, workingWeight),
    lastWeight: workingWeight,
    lastTopReps: topReps,
  };
}
