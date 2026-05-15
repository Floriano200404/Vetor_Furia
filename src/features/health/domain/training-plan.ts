/**
 * Training Plan — a fixed weekly split (Mon..Sun → workout focus).
 * Persisted in localStorage; purely a planning aid, no XP attached.
 */

export type PlanFocus =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'fullbody'
  | 'cardio'
  | 'descanso';

export interface PlanFocusDef {
  key: PlanFocus;
  label: string;
  icon: string;
  color: string;
}

export const PLAN_FOCUSES: PlanFocusDef[] = [
  { key: 'push', label: 'Push', icon: '💪', color: '#ef4444' },
  { key: 'pull', label: 'Pull', icon: '🔙', color: '#06b6d4' },
  { key: 'legs', label: 'Legs', icon: '🦵', color: '#10b981' },
  { key: 'upper', label: 'Superior', icon: '🫀', color: '#a855f7' },
  { key: 'lower', label: 'Inferior', icon: '🦿', color: '#f59e0b' },
  { key: 'fullbody', label: 'Full Body', icon: '🔥', color: '#7c3aed' },
  { key: 'cardio', label: 'Cardio', icon: '🫁', color: '#06b6d4' },
  { key: 'descanso', label: 'Descanso', icon: '😴', color: '#475569' },
];

export function focusDef(key: PlanFocus): PlanFocusDef {
  return PLAN_FOCUSES.find((f) => f.key === key) ?? PLAN_FOCUSES[PLAN_FOCUSES.length - 1];
}

/** Map of WeekDay (1=Mon..7=Sun) → focus. */
export type WeeklyPlan = Record<number, PlanFocus>;

const STORAGE_KEY = 'vetor_furia_training_plan';

const DEFAULT_PLAN: WeeklyPlan = {
  1: 'push',
  2: 'pull',
  3: 'legs',
  4: 'descanso',
  5: 'push',
  6: 'cardio',
  7: 'descanso',
};

export function getTrainingPlan(): WeeklyPlan {
  if (typeof window === 'undefined') return { ...DEFAULT_PLAN };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PLAN };
    const parsed = JSON.parse(raw) as WeeklyPlan;
    // Backfill any missing day with rest.
    const plan: WeeklyPlan = { ...DEFAULT_PLAN, ...parsed };
    return plan;
  } catch {
    return { ...DEFAULT_PLAN };
  }
}

export function saveTrainingPlan(plan: WeeklyPlan): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }
}

/** Today's focus using ISO weekday (1=Mon..7=Sun). */
export function todaysFocus(plan: WeeklyPlan, date = new Date()): PlanFocus {
  const js = date.getDay();
  const iso = js === 0 ? 7 : js;
  return plan[iso] ?? 'descanso';
}
