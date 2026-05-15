'use client';

/**
 * useCardio — hook for cardio sessions with XP integration.
 */

import { useCallback, useEffect, useState } from 'react';
import { eventBus, XP_EVENTS } from '@/shared/events';
import { DEFAULT_USER_ID } from '@/lib/constants';
import type { CardioSession } from '../domain/cardio.types';
import {
  addCardioSession,
  deleteCardioSession,
  getCardioSessions,
  getWeeklyCardioMinutes,
  getTotalCardioMinutes,
  type AddCardioInput,
} from '../services/cardio.service';

export function useCardio() {
  const [sessions, setSessions] = useState<CardioSession[]>([]);

  const refresh = useCallback(() => {
    setSessions(getCardioSessions());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const handleAdd = useCallback(
    (input: AddCardioInput) => {
      const session = addCardioSession(input);
      eventBus.emit(XP_EVENTS.XP_EARNED, {
        userId: DEFAULT_USER_ID,
        amount: session.totalXP,
        source: 'workouts' as const,
        sourceId: session.id,
        description: `💨 Cardio (${session.type}, ${session.durationMinutes}min)`,
        timestamp: Date.now(),
      });
      refresh();
      return session;
    },
    [refresh],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteCardioSession(id);
      refresh();
    },
    [refresh],
  );

  return {
    sessions,
    weeklyMinutes: getWeeklyCardioMinutes(),
    totalMinutes: getTotalCardioMinutes(),
    addSession: handleAdd,
    deleteSession: handleDelete,
    refresh,
  };
}
