/**
 * Cardio Domain Types
 *
 * Cardio sessions are intentionally separate from `Workout` (strength) because
 * the user thinks of them as different activities and the metrics are
 * different: time + optional distance/calories vs. sets/reps/weight.
 */

export type CardioType =
  | 'corrida'
  | 'caminhada'
  | 'bike'
  | 'esteira'
  | 'natacao'
  | 'eliptico'
  | 'escada'
  | 'hiit'
  | 'outro';

export type CardioIntensity = 'leve' | 'moderada' | 'intensa';

export interface CardioCatalogItem {
  type: CardioType;
  label: string;
  icon: string;
  /** MET (metabolic equivalent) — used to estimate calories when omitted. */
  met: number;
}

export const CARDIO_CATALOG: ReadonlyArray<CardioCatalogItem> = [
  { type: 'corrida',  label: 'Corrida',    icon: '🏃', met: 8.0 },
  { type: 'caminhada', label: 'Caminhada', icon: '🚶', met: 3.5 },
  { type: 'bike',     label: 'Bike',       icon: '🚴', met: 7.5 },
  { type: 'esteira',  label: 'Esteira',    icon: '🏃‍♂️', met: 7.0 },
  { type: 'natacao',  label: 'Natação',    icon: '🏊', met: 8.5 },
  { type: 'eliptico', label: 'Elíptico',   icon: '🌀', met: 5.5 },
  { type: 'escada',   label: 'Escada',     icon: '🪜', met: 9.0 },
  { type: 'hiit',     label: 'HIIT',       icon: '⚡', met: 10.0 },
  { type: 'outro',    label: 'Outro',      icon: '💨', met: 6.0 },
];

export interface CardioSession {
  id: string;
  userId: string;
  type: CardioType;
  /** Optional override of label (free text for "outro" or custom names). */
  customName?: string;
  durationMinutes: number;
  /** Distance in km — optional, only meaningful for some types. */
  distanceKm?: number;
  /** User-entered or estimated. */
  caloriesKcal?: number;
  intensity: CardioIntensity;
  notes?: string;
  totalXP: number;
  date: number;
  createdAt: number;
}

export const INTENSITY_LABEL: Record<CardioIntensity, string> = {
  leve: 'Leve',
  moderada: 'Moderada',
  intensa: 'Intensa',
};

/** XP awarded per cardio minute, multiplied by intensity factor. */
const XP_PER_MINUTE: Record<CardioIntensity, number> = {
  leve: 0.5,
  moderada: 1,
  intensa: 1.5,
};

/** Bonus XP per km when distance was tracked (rewards effort). */
const XP_PER_KM = 5;

export function calculateCardioXP(
  durationMinutes: number,
  intensity: CardioIntensity,
  distanceKm?: number,
): number {
  if (durationMinutes <= 0) return 0;
  const base = Math.round(durationMinutes * XP_PER_MINUTE[intensity]);
  const distanceBonus = distanceKm && distanceKm > 0
    ? Math.round(distanceKm * XP_PER_KM)
    : 0;
  return base + distanceBonus;
}

/**
 * Estimate kcal burned using MET formula:
 *   kcal = MET × weightKg × (durationMinutes / 60)
 * Returns 0 when weight is unknown — caller should fall back to user input.
 */
export function estimateCalories(
  type: CardioType,
  durationMinutes: number,
  weightKg: number | null,
): number {
  if (!weightKg || weightKg <= 0 || durationMinutes <= 0) return 0;
  const item = CARDIO_CATALOG.find((c) => c.type === type);
  const met = item?.met ?? 6;
  return Math.round(met * weightKg * (durationMinutes / 60));
}
