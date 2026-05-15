'use client';

/**
 * useHabits — Hook for habit management with XP event integration.
 *
 * v2:
 * - Counts complete/total only among habits scheduled for today
 * - Exposes incrementProgress for quantitative habits
 * - Emits XP/Gold whether completion came from a toggle OR an increment
 */

import { useState, useEffect, useCallback } from 'react';
import { eventBus, XP_EVENTS, GAME_EVENTS } from '@/shared/events';
import type { XPEarnedPayload } from '@/shared/events';
import type { HabitWithLog } from '../domain/habit.types';
import {
  getHabitsWithLogs,
  addHabit,
  updateHabit,
  deleteHabit,
  toggleHabitForToday,
  incrementProgress,
  areAllHabitsCompleted,
  markXPAwarded,
  type AddHabitInput,
} from '../services/habits.service';
import { XP_REWARDS, DEFAULT_USER_ID } from '@/lib/constants';

export function useHabits() {
  const [habitsWithLogs, setHabitsWithLogs] = useState<HabitWithLog[]>([]);
  const [allBonusGiven, setAllBonusGiven] = useState(false);

  const refresh = useCallback(() => {
    setHabitsWithLogs(getHabitsWithLogs());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const handleAddHabit = useCallback((data: AddHabitInput) => {
    addHabit(data);
    refresh();
  }, [refresh]);

  const handleUpdateHabit = useCallback((id: string, patch: Parameters<typeof updateHabit>[1]) => {
    updateHabit(id, patch);
    refresh();
  }, [refresh]);

  const handleDeleteHabit = useCallback((habitId: string) => {
    deleteHabit(habitId);
    refresh();
  }, [refresh]);

  /**
   * Common path triggered when a habit transitions to completed — emits XP
   * (with streak bonus) and Gold, and fires the "all completed" bonus once.
   */
  const handleCompletion = useCallback((habitId: string, streak: number) => {
    const habitWithLog = habitsWithLogs.find((h) => h.habit.id === habitId);
    if (!habitWithLog) return;

    const today = new Date().toISOString().split('T')[0];
    markXPAwarded(habitId, today);

    const streakBonus = Math.min(
      streak * XP_REWARDS.HABIT_STREAK_BONUS_PER_DAY,
      XP_REWARDS.HABIT_STREAK_BONUS_CAP,
    );
    const xpAmount = habitWithLog.habit.xpReward + streakBonus;

    const description = streakBonus > 0
      ? `${habitWithLog.habit.icon} ${habitWithLog.habit.title} (+${streakBonus} streak)`
      : `${habitWithLog.habit.icon} ${habitWithLog.habit.title}`;

    const payload: XPEarnedPayload = {
      userId: DEFAULT_USER_ID,
      amount: xpAmount,
      source: 'habits',
      sourceId: habitId,
      description,
      timestamp: Date.now(),
    };
    eventBus.emit(XP_EVENTS.XP_EARNED, payload);

    eventBus.emit(GAME_EVENTS.GOLD_EARNED, {
      userId: DEFAULT_USER_ID,
      amount: 5,
      source: `Hábito: ${habitWithLog.habit.title}`,
    });

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
        eventBus.emit(GAME_EVENTS.GOLD_EARNED, {
          userId: DEFAULT_USER_ID,
          amount: 20,
          source: 'Bônus: Todos hábitos completos',
        });
      }
    }, 300);
  }, [habitsWithLogs, allBonusGiven, refresh]);

  const handleToggle = useCallback((habitId: string) => {
    const { log, streak, wasCompleted } = toggleHabitForToday(habitId);
    if (wasCompleted && !log.xpAwarded) {
      handleCompletion(habitId, streak);
    }
    refresh();
  }, [handleCompletion, refresh]);

  const handleIncrement = useCallback((habitId: string, delta: number) => {
    const { log, streak, justCompleted } = incrementProgress(habitId, delta);
    if (justCompleted && !log.xpAwarded) {
      handleCompletion(habitId, streak);
    }
    refresh();
  }, [handleCompletion, refresh]);

  // Scheduled-only stats — "fora do dia" não conta no progresso de hoje.
  const todayHabits = habitsWithLogs.filter((h) => h.isScheduledToday);
  const completedCount = todayHabits.filter((h) => h.log.completed).length;
  const totalCount = todayHabits.length;
  const completionRate = totalCount > 0 ? completedCount / totalCount : 0;

  return {
    habitsWithLogs,
    todayHabits,
    completedCount,
    totalCount,
    completionRate,
    addHabit: handleAddHabit,
    updateHabit: handleUpdateHabit,
    deleteHabit: handleDeleteHabit,
    toggleHabit: handleToggle,
    incrementHabit: handleIncrement,
    refresh,
  };
}
