/**
 * Workout Routines — user-defined routines you build once and "run" on a
 * given weekday, instead of recreating a workout from scratch every time.
 *
 * A routine stores the SHAPE (which exercises, how many sets, which days),
 * never the weights/reps — those come from your last real session via the
 * progression coach when you start the session.
 */

import type { CardioType, CardioIntensity } from './cardio.types';

/** 1=Mon .. 7=Sun (matches habits' WeekDay convention). */
export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAY_SHORT: Record<WeekDay, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom',
};

export const WEEKDAY_LONG: Record<WeekDay, string> = {
  1: 'segunda', 2: 'terça', 3: 'quarta', 4: 'quinta',
  5: 'sexta', 6: 'sábado', 7: 'domingo',
};

export function todayWeekDay(d = new Date()): WeekDay {
  const js = d.getDay();
  return (js === 0 ? 7 : js) as WeekDay;
}

export interface RoutineExercise {
  name: string;
  muscleGroup: string;
  gifUrl?: string;
  targetSets: number;
}

interface RoutineBase {
  id: string;
  name: string;
  /** Emoji shown on the card. */
  icon: string;
  daysOfWeek: WeekDay[];
  createdAt: number;
}

export interface StrengthRoutine extends RoutineBase {
  kind: 'strength';
  exercises: RoutineExercise[];
}

export interface CardioRoutine extends RoutineBase {
  kind: 'cardio';
  cardioType: CardioType;
  targetMinutes: number;
  intensity: CardioIntensity;
}

export type Routine = StrengthRoutine | CardioRoutine;

/**
 * Input to create a routine. Distributed Omit so the discriminated union
 * narrows correctly at call sites (a plain Omit<Routine,...> loses `kind`).
 */
export type NewRoutineInput =
  | Omit<StrengthRoutine, 'id' | 'createdAt'>
  | Omit<CardioRoutine, 'id' | 'createdAt'>;

export function isStrengthRoutine(r: Routine): r is StrengthRoutine {
  return r.kind === 'strength';
}

export function isCardioRoutine(r: Routine): r is CardioRoutine {
  return r.kind === 'cardio';
}

export function daysLabel(days: WeekDay[]): string {
  if (days.length === 0) return 'sem dias';
  if (days.length === 7) return 'todos os dias';
  // Weekdays Mon-Fri
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.join() === '1,2,3,4,5') return 'seg a sex';
  return sorted.map((d) => WEEKDAY_SHORT[d]).join(' · ');
}
