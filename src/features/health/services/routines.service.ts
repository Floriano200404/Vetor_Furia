/**
 * Routines Service — CRUD + "materialize a session" from a routine.
 *
 * Materializing a strength routine pre-fills each exercise's sets using the
 * progression coach (last session → suggested next weight/reps), so starting
 * the day's workout is "review & confirm" instead of "build from zero".
 */

import type {
  Routine, StrengthRoutine, WeekDay, NewRoutineInput,
} from '../domain/workout-routine';
import { todayWeekDay } from '../domain/workout-routine';
import type { Exercise } from '../domain/workout.types';
import { getLastSessionForExercise } from './workout-analytics.service';
import { getProgressionAdvice } from '../domain/progression';

const STORAGE_KEY = 'vetor_furia_routines';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getRoutines(): Routine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Routine[]) : [];
  } catch {
    return [];
  }
}

function saveRoutines(routines: Routine[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  }
}

export function addRoutine(routine: NewRoutineInput): Routine {
  const created = { ...routine, id: generateId(), createdAt: Date.now() } as Routine;
  saveRoutines([...getRoutines(), created]);
  return created;
}

export function updateRoutine(id: string, patch: Partial<Routine>): void {
  const next = getRoutines().map((r) =>
    r.id === id ? ({ ...r, ...patch, id: r.id } as Routine) : r,
  );
  saveRoutines(next);
}

export function deleteRoutine(id: string): void {
  saveRoutines(getRoutines().filter((r) => r.id !== id));
}

export function getRoutinesForDay(day: WeekDay = todayWeekDay()): Routine[] {
  return getRoutines().filter((r) => r.daysOfWeek.includes(day));
}

export interface MaterializedExercise {
  exercise: Exercise;
  /** Coach headline for this exercise (shown when running the session). */
  coachNote: string;
}

/**
 * Turn a strength routine into editable Exercise[] with sets pre-filled by
 * the progression coach. Falls back to a sensible default for first-timers.
 */
export function materializeStrengthSession(routine: StrengthRoutine): {
  name: string;
  exercises: Exercise[];
  notes: string[];
} {
  const exercises: Exercise[] = [];
  const notes: string[] = [];

  for (const re of routine.exercises) {
    const last = getLastSessionForExercise(re.name);
    const advice = getProgressionAdvice(re.name, last);

    const weight =
      advice.status === 'first-time' ? 0 : advice.suggestedWeight;
    const reps =
      advice.status === 'first-time' ? 10 : advice.suggestedReps;

    const sets = Array.from({ length: Math.max(1, re.targetSets) }, () => ({
      reps,
      weight,
      completed: false,
    }));

    exercises.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: re.name,
      muscleGroup: re.muscleGroup,
      gifUrl: re.gifUrl,
      sets,
    });

    if (advice.status !== 'first-time') {
      notes.push(`${re.name}: ${advice.headline}`);
    }
  }

  return { name: routine.name, exercises, notes };
}
