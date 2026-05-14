/**
 * Biometry Domain Types
 */

export interface Biometry {
  id: string;
  userId: string;
  weight: number; // kg
  height: number; // cm
  biomarkers: Record<string, number | string>; // flexible JSON
  measuredAt: number;
}

export const DEFAULT_BIOMARKERS = [
  { key: 'glicose', label: 'Glicose', unit: 'mg/dL', type: 'number', normalMin: 70, normalMax: 100 },
  { key: 'colesterol_total', label: 'Colesterol Total', unit: 'mg/dL', type: 'number', normalMin: 0, normalMax: 200 },
  { key: 'hdl', label: 'HDL', unit: 'mg/dL', type: 'number', normalMin: 40, normalMax: 999 },
  { key: 'ldl', label: 'LDL', unit: 'mg/dL', type: 'number', normalMin: 0, normalMax: 130 },
  { key: 'triglicerideos', label: 'Triglicerídeos', unit: 'mg/dL', type: 'number', normalMin: 0, normalMax: 150 },
  { key: 'hemoglobina', label: 'Hemoglobina', unit: 'g/dL', type: 'number', normalMin: 13, normalMax: 17 },
  { key: 'vitamina_d', label: 'Vitamina D', unit: 'ng/mL', type: 'number', normalMin: 30, normalMax: 100 },
  { key: 'testosterona', label: 'Testosterona', unit: 'ng/dL', type: 'number', normalMin: 300, normalMax: 1000 },
] as const;

/**
 * Classify a biomarker value against its reference range.
 */
export function classifyBiomarker(
  key: string,
  value: number | string
): { status: 'normal' | 'warning' | 'high'; emoji: string; color: string } {
  const marker = DEFAULT_BIOMARKERS.find(m => m.key === key);
  if (!marker || typeof value !== 'number') {
    return { status: 'normal', emoji: '⚪', color: 'var(--text-muted)' };
  }
  if (value < marker.normalMin) {
    return { status: 'warning', emoji: '🟡', color: '#f59e0b' };
  }
  if (value > marker.normalMax) {
    return { status: 'high', emoji: '🔴', color: '#ef4444' };
  }
  return { status: 'normal', emoji: '🟢', color: '#10b981' };
}

