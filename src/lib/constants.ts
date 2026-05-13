/**
 * Global constants for the Vetor Fúria application.
 */

// --- XP Rewards ---
export const XP_REWARDS = {
  HABIT_COMPLETE: 10,
  HABIT_STREAK_BONUS_PER_DAY: 5,
  HABIT_STREAK_BONUS_CAP: 50,
  HABIT_ALL_COMPLETE_BONUS: 50,
  WORKOUT_COMPLETE: 30,
  WORKOUT_EXERCISE_BONUS: 2,
  BIOMETRY_LOG: 15,
  STUDY_SESSION_BASE: 25,         // ≥ 25 min
  STUDY_SESSION_EXTRA_PER_25MIN: 10,
  STUDY_NOTES_BONUS: 10,
} as const;

// --- Level System ---
export const LEVEL_CONFIG = {
  /** Level = floor(0.3 × √totalXP) + 1 */
  SCALE_FACTOR: 0.3,
  /** Minimum level is 1 */
  MIN_LEVEL: 1,
} as const;

// --- Avatar Stages ---
export interface AvatarStageConfig {
  stage: number;
  name: string;
  minLevel: number;
  sprite: string;
}

export const AVATAR_STAGES: AvatarStageConfig[] = [
  { stage: 1, name: 'Iniciante',  minLevel: 1,  sprite: '/avatars/stage-1.png' },
  { stage: 2, name: 'Aprendiz',   minLevel: 5,  sprite: '/avatars/stage-2.png' },
  { stage: 3, name: 'Guerreiro',  minLevel: 10, sprite: '/avatars/stage-3.png' },
  { stage: 4, name: 'Mestre',     minLevel: 20, sprite: '/avatars/stage-4.png' },
  { stage: 5, name: 'Lendário',   minLevel: 30, sprite: '/avatars/stage-5.png' },
];

// --- Default User ID (MVP single-user mode) ---
export const DEFAULT_USER_ID = 'vetor-furia-player';

// --- Timer defaults ---
export const TIMER_DEFAULTS = {
  FOCUS_DURATION_MINUTES: 25,
  SHORT_BREAK_MINUTES: 5,
  LONG_BREAK_MINUTES: 15,
} as const;
