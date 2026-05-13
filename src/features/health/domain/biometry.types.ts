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
  { key: 'glicose', label: 'Glicose (mg/dL)', type: 'number' },
  { key: 'colesterol_total', label: 'Colesterol Total (mg/dL)', type: 'number' },
  { key: 'hdl', label: 'HDL (mg/dL)', type: 'number' },
  { key: 'ldl', label: 'LDL (mg/dL)', type: 'number' },
  { key: 'triglicerideos', label: 'Triglicerídeos (mg/dL)', type: 'number' },
  { key: 'hemoglobina', label: 'Hemoglobina (g/dL)', type: 'number' },
  { key: 'vitamina_d', label: 'Vitamina D (ng/mL)', type: 'number' },
  { key: 'testosterona', label: 'Testosterona (ng/dL)', type: 'number' },
] as const;
