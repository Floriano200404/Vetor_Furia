/**
 * Habits Service — persistence + business logic.
 *
 * v2: handles quantitative habits, weekly schedules, and migration of legacy
 * habits that lack the v2 fields.
 */

import type {
  Habit,
  HabitLog,
  HabitWithLog,
  HabitSchedule,
  TrackingType,
  WeekDay,
} from '../domain/habit.types';
import {
  dayOfWeekIso,
  isScheduledOn,
  WEEKDAY_LONG,
} from '../domain/habit.types';
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

// --- Local I/O ---

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

function habitsAdapter() {
  return createAdapter<Habit>('habits', DEFAULT_USER_ID);
}

function habitLogsAdapter() {
  return createAdapter<HabitLog>('habit_logs', DEFAULT_USER_ID);
}

// --- v1 → v2 migration ---

interface LegacyHabit {
  trackingType?: TrackingType;
  schedule?: HabitSchedule;
  reminderTimes?: string[];
  target?: number;
  unit?: string;
}

/**
 * Normalize a habit read from storage. Older versions don't have v2 fields;
 * we fill defaults so the rest of the app can assume they exist.
 * Idempotent.
 */
function normalizeHabit(raw: Habit & LegacyHabit): Habit {
  return {
    ...raw,
    trackingType: raw.trackingType ?? 'binary',
    target: raw.target,
    unit: raw.unit,
    schedule: raw.schedule ?? { type: 'daily' },
    reminderTimes: raw.reminderTimes ?? [],
  };
}

interface LegacyLog {
  progress?: number;
}

function normalizeLog(raw: HabitLog & LegacyLog): HabitLog {
  return {
    ...raw,
    progress: raw.progress ?? (raw.completed ? 1 : 0),
  };
}

// --- Habits CRUD ---

export function getHabits(): Habit[] {
  return readLocal<Habit & LegacyHabit>(STORAGE_KEYS.HABITS).map(normalizeHabit);
}

export function saveHabits(habits: Habit[]): void {
  writeLocal(STORAGE_KEYS.HABITS, habits);
}

export interface AddHabitInput {
  title: string;
  icon: string;
  xpReward: number;
  trackingType?: TrackingType;
  target?: number;
  unit?: string;
  schedule?: HabitSchedule;
  reminderTimes?: string[];
}

export function addHabit(data: AddHabitInput): Habit {
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
    trackingType: data.trackingType ?? 'binary',
    target: data.target,
    unit: data.unit,
    schedule: data.schedule ?? { type: 'daily' },
    reminderTimes: data.reminderTimes ?? [],
  };
  habits.push(habit);
  saveHabits(habits);
  habitsAdapter().add(habit).catch(console.error);
  return habit;
}

export function updateHabit(habitId: string, patch: Partial<Habit>): Habit | null {
  const habits = getHabits();
  const idx = habits.findIndex((h) => h.id === habitId);
  if (idx < 0) return null;
  const updated = { ...habits[idx], ...patch, id: habits[idx].id };
  habits[idx] = updated;
  saveHabits(habits);
  habitsAdapter().set(updated.id, updated).catch(console.error);
  return updated;
}

export function deleteHabit(habitId: string): void {
  const habits = getHabits().filter((h) => h.id !== habitId);
  saveHabits(habits);
  const logs = getHabitLogs().filter((l) => l.habitId !== habitId);
  saveHabitLogs(logs);
  habitsAdapter().delete(habitId).catch(console.error);
}

// --- Habit Logs ---

function getHabitLogs(): HabitLog[] {
  return readLocal<HabitLog & LegacyLog>(STORAGE_KEYS.HABIT_LOGS).map(normalizeLog);
}

function saveHabitLogs(logs: HabitLog[]): void {
  writeLocal(STORAGE_KEYS.HABIT_LOGS, logs);
}

function getLogForDate(habitId: string, date: string): HabitLog | undefined {
  return getHabitLogs().find((l) => l.habitId === habitId && l.date === date);
}

/**
 * Calculate streak by walking back from `currentDate` through scheduled days
 * only. v1 ignored schedule; v2 respects it so "lixo às terças" can have a
 * streak of "4 terças seguidas" without breaking on quartas.
 */
