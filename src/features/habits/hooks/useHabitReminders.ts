'use client';

/**
 * useHabitReminders — polls every minute and fires reminders whose time has
 * come for habits scheduled today. Dispatches both a browser Notification
 * (if permission granted) and an in-app toast.
 *
 * Side-effect-only hook — returns nothing. Mount once at the top of the
 * Habits page (or root of the dashboard).
 */

import { useEffect, useRef } from 'react';
import { useToast } from '@/shared/components/Toast';
import type { HabitWithLog } from '../domain/habit.types';
import {
  dispatchReminder,
  fireKeyFor,
  getPermissionState,
  hasAlreadyFired,
  markFired,
  pendingReminders,
} from '../services/notifications.service';

const POLL_MS = 30_000; // every 30s — covers minute boundaries with margin

export function useHabitReminders(habitsWithLogs: HabitWithLog[]) {
  const toast = useToast();
  // Mirror habits in a ref so the interval callback always sees fresh data
  // without recreating the interval on every render. The ref is refreshed
  // via a passive effect (runs after commit, not during render).
  const dataRef = useRef(habitsWithLogs);
  useEffect(() => {
    dataRef.current = habitsWithLogs;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tick = () => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const permission = getPermissionState();

      for (const hw of dataRef.current) {
        // Only fire for habits that are scheduled today and not yet completed.
        if (!hw.isScheduledToday || hw.log.completed) continue;
        const pending = pendingReminders(hw.habit, now);
        for (const time of pending) {
          const key = fireKeyFor(hw.habit.id, time, dateStr);
          if (hasAlreadyFired(key)) continue;
          markFired(key);

          const fired = permission === 'granted'
            ? dispatchReminder(hw.habit, time)
            : false;

          // Always show in-app toast as a fallback; for granted, both fire.
          toast.info(
            `${hw.habit.icon} ${hw.habit.title}${fired ? '' : ' — lembrete'}`,
          );
        }
      }
    };

    // Run once immediately so reminders due "just now" don't wait 30s.
    tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [toast]);
}
