/**
 * Firestore collection name constants.
 * Centralized to avoid typos and enable easy renaming.
 */
export const COLLECTIONS = {
  USERS: 'users',
  XP_LEDGERS: 'xp_ledgers',
  HABITS: 'habits',
  HABIT_LOGS: 'habit_logs',
  WORKOUTS: 'workouts',
  BIOMETRY: 'biometry',
  STUDY_SESSIONS: 'study_sessions',
} as const;
