/**
 * Habit Domain Types
 */

export interface Habit {
  id: string;
  userId: string;
  title: string;
  icon: string;
  xpReward: number;
  isTemplate: boolean;
  order: number;
  createdAt: number;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  currentStreak: number;
  longestStreak: number;
  completedAt: number | null;
}

export interface HabitWithLog {
  habit: Habit;
  log: HabitLog;
  streak: number;
}
