/**
 * Habit Domain Types
 *
 * v2: hábitos agora podem ser quantitativos (target/unit), ter agenda
 * customizada (dias da semana) e horários de lembrete.
 *
 * Backwards-compat: dados antigos sem esses campos passam por `normalizeHabit`
 * no service e ganham defaults (binary + daily, sem reminder).
 */

export type TrackingType = 'binary' | 'quantitative';

export type ScheduleType = 'daily' | 'weekly';

/**
 * Days of week as ISO-ish numbers: 1=Mon, 2=Tue, ..., 7=Sun.
 * Aligns with `getDay()`-based logic via the helper `dayOfWeekIso()`.
 */
export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface HabitSchedule {
  type: ScheduleType;
  /** Required when type='weekly'. Empty array = never scheduled (invalid). */
  daysOfWeek?: WeekDay[];
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  icon: string;
  xpReward: number;
  isTemplate: boolean;
  order: number;
  createdAt: number;

  // v2 fields
  trackingType: TrackingType;
  /** Required when trackingType='quantitative'. e.g. 5 (litros). */
  target?: number;
  /** Required when trackingType='quantitative'. e.g. 'L', 'min', 'passos'. */
  unit?: string;
  schedule: HabitSchedule;
  /** HH:MM strings (24h). Empty means no reminder. */
  reminderTimes: string[];
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  /**
   * Quantitative progress towards `target`. For binary habits this stays 0
   * until completed = true (then it's 1).
   */
  progress: number;
  currentStreak: number;
  longestStreak: number;
  completedAt: number | null;
  xpAwarded: boolean;
}

export interface HabitWithLog {
  habit: Habit;
  log: HabitLog;
  streak: number;
  /** True when habit.schedule covers today; otherwise the card is dimmed. */
  isScheduledToday: boolean;
  /** Human-readable next day this habit is scheduled (e.g., "terça"). */
  nextScheduledLabel: string | null;
}

// --- Helpers used across hooks/UI ---

/**
 * Converts JS `Date.getDay()` (0=Sun..6=Sat) into our ISO numbering (1=Mon..7=Sun).
 */
export function dayOfWeekIso(date: Date): WeekDay {
  const js = date.getDay();
  return (js === 0 ? 7 : js) as WeekDay;
}

export const WEEKDAY_SHORT: Record<WeekDay, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom',
};

export const WEEKDAY_LONG: Record<WeekDay, string> = {
  1: 'segunda', 2: 'terça', 3: 'quarta', 4: 'quinta', 5: 'sexta', 6: 'sábado', 7: 'domingo',
};

export function isScheduledOn(schedule: HabitSchedule, day: WeekDay): boolean {
  if (schedule.type === 'daily') return true;
  return (schedule.daysOfWeek ?? []).includes(day);
}
