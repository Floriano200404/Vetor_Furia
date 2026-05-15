'use client';

/**
 * useWorkoutDraft — manages the in-progress workout creation form.
 *
 * Owns: name, duration, exercises[], which row is expanded, optional rest-timer flag.
 * Exposes pure functions to mutate that draft. The host component is only
 * responsible for wiring submit and observing `isDirty` if needed.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Exercise } from '../domain/workout.types';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface WorkoutDraftState {
  name: string;
  durationMinutes: number;
  exercises: Exercise[];
  expandedExerciseId: string | null;
}

const EMPTY: WorkoutDraftState = {
  name: '',
  durationMinutes: 60,
  exercises: [],
  expandedExerciseId: null,
};

export interface UseWorkoutDraftReturn extends WorkoutDraftState {
  isDirty: boolean;
  isValid: boolean;
  estimatedXP: number;

  setName: (name: string) => void;
  setDuration: (mins: number) => void;
  setExercises: (exercises: Exercise[]) => void;
  setExpanded: (id: string | null) => void;

  addExercise: (name: string, muscleGroup: string, gifUrl?: string) => void;
  removeExercise: (id: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => void;
  toggleSetCompleted: (exerciseId: string, setIndex: number) => boolean;
  applyOverloadSuggestion: (exerciseId: string, weight: number, reps: number) => void;
  reset: () => void;
}

function calcXP(count: number): number {
  if (count <= 0) return 0;
  return 30 + Math.max(0, count - 1) * 2;
}

export function useWorkoutDraft(): UseWorkoutDraftReturn {
  const [draft, setDraft] = useState<WorkoutDraftState>(EMPTY);

  // Mirror for synchronous reads (e.g. toggleSetCompleted needs to know the
  // pre-toggle state and return a boolean BEFORE setDraft's updater runs).
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  });

  const setName = useCallback(
    (name: string) => setDraft((d) => ({ ...d, name })),
    [],
  );

  const setDuration = useCallback(
    (mins: number) => setDraft((d) => ({ ...d, durationMinutes: mins })),
    [],
  );

  const setExercises = useCallback(
    (exercises: Exercise[]) => setDraft((d) => ({ ...d, exercises })),
    [],
  );

  const setExpanded = useCallback(
    (id: string | null) => setDraft((d) => ({ ...d, expandedExerciseId: id })),
    [],
  );

  const addExercise = useCallback(
    (name: string, muscleGroup: string, gifUrl?: string) =>
      setDraft((d) => ({
        ...d,
        exercises: [
          ...d.exercises,
          {
            id: genId(),
            name,
            muscleGroup,
            gifUrl,
            sets: [{ reps: 12, weight: 0, completed: false }],
          },
        ],
      })),
    [],
  );

  const removeExercise = useCallback(
    (id: string) =>
      setDraft((d) => ({
        ...d,
        exercises: d.exercises.filter((e) => e.id !== id),
        expandedExerciseId: d.expandedExerciseId === id ? null : d.expandedExerciseId,
      })),
    [],
  );

  const addSet = useCallback(
    (exerciseId: string) =>
      setDraft((d) => ({
        ...d,
        exercises: d.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          const last = e.sets.at(-1);
          return {
            ...e,
            sets: [
              ...e.sets,
              {
                reps: last?.reps ?? 12,
                weight: last?.weight ?? 0,
                completed: false,
              },
            ],
          };
        }),
      })),
    [],
  );

  const updateSet = useCallback(
    (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) =>
      setDraft((d) => ({
        ...d,
        exercises: d.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          const sets = [...e.sets];
          sets[setIndex] = { ...sets[setIndex], [field]: value };
          return { ...e, sets };
        }),
      })),
    [],
  );

  /**
   * Toggles set completion. Returns `true` if the set was JUST completed
   * (so the caller can trigger side effects like opening the rest timer).
   *
   * We read the current state via `draftRef` BEFORE calling setDraft because
   * setState's updater is async — relying on a side-effect-write inside the
   * updater to inform the return value is unreliable (React 19 strict mode
   * may even invoke the updater twice). The ref gives us a synchronous read.
   */
  const toggleSetCompleted = useCallback(
    (exerciseId: string, setIndex: number): boolean => {
      const ex = draftRef.current.exercises.find((e) => e.id === exerciseId);
      const wasCompleted = ex?.sets[setIndex]?.completed ?? false;
      const becameCompleted = !wasCompleted;

      setDraft((d) => ({
        ...d,
        exercises: d.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          const sets = [...e.sets];
          sets[setIndex] = { ...sets[setIndex], completed: becameCompleted };
          return { ...e, sets };
        }),
      }));

      return becameCompleted;
    },
    [],
  );

  const applyOverloadSuggestion = useCallback(
    (exerciseId: string, weight: number, reps: number) =>
      setDraft((d) => ({
        ...d,
        exercises: d.exercises.map((e) =>
          e.id === exerciseId
            ? { ...e, sets: e.sets.map((s) => ({ ...s, weight, reps })) }
            : e,
        ),
      })),
    [],
  );

  const reset = useCallback(() => setDraft(EMPTY), []);

  const isDirty =
    draft.name.trim() !== '' ||
    draft.exercises.length > 0 ||
    draft.durationMinutes !== EMPTY.durationMinutes;

  const isValid = draft.name.trim() !== '' && draft.exercises.length > 0;
  const estimatedXP = calcXP(draft.exercises.length);

  return {
    ...draft,
    isDirty,
    isValid,
    estimatedXP,
    setName,
    setDuration,
    setExercises,
    setExpanded,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    toggleSetCompleted,
    applyOverloadSuggestion,
    reset,
  };
}
