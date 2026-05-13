'use client';

/**
 * useHabits — Hook for habit management with XP event integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { eventBus, XP_EVENTS } from '@/shared/events';
import type { XPEarnedPayload } from '@/shared/events';
import type { HabitWithLog } from '../domain/habit.types';
import {
  getHabitsWithLogs,
  addHabit,
  deleteHabit,
  toggleHabitForToday,
  areAllHabitsCompleted,
} from '../services/habits.service';
import { XP_REWARDS, DEFAULT_USER_ID } from '@/lib/constants';

export function useHabits() {
  const [habitsWithLogs, setHabitsWithLogs] = useState<HabitWithLog[]>([]);
  const [allBonusGiven, setAllBonusGiven] = useState(false);

  const refresh = useCallback(() => {
    setHabitsWithLogs(getHabitsWithLogs());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddHabit = useCallback((data: { title: string; icon: string; xpReward: number }) => {
    addHabit(data);
    refresh();
  }, [refresh]);

  const handleDeleteHabit = useCallback((habitId: string) => {
    deleteHabit(habitId);
    refresh();
  }, [refresh]);

  const handleToggle = useCallback((habitId: string) => {
    const { log, streak, wasCompleted } = toggleHabitForToday(habitId);
    
    if (wasCompleted) {
      // Find the habit to get XP reward
      const habitWithLog = habitsWithLogs.find((h) => h.habit.id === habitId);
      if (!habitWithLog) return;

      // Calculate XP with streak bonus
      let xpAmount = habitWithLog.habit.xpReward;
      const streakBonus = Math.min(
        streak * XP_REWARDS.HABIT_STREAK_BONUS_PER_DAY,
        XP_REWARDS.HABIT_STREAK_BONUS_CAP
      );
      xpAmount += streakBonus;

      const description = streakBonus > 0
        ? `${habitWithLog.habit.icon} ${habitWithLog.habit.title} (+${streakBonus} streak)`
        : `${habitWithLog.habit.icon} ${habitWithLog.habit.title}`;

      // Emit XP event
      const payload: XPEarnedPayload = {
        userId: DEFAULT_USER_ID,
        amount: xpAmount,
        source: 'habits',
        sourceId: habitId,
        description,
        timestamp: Date.now(),
      };
      eventBus.emit(XP_EVENTS.XP_EARNED, payload);

      // Check if all completed for bonus
      refresh();
      setTimeout(() => {
        if (areAllHabitsCompleted() && !allBonusGiven) {
          setAllBonusGiven(true);
          eventBus.emit(XP_EVENTS.XP_EARNED, {
            userId: DEFAULT_USER_ID,
            amount: XP_REWARDS.HABIT_ALL_COMPLETE_BONUS,
            source: 'bonus' as const,
            sourceId: 'all-habits-complete',
            description: '🏆 Todos os hábitos completos!',
            timestamp: Date.now(),
          });
        }
      }, 300);
    }

    refresh();
  }, [habitsWithLogs, allBonusGiven, refresh]);

  const completedCount = habitsWithLogs.filter((h) => h.log.completed).length;
  const totalCount = habitsWithLogs.length;
  const completionRate = totalCount > 0 ? completedCount / totalCount : 0;

  return {
    habitsWithLogs,
    completedCount,
    totalCount,
    completionRate,
    addHabit: handleAddHabit,
    deleteHabit: handleDeleteHabit,
    toggleHabit: handleToggle,
    refresh,
  };
}
