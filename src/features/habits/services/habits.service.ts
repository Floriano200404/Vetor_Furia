/**
 * Habits Service — persistence via Storage Adapter.
 * Manages habits CRUD and daily logs with streak calculation.
 * Uses localStorage for synchronous reads + adapter for cloud persistence.
 */

import type { Habit, HabitLog, HabitWithLog } from '../domain/habit.types';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { createAdapter } from '@/lib/storage';

const STORAGE_KEYS = {
  HABITS: 'vetor_furia_habits',
  HABIT_LOGS: 'vetor_furia_habit_logs',
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// --- Local read/write helpers (sync, fast) ---

function readLocal<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeLocal<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// --- Cloud adapter helpers ---

function habitsAdapter(userId?: string) {
  return createAdapter<Habit>('habits', userId || DEFAULT_USER_ID);
}

function habitLogsAdapter(userId?: string) {
  return createAdapter<HabitLog>('habit_logs', userId || DEFAULT_USER_ID);
}

// --- Habits CRUD ---

export function getHabits(): Habit[] {
  return readLocal<Habit>(STORAGE_KEYS.HABITS);
}

export function saveHabits(habits: Habit[]): void {
  writeLocal(STORAGE_KEYS.HABITS, habits);
}

export function addHabit(data: { title: string; icon: string; xpReward: number; type?: 'positive' | 'negative' }): Habit {
  const habits = getHabits();
  const habit: Habit = {
    id: generateId(),
    userId: DEFAULT_USER_ID,
    title: data.title,
    icon: data.icon,
    xpReward: data.xpReward,
    isTemplate: false,
    order: habits.length,
    createdAt: Date.now(),
  };
  habits.push(habit);
  saveHabits(habits);
  // Persist to cloud
  habitsAdapter().add(habit).catch(console.error);
  return habit;
}

export function deleteHabit(habitId: string): void {
  const habits = getHabits().filter((h) => h.id !== habitId);
  saveHabits(habits);
  const logs = getHabitLogs().filter((l) => l.habitId !== habitId);
  saveHabitLogs(logs);
  // Cloud cleanup
  habitsAdapter().delete(habitId).catch(console.error);
}

// --- Habit Logs ---

function getHabitLogs(): HabitLog[] {
  return readLocal<HabitLog>(STORAGE_KEYS.HABIT_LOGS);
}

function saveHabitLogs(logs: HabitLog[]): void {
  writeLocal(STORAGE_KEYS.HABIT_LOGS, logs);
}

function getLogForDate(habitId: string, date: string): HabitLog | undefined {
  return getHabitLogs().find((l) => l.habitId === habitId && l.date === date);
}

/**
 * Calculate streak for a habit by looking at consecutive past days.
 */
function calculateStreak(habitId: string, currentDate: string): number {
  const logs = getHabitLogs()
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (logs.length === 0) return 0;

  let streak = 0;
  const d = new Date(currentDate + 'T12:00:00');

  if (logs.includes(currentDate)) {
    streak = 1;
    d.setDate(d.getDate() - 1);
  } else {
    return 0;
  }

  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if (logs.includes(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Toggle a habit for today. Returns the updated log and streak info.
 */
export function toggleHabitForToday(habitId: string): {
  log: HabitLog;
  streak: number;
  wasCompleted: boolean;
} {
  const today = getTodayString();
  const logs = getHabitLogs();
  const existingIndex = logs.findIndex((l) => l.habitId === habitId && l.date === today);

  let log: HabitLog;
  let wasCompleted: boolean;

  if (existingIndex >= 0) {
    wasCompleted = !logs[existingIndex].completed;
    logs[existingIndex].completed = wasCompleted;
    logs[existingIndex].completedAt = wasCompleted ? Date.now() : null;
    log = logs[existingIndex];
  } else {
    wasCompleted = true;
    log = {
      id: generateId(),
      userId: DEFAULT_USER_ID,
      habitId,
      date: today,
      completed: true,
      currentStreak: 0,
      longestStreak: 0,
      completedAt: Date.now(),
    };
    logs.push(log);
  }

  saveHabitLogs(logs);

  const streak = wasCompleted ? calculateStreak(habitId, today) : 0;

  log.currentStreak = streak;
  log.longestStreak = Math.max(log.longestStreak, streak);
  saveHabitLogs(logs);

  // Persist to cloud
  habitLogsAdapter().set(log.id, log).catch(console.error);

  return { log, streak, wasCompleted };
}

/**
 * Get all habits with today's log status.
 */
export function getHabitsWithLogs(): HabitWithLog[] {
  const habits = getHabits();
  const today = getTodayString();

  return habits.map((habit) => {
    const existingLog = getLogForDate(habit.id, today);
    const streak = existingLog?.completed ? calculateStreak(habit.id, today) : calculateStreak(habit.id, getYesterdayString());

    const log: HabitLog = existingLog || {
      id: '',
      userId: DEFAULT_USER_ID,
      habitId: habit.id,
      date: today,
      completed: false,
      currentStreak: streak,
      longestStreak: streak,
      completedAt: null,
    };

    return { habit, log, streak };
  });
}

/**
 * Check if all habits are completed for today.
 */
export function areAllHabitsCompleted(): boolean {
  const habitsWithLogs = getHabitsWithLogs();
  if (habitsWithLogs.length === 0) return false;
  return habitsWithLogs.every((h) => h.log.completed);
}
