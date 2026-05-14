'use client';

/**
 * useWorkouts — Hook for workout management with XP integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { eventBus, XP_EVENTS } from '@/shared/events';
import type { Workout, Exercise } from '../domain/workout.types';
import { getWorkouts, addWorkout, deleteWorkout, calculateWorkoutXP } from '../services/health.service';
import { DEFAULT_USER_ID } from '@/lib/constants';

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const refresh = useCallback(() => {
    setWorkouts(getWorkouts());
  }, []);

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(); }, [refresh]);

  const handleAddWorkout = useCallback((data: {
    name: string;
    exercises: Exercise[];
    durationMinutes: number;
  }) => {
    const workout = addWorkout(data);

    eventBus.emit(XP_EVENTS.XP_EARNED, {
      userId: DEFAULT_USER_ID,
      amount: workout.totalXP,
      source: 'workouts' as const,
      sourceId: workout.id,
      description: `🏋️ ${workout.name} (${workout.exercises.length} exercícios)`,
      timestamp: Date.now(),
    });

    refresh();
    return workout;
  }, [refresh]);

  const handleDeleteWorkout = useCallback((id: string) => {
    deleteWorkout(id);
    refresh();
  }, [refresh]);

  return {
    workouts,
    addWorkout: handleAddWorkout,
    deleteWorkout: handleDeleteWorkout,
    refresh,
  };
}
