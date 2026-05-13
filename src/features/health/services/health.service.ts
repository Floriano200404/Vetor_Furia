/**
 * Health Service — Workouts and Biometry persistence via Storage Adapter.
 * Sync local reads + async cloud writes.
 */

import type { Workout, Exercise } from '../domain/workout.types';
import type { Biometry } from '../domain/biometry.types';
import { DEFAULT_USER_ID, XP_REWARDS } from '@/lib/constants';
import { createAdapter } from '@/lib/storage';

const STORAGE_KEYS = {
  WORKOUTS: 'vetor_furia_workouts',
  BIOMETRY: 'vetor_furia_biometry',
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function readLocal<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeLocal<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(data));
}

// --- Workouts ---

export function getWorkouts(): Workout[] {
  return readLocal<Workout>(STORAGE_KEYS.WORKOUTS);
}

function saveWorkouts(workouts: Workout[]): void {
  writeLocal(STORAGE_KEYS.WORKOUTS, workouts);
}

export function calculateWorkoutXP(exercises: Exercise[]): number {
  let xp = XP_REWARDS.WORKOUT_COMPLETE;
  if (exercises.length > 1) {
    xp += (exercises.length - 1) * XP_REWARDS.WORKOUT_EXERCISE_BONUS;
  }
  return xp;
}

/**
 * Get the last recorded load for a given exercise name.
 * Used for Progressive Overload comparison.
 */
export function getLastExerciseLoad(exerciseName: string): {
  avgWeight: number;
  maxWeight: number;
  avgReps: number;
  totalSets: number;
  date: number;
  suggestedWeight: number;
} | null {
  const workouts = getWorkouts().sort((a, b) => b.date - a.date);
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.name === exerciseName);
    if (ex && ex.sets.length > 0) {
      const weights = ex.sets.map((s) => s.weight).filter((w) => w > 0);
      const reps = ex.sets.map((s) => s.reps).filter((r) => r > 0);
      if (weights.length > 0) {
        const maxWeight = Math.max(...weights);
        // Suggest +2.5kg or +5%, whichever is greater (rounded to 0.5)
        const increment = Math.max(2.5, Math.round((maxWeight * 0.05) * 2) / 2);
        return {
          avgWeight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
          maxWeight,
          avgReps: reps.length > 0 ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) : 0,
          totalSets: ex.sets.length,
          date: w.date,
          suggestedWeight: Math.round((maxWeight + increment) * 10) / 10,
        };
      }
    }
  }
  return null;
}

export function addWorkout(data: {
  name: string;
  exercises: Exercise[];
  durationMinutes: number;
}): Workout {
  const workouts = getWorkouts();
  const workout: Workout = {
    id: generateId(),
    userId: DEFAULT_USER_ID,
    name: data.name,
    exercises: data.exercises.map((e) => ({ ...e, id: e.id || generateId() })),
    totalXP: calculateWorkoutXP(data.exercises),
    durationMinutes: data.durationMinutes,
    date: Date.now(),
    createdAt: Date.now(),
  };
  workouts.unshift(workout);
  saveWorkouts(workouts);
  // Cloud persist
  createAdapter<Workout>('workouts', DEFAULT_USER_ID).add(workout).catch(console.error);
  return workout;
}

export function deleteWorkout(workoutId: string): void {
  const workouts = getWorkouts().filter((w) => w.id !== workoutId);
  saveWorkouts(workouts);
  createAdapter<Workout>('workouts', DEFAULT_USER_ID).delete(workoutId).catch(console.error);
}

// --- Biometry ---

export function getBiometryRecords(): Biometry[] {
  return readLocal<Biometry>(STORAGE_KEYS.BIOMETRY);
}

function saveBiometryRecords(records: Biometry[]): void {
  writeLocal(STORAGE_KEYS.BIOMETRY, records);
}

export function addBiometry(data: {
  weight: number;
  height: number;
  biomarkers: Record<string, number | string>;
}): Biometry {
  const records = getBiometryRecords();
  const record: Biometry = {
    id: generateId(),
    userId: DEFAULT_USER_ID,
    weight: data.weight,
    height: data.height,
    biomarkers: data.biomarkers,
    measuredAt: Date.now(),
  };
  records.unshift(record);
  saveBiometryRecords(records);
  createAdapter<Biometry>('biometry', DEFAULT_USER_ID).add(record).catch(console.error);
  return record;
}

export function getLatestBiometry(): Biometry | null {
  const records = getBiometryRecords();
  return records.length > 0 ? records[0] : null;
}
