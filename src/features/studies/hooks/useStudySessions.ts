'use client';
import { useState, useEffect, useCallback } from 'react';
import { eventBus, XP_EVENTS } from '@/shared/events';
import type { StudySession } from '../domain/study.types';
import { getSessions, addSession, deleteSession } from '../services/studies.service';
import { DEFAULT_USER_ID } from '@/lib/constants';

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const refresh = useCallback(() => setSessions(getSessions()), []);
  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(); }, [refresh]);

  const handleAdd = useCallback((data: { subject: string; durationMinutes: number; markdownNotes: string; startedAt: number }) => {
    const session = addSession(data);
    if (session.xpEarned > 0) {
      eventBus.emit(XP_EVENTS.XP_EARNED, {
        userId: DEFAULT_USER_ID,
        amount: session.xpEarned,
        source: 'studies' as const,
        sourceId: session.id,
        description: `📖 ${session.subject} (${session.durationMinutes}min)`,
        timestamp: Date.now(),
      });
    }
    refresh();
    return session;
  }, [refresh]);

  const handleDelete = useCallback((id: string) => { deleteSession(id); // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(); }, [refresh]);

  return { sessions, addSession: handleAdd, deleteSession: handleDelete, refresh };
}
