export { useWorkouts } from './hooks/useWorkouts';
export { useBiometry } from './hooks/useBiometry';
export type {
  Workout,
  Exercise,
  ExerciseSet,
  ExerciseCatalogItem,
  WorkoutTemplate,
  TemplateExercise,
  ExerciseHistoryPoint,
} from './domain/workout.types';
export type { Biometry } from './domain/biometry.types';
export { EXERCISE_CATALOG, MUSCLE_GROUPS, WORKOUT_TEMPLATES } from './domain/exercise-catalog';
export { DEFAULT_BIOMARKERS, classifyBiomarker } from './domain/biometry.types';
export { getLastExerciseLoad } from './services/health.service';
export {
  calculate1RM,
  getExerciseHistory,
  getLoggedExerciseNames,
  getWorkout1RM,
  isCompoundLift,
  COMPOUND_LIFTS,
} from './services/workout-analytics.service';
export { BiometryChart } from './components/BiometryChart';
export { BodySummary } from './components/BodySummary';
export { WorkoutTemplates } from './components/WorkoutTemplates';
export { OneRepMaxCalculator } from './components/OneRepMaxCalculator';
export { ProgressionChart } from './components/ProgressionChart';
