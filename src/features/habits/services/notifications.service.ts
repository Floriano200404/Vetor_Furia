/**
 * Notifications Service — in-app reminders using the Web Notifications API.
 *
 * Scope: this works only while the app/PWA is open. Background push (when the
 * browser is closed) would need Service Worker + Push API + a backend (e.g.,
 * Firebase Cloud Messaging) — deliberately out of this layer.
 *
 * The hook `useHabitReminders` is responsible for *when* to fire; this service
 * exposes *how* to fire (permission + dispatch) and a deduplication helper so
 * we don't ring the same reminder twice in a single minute.
 */

import type { Habit } from '../domain/habit.types';

export type NotificationPermissionState =
  | 'default'
  | 'granted'
  | 'denied'
  | 'unsupported';

export function getPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Asks the browser for permission. Resolves to the new state.
 * Safe to call any number of times — browsers cache the answer.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  const result = await Notification.requestPermission();
  return result as NotificationPermissionState;
}

/**
 * Dedup key: habit id + reminder time + today's date.
 * Stored in sessionStorage so it resets on a fresh app open but stays during
 * a single user session — exactly the behavior we want.
 */
const DEDUP_KEY = 'vetor_furia_reminders_fired';

function loadFiredSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(DEDUP_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveFiredSet(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DEDUP_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Quota or private-mode failure — silently ignore, dedup just doesn't persist.
  }
}

export function fireKeyFor(habitId: string, time: string, dateStr: string): string {
  return `${dateStr}|${habitId}|${time}`;
}

export function hasAlreadyFired(key: string): boolean {
  return loadFiredSet().has(key);
}

export function markFired(key: string): void {
  const set = loadFiredSet();
  set.add(key);
  saveFiredSet(set);
}

/**
 * Dispatch a reminder. Returns true if a Notification was created.
 * Even if permission isn't granted, the function "succeeds" silently so
 * the caller can still rely on an in-app toast.
 */
export function dispatchReminder(habit: Habit, time: string): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const n = new Notification(`${habit.icon} ${habit.title}`, {
      body: `Lembrete das ${time} · +${habit.xpReward} XP ao completar`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `habit-${habit.id}-${time}`,
      requireInteraction: false,
      silent: false,
    });
    // Click brings the app forward.
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (e) {
    console.warn('[notifications] dispatch failed', e);
    return false;
  }
}

/**
 * Convenience: given a habit and "now", returns reminder times that should
 * fire — i.e., currently within `windowMinutes` of now and not yet fired today.
 *
 * The window approach handles browsers that swallow setInterval for a few
 * seconds; we'd rather fire late by a minute than skip.
 */
export function pendingReminders(
  habit: Habit,
  now: Date,
  windowMinutes = 1,
): string[] {
  const dateStr = now.toISOString().split('T')[0];
  const out: string[] = [];

  for (const time of habit.reminderTimes ?? []) {
    const [hh, mm] = time.split(':').map((x) => parseInt(x, 10));
    if (isNaN(hh) || isNaN(mm)) continue;

    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    const diffMin = (now.getTime() - target.getTime()) / 60_000;

    if (diffMin >= 0 && diffMin < windowMinutes) {
      const key = fireKeyFor(habit.id, time, dateStr);
      if (!hasAlreadyFired(key)) {
        out.push(time);
      }
    }
  }

  return out;
}
