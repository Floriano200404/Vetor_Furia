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
