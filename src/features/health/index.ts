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
  getLastSessionForExercise,
  isCompoundLift,
  COMPOUND_LIFTS,
} from './services/workout-analytics.service';
export {
  getProgressionAdvice,
  isBarbell,
  weightIncrement,
  loadBreakdown,
  DEFAULT_REP_RANGE,
} from './domain/progression';
export type { ProgressionAdvice, ProgressionStatus } from './domain/progression';
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
export type { CardioSeed } from './components/CardioPanel';
export { RoutinesPanel } from './components/RoutinesPanel';
export { RoutineEditor } from './components/RoutineEditor';
export { useRoutines } from './hooks/useRoutines';
export type { WorkoutDraftSeed } from './hooks/useWorkoutDraft';
export {
  getRoutines,
  addRoutine,
  updateRoutine,
  deleteRoutine,
  getRoutinesForDay,
  materializeStrengthSession,
} from './services/routines.service';
export {
  isStrengthRoutine,
  isCardioRoutine,
  daysLabel,
  todayWeekDay,
  WEEKDAY_SHORT as ROUTINE_WEEKDAY_SHORT,
} from './domain/workout-routine';
export type {
  Routine,
  StrengthRoutine,
  CardioRoutine,
  RoutineExercise,
  WeekDay as RoutineWeekDay,
} from './domain/workout-routine';
export { TrainingPlanCard } from './components/TrainingPlanCard';
export { TodayRoutineCard } from './components/TodayRoutineCard';
export { RecoveryMap } from './components/RecoveryMap';
export { ProgressPhotos } from './components/ProgressPhotos';
export { getRecoveryMap, suggestNextGroup } from './services/recovery.service';
export {
  getTrainingPlan,
  saveTrainingPlan,
  todaysFocus,
  PLAN_FOCUSES,
  focusDef,
} from './domain/training-plan';
export type { PlanFocus, WeeklyPlan } from './domain/training-plan';
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
