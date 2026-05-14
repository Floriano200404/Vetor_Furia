/**
 * Workout Domain Types
 */

export interface Exercise {
  id: string;
  name: string;
  gifUrl?: string; // URL to exercise GIF
  muscleGroup: string;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  reps: number;
  weight: number; // kg
  completed: boolean;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  exercises: Exercise[];
  totalXP: number;
  durationMinutes: number;
  date: number;
  createdAt: number;
}

// Pre-built exercise catalog
export interface ExerciseCatalogItem {
  name: string;
  muscleGroup: string;
  gifUrl: string;
}

/**
 * Lightweight exercise shape used inside a Template "recipe".
 * Does not include `id` or `sets` — those are generated when the user
 * instantiates the template into a real workout draft.
 */
export interface TemplateExercise {
  name: string;
  muscleGroup: string;
  gifUrl?: string;
  defaultSets: number;
  defaultReps: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji used in the card header
  accent: 'push' | 'pull' | 'legs' | 'custom';
  exercises: TemplateExercise[];
}

/**
 * Point in an exercise's history, ordered by date asc.
 * Used by the progression chart and analytics.
 */
export interface ExerciseHistoryPoint {
  date: number;
  dateLabel: string;
  maxWeight: number;
  volume: number;
  calculated1RM: number;
  topReps: number;
}
