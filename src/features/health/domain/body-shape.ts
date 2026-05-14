/**
 * Body Shape Domain — discrete classifier for the biometric avatar.
 *
 * Goal: turn a Biometry record into one of 5 body shape "states" so the
 * BodyAvatar component knows which silhouette to render.
 *
 * IMPORTANT: this is a visual heuristic for gamification, NOT a medical
 * assessment. The thresholds favor visible body composition (BMI + BF%)
 * over strict clinical categories — e.g., a high-BMI lifter with low BF
 * lands in "forte", not "obesidade".
 */

import type { Biometry } from './biometry.types';

export type BodyShape = 'magro' | 'fit' | 'atletico' | 'forte' | 'volumoso';

export const BODY_SHAPE_LABELS: Record<BodyShape, string> = {
  magro: 'Magro',
  fit: 'Em Forma',
  atletico: 'Atlético',
  forte: 'Forte',
  volumoso: 'Volumoso',
};

export const BODY_SHAPE_DESCRIPTIONS: Record<BodyShape, string> = {
  magro: 'IMC abaixo do peso ideal. Foque em ganho de massa.',
  fit: 'Peso saudável. Boa base pra qualquer objetivo.',
  atletico: 'Composição corporal alinhada com performance.',
  forte: 'Alta massa muscular. Força em primeiro plano.',
  volumoso: 'Massa total elevada. Considere recomposição.',
};

/** BMI = weight (kg) / height (m)² */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function readBodyFat(biometry: Biometry): number | null {
  const raw = biometry.biomarkers?.body_fat;
  if (typeof raw === 'number' && raw > 0 && raw < 60) return raw;
  if (typeof raw === 'string') {
    const n = parseFloat(raw);
    if (!isNaN(n) && n > 0 && n < 60) return n;
  }
  return null;
}

/**
 * Decides which silhouette to show.
 *
 * Logic by tiers of BMI, refined by BF% when present:
 *  - BMI < 18.5  →  magro
 *  - BMI 18.5-23 →  fit (or atletico if very lean, BF < 12)
 *  - BMI 23-27   →  atletico (or fit if BF > 22, suggests soft body)
 *  - BMI 27-31   →  forte (low BF, muscle-led) or volumoso (high BF)
 *  - BMI >= 31   →  volumoso
 */
export function getBodyShape(biometry: Biometry | null): BodyShape {
  if (!biometry) return 'fit';

  const bmi = calculateBMI(biometry.weight, biometry.height);
  if (bmi === 0) return 'fit';

  const bf = readBodyFat(biometry);

  if (bmi < 18.5) return 'magro';

  if (bmi < 23) {
    if (bf !== null && bf < 12) return 'atletico';
    return 'fit';
  }

  if (bmi < 27) {
    if (bf !== null && bf > 22) return 'fit';
    return 'atletico';
  }

  if (bmi < 31) {
    if (bf !== null && bf < 18) return 'forte';
    return 'volumoso';
  }

  return 'volumoso';
}

/**
 * Returns the level-tier glow color. Used by BodyAvatar's outer ring.
 * Mirrors the XP tier progression so a high-level "magro" still looks "earned".
 */
export function getLevelTierColor(level: number): string {
  if (level >= 30) return '#fbbf24'; // gold (dragon tier)
  if (level >= 20) return '#a855f7'; // purple
  if (level >= 10) return '#06b6d4'; // cyan
  if (level >= 5) return '#10b981';  // green
  return '#94a3b8';                  // gray (novice)
}

/**
 * Convenience helper used by the temporal slider — returns the shape for an
 * arbitrary Biometry record (or 'fit' if invalid).
 */
export function getBodyShapeAt(record: Biometry | undefined): BodyShape {
  return getBodyShape(record ?? null);
}
