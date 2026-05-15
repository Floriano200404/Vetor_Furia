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
export { WorkoutHistoryList } from './components/WorkoutHistoryList';
export { NewWorkoutForm } from './components/NewWorkoutForm';
export { WorkoutStatsPanel } from './components/WorkoutStatsPanel';
export { BodyAvatar } from './components/BodyAvatar';
export { BodyTimelineSlider } from './components/BodyTimelineSlider';
export { useWorkoutDraft } from './hooks/useWorkoutDraft';
export { useCardio } from './hooks/useCardio';
export { CardioPanel } from './components/CardioPanel';
export type { CardioSession, CardioType, CardioIntensity } from './domain/cardio.types';
export { CARDIO_CATALOG, calculateCardioXP, estimateCalories } from './domain/cardio.types';
export {
  getBodyShape,
  getBodyShapeAt,
  getLevelTierColor,
  calculateBMI,
  BODY_SHAPE_LABELS,
  BODY_SHAPE_DESCRIPTIONS,
} from './domain/body-shape';
export type { BodyShape } from './domain/body-shape';