function calculateStreak(habit: Habit, currentDate: string): number {
  const completedDates = new Set(
    getHabitLogs()
      .filter((l) => l.habitId === habit.id && l.completed)
      .map((l) => l.date),
  );

  if (completedDates.size === 0) return 0;

  let streak = 0;
  const d = new Date(currentDate + 'T12:00:00');

  // Walk back day-by-day, counting only scheduled days.
  // Stop at the first scheduled day that wasn't completed.
  // Limit to 365 iterations as a safety belt.
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split('T')[0];
    const day = dayOfWeekIso(d);

    if (isScheduledOn(habit.schedule, day)) {
      if (completedDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

/**
 * Toggle (binary) or set progress (quantitative). For binary, flips completed.
 * For quantitative, prefer `incrementProgress` instead.
 */
export function toggleHabitForToday(habitId: string): {
  log: HabitLog;
  streak: number;
  wasCompleted: boolean;
} {
  const habit = getHabits().find((h) => h.id === habitId);
  if (!habit) throw new Error(`Habit ${habitId} not found`);

  const today = getTodayString();
  const logs = getHabitLogs();
  const idx = logs.findIndex((l) => l.habitId === habitId && l.date === today);

  let log: HabitLog;
  let wasCompleted: boolean;

  if (idx >= 0) {
    wasCompleted = !logs[idx].completed;
    logs[idx].completed = wasCompleted;
    logs[idx].completedAt = wasCompleted ? Date.now() : null;
    logs[idx].progress = wasCompleted ? (habit.target ?? 1) : 0;
    log = logs[idx];
  } else {
    wasCompleted = true;
    log = {
      id: generateId(),
      userId: DEFAULT_USER_ID,
      habitId,
      date: today,
      completed: true,
      progress: habit.target ?? 1,
      currentStreak: 0,
      longestStreak: 0,
      completedAt: Date.now(),
      xpAwarded: false,
    };
    logs.push(log);
  }

  saveHabitLogs(logs);

  const streak = wasCompleted ? calculateStreak(habit, today) : 0;
  log.currentStreak = streak;
  log.longestStreak = Math.max(log.longestStreak, streak);
  saveHabitLogs(logs);

  habitLogsAdapter().set(log.id, log).catch(console.error);

  return { log, streak, wasCompleted };
}

/**
 * Increment quantitative progress by `delta` (can be negative).
 * Auto-completes the habit when progress reaches the target.
 *
 * Returns the updated log AND whether the habit transitioned to completed
 * during this call — UI uses that to fire XP/toast effects exactly once.
 */
export function incrementProgress(
  habitId: string,
  delta: number,
): {
  log: HabitLog;
  streak: number;
  justCompleted: boolean;
} {
  const habit = getHabits().find((h) => h.id === habitId);
  if (!habit) throw new Error(`Habit ${habitId} not found`);

  const target = habit.target ?? 1;
  const today = getTodayString();
  const logs = getHabitLogs();
  const idx = logs.findIndex((l) => l.habitId === habitId && l.date === today);

  const existing = idx >= 0
    ? logs[idx]
    : ({
        id: generateId(),
        userId: DEFAULT_USER_ID,
        habitId,
        date: today,
        completed: false,
        progress: 0,
        currentStreak: 0,
        longestStreak: 0,
        completedAt: null,
        xpAwarded: false,
      } as HabitLog);

  const wasCompleted = existing.completed;
  const newProgress = Math.max(0, Math.min(target, existing.progress + delta));
  const nowCompleted = newProgress >= target;

  const updated: HabitLog = {
    ...existing,
    progress: newProgress,
    completed: nowCompleted,
    completedAt: nowCompleted && !wasCompleted ? Date.now() : existing.completedAt,
  };

  if (idx >= 0) logs[idx] = updated;
  else logs.push(updated);
  saveHabitLogs(logs);

  const streak = nowCompleted ? calculateStreak(habit, today) : 0;
  updated.currentStreak = streak;
  updated.longestStreak = Math.max(updated.longestStreak, streak);
  saveHabitLogs(logs);

  habitLogsAdapter().set(updated.id, updated).catch(console.error);

  return {
    log: updated,
    streak,
    justCompleted: nowCompleted && !wasCompleted,
  };
}

/**
 * Returns next scheduled day label (e.g., "terça") or null if daily.
 */
function nextScheduledLabel(habit: Habit, from: Date): string | null {
  if (habit.schedule.type === 'daily') return null;
  const days = habit.schedule.daysOfWeek ?? [];
  if (days.length === 0) return null;

  const todayDow = dayOfWeekIso(from);
  // Look up to 7 days ahead (skipping today).
  for (let offset = 1; offset <= 7; offset++) {
    const probe = ((todayDow - 1 + offset) % 7) + 1 as WeekDay;
    if (days.includes(probe)) return WEEKDAY_LONG[probe];
  }
  return null;
}

/**
 * Get every habit with today's log + scheduling metadata. Habits scheduled for
 * other days are still returned (UI decides to dim them).
 */
export function getHabitsWithLogs(): HabitWithLog[] {
  const habits = getHabits();
  const today = getTodayString();
  const todayDate = new Date(today + 'T12:00:00');
  const todayDow = dayOfWeekIso(todayDate);

  return habits.map((habit) => {
    const existingLog = getLogForDate(habit.id, today);
    const yesterdayStreak = calculateStreak(habit, getYesterdayString());
    const todayStreak = existingLog?.completed
      ? calculateStreak(habit, today)
      : yesterdayStreak;

    const log: HabitLog = existingLog ?? {
      id: '',
      userId: DEFAULT_USER_ID,
      habitId: habit.id,
      date: today,
      completed: false,
      progress: 0,
      currentStreak: todayStreak,
      longestStreak: todayStreak,
      completedAt: null,
      xpAwarded: false,
    };

    return {
      habit,
      log,
      streak: todayStreak,
      isScheduledToday: isScheduledOn(habit.schedule, todayDow),
      nextScheduledLabel: nextScheduledLabel(habit, todayDate),
    };
  });
}

/**
 * Mark a habit log as having awarded XP (prevents duplicates).
 */
export function markXPAwarded(habitId: string, date: string): void {
  const logs = getHabitLogs();
  const log = logs.find((l) => l.habitId === habitId && l.date === date);
  if (log) {
    log.xpAwarded = true;
    saveHabitLogs(logs);
    habitLogsAdapter().set(log.id, log).catch(console.error);
  }
}

/**
 * Check if every habit SCHEDULED for today is completed. Habits scheduled
 * for other days don't count.
 */
export function areAllHabitsCompleted(): boolean {
  const list = getHabitsWithLogs().filter((h) => h.isScheduledToday);
  if (list.length === 0) return false;
  return list.every((h) => h.log.completed);
}
