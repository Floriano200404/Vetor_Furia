'use client';

/**
 * useRoutines — reactive wrapper around the routines service.
 */

import { useCallback, useEffect, useState } from 'react';
import type { Routine, NewRoutineInput } from '../domain/workout-routine';
import { todayWeekDay } from '../domain/workout-routine';
import {
  getRoutines,
  addRoutine,
  updateRoutine,
  deleteRoutine,
} from '../services/routines.service';

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);

  const refresh = useCallback(() => {
    setRoutines(getRoutines());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const create = useCallback(
    (data: NewRoutineInput) => {
      addRoutine(data);
      refresh();
    },
    [refresh],
  );

  const update = useCallback(
    (id: string, patch: Partial<Routine>) => {
      updateRoutine(id, patch);
      refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    (id: string) => {
      deleteRoutine(id);
      refresh();
    },
    [refresh],
  );

  const today = todayWeekDay();
  const todayRoutines = routines.filter((r) => r.daysOfWeek.includes(today));

  return { routines, todayRoutines, create, update, remove, refresh };
}
