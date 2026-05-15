/**
 * Workout Analytics — pure, read-only analytics on saved workouts.
 *
 * Reads from the same localStorage key (`vetor_furia_workouts`) used by
 * health.service.ts but does not import it to keep this module side-effect-free.
 */

import type { Workout, ExerciseHistoryPoint } from '../domain/workout.types';

const WORKOUTS_KEY = 'vetor_furia_workouts';

/**
 * Compound lifts where 1RM is a meaningful strength metric.
 * Names match EXERCISE_CATALOG entries.
 */
export const COMPOUND_LIFTS: ReadonlySet<string> = new Set([
  'Supino Reto',
  'Supino Inclinado',
  'Agachamento Livre',
  'Leg Press',
  'Desenvolvimento',
  'Remada Curvada',
  'Puxada Frontal',
]);

export function isCompoundLift(exerciseName: string): boolean {
  return COMPOUND_LIFTS.has(exerciseName);
}

/**
 * Estimated 1RM via the Epley formula.
 * `weight * (1 + reps / 30)` — accurate up to ~10 reps.
 * Returns 0 if inputs are invalid (avoids NaN bleeding into charts).
 */
export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  const oneRM = weight * (1 + reps / 30);
  return Math.round(oneRM * 10) / 10;
}

function readWorkoutsRaw(): Workout[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WORKOUTS_KEY);
    return raw ? (JSON.parse(raw) as Workout[]) : [];
  } catch {
    return [];
  }
}

function formatDateLabel(timestamp: number): string {
  const d = new Date(timestamp);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/**
 * Returns the user's full history for one exercise, ordered chronologically asc
 * (oldest first, newest last) for left-to-right chart rendering.
 *
 * Each point aggregates one workout session:
 *  - maxWeight: heaviest set in that session
 *  - volume: sum of (weight * reps) across all sets that session
 *  - calculated1RM: Epley estimate from the best (weight, reps) pair
 *  - topReps: reps of the set that produced calculated1RM
 */
export function getExerciseHistory(exerciseName: string): ExerciseHistoryPoint[] {
  const workouts = readWorkoutsRaw();
  const points: ExerciseHistoryPoint[] = [];

  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.name === exerciseName);
    if (!ex || ex.sets.length === 0) continue;

    let maxWeight = 0;
    let volume = 0;
    let best1RM = 0;
    let topReps = 0;

    for (const set of ex.sets) {
      if (set.weight > maxWeight) maxWeight = set.weight;
      volume += set.weight * set.reps;
      const oneRM = calculate1RM(set.weight, set.reps);
      if (oneRM > best1RM) {
        best1RM = oneRM;
        topReps = set.reps;
      }
    }

    if (maxWeight === 0 && volume === 0) continue;

    points.push({
      date: w.date,
      dateLabel: formatDateLabel(w.date),
      maxWeight: Math.round(maxWeight * 10) / 10,
      volume: Math.round(volume * 10) / 10,
      calculated1RM: best1RM,
      topReps,
    });
  }

  return points.sort((a, b) => a.date - b.date);
}

/**
 * Names of exercises the user has ever logged, sorted by most-recent usage.
 * Used by the progression chart's selector dropdown.
 */
export function getLoggedExerciseNames(): string[] {
  const workouts = readWorkoutsRaw().sort((a, b) => b.date - a.date);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (!seen.has(ex.name)) {
        seen.add(ex.name);
        out.push(ex.name);
      }
    }
  }
  return out;
}

/**
 * Highest 1RM ever reached for an exercise inside a single workout.
 * Returns 0 if the exercise has never been logged or no set qualifies.
 * Used by the workout history badges.
 */
export function getWorkout1RM(workout: Workout, exerciseName: string): number {
  const ex = workout.exercises.find((e) => e.name === exerciseName);
  if (!ex) return 0;
  let best = 0;
  for (const set of ex.sets) {
    const oneRM = calculate1RM(set.weight, set.reps);
    if (oneRM > best) best = oneRM;
  }
  return best;
}

/**
 * The most recent session (sets + date) where the exercise appears.
 * Returns null if never logged. Used by the progression coach.
 */
export function getLastSessionForExercise(exerciseName: string): {
  sets: import('../domain/workout.types').ExerciseSet[];
  date: number;
} | null {
  const workouts = readWorkoutsRaw().sort((a, b) => b.date - a.date);
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.name === exerciseName);
    if (ex && ex.sets.length > 0) {
      return { sets: ex.sets, date: w.date };
    }
  }
  return null;
}
