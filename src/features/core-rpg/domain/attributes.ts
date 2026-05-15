/**
 * Attributes (Skill Tree) — RPG-style breakdown of accumulated XP.
 *
 * Each action category in the app maps to one of 5 attributes:
 *
 *   Força (Strength)       — musculação (workouts)
 *   Constituição (Stamina) — cardio
 *   Inteligência (Intel)   — estudos (studies)
 *   Disciplina (Discipline) — hábitos (habits)
 *   Vitalidade (Vitality)  — biometria + bonus de saúde
 *
 * Bonus XP is distributed to Disciplina (the meta-virtue of doing the work).
 */

import type { XPSource } from '@/shared/events';

export type AttributeKey =
  | 'forca'
  | 'constituicao'
  | 'inteligencia'
  | 'disciplina'
  | 'vitalidade';

export interface AttributeDef {
  key: AttributeKey;
  label: string;
  short: string; // 3-letter abbreviation for the radar
  icon: string; // emoji
  color: string; // CSS color
  description: string;
}

export const ATTRIBUTES: AttributeDef[] = [
  {
    key: 'forca',
    label: 'Força',
    short: 'FOR',
    icon: '💪',
    color: '#ef4444',
    description: 'Acumulado de musculação. Cresce com cada série pesada.',
  },
  {
    key: 'constituicao',
    label: 'Constituição',
    short: 'CON',
    icon: '🫁',
    color: '#06b6d4',
    description: 'Resistência cardiovascular. Cresce com cardio.',
  },
  {
    key: 'inteligencia',
    label: 'Inteligência',
    short: 'INT',
    icon: '🧠',
    color: '#a855f7',
    description: 'Foco mental. Cresce com sessões de estudo.',
  },
  {
    key: 'disciplina',
    label: 'Disciplina',
    short: 'DIS',
    icon: '⚡',
    color: '#f59e0b',
    description: 'Consistência diária. Cresce com hábitos completos.',
  },
  {
    key: 'vitalidade',
    label: 'Vitalidade',
    short: 'VIT',
    icon: '❤️',
    color: '#10b981',
    description: 'Saúde geral. Cresce com biometria em dia.',
  },
];

const SOURCE_TO_ATTRIBUTE: Record<XPSource, AttributeKey> = {
  workouts: 'forca',
  cardio: 'constituicao',
  studies: 'inteligencia',
  habits: 'disciplina',
  biometry: 'vitalidade',
  bonus: 'disciplina', // bonuses celebrate consistency
};

export function attributeForSource(source: XPSource): AttributeKey {
  return SOURCE_TO_ATTRIBUTE[source];
}

/**
 * Levels scale similar to player level but on a per-attribute axis.
 * Quadratic-ish so early levels come fast, later ones earned.
 *   xpForLevel(n) = 50 * n * (n - 1) / 2   →   L1=0, L2=50, L3=150, L4=300, L5=500...
 */
export function xpForAttributeLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor((50 * level * (level - 1)) / 2);
}

export function attributeLevelFromXP(xp: number): number {
  if (xp <= 0) return 1;
  let level = 1;
  while (xpForAttributeLevel(level + 1) <= xp) level++;
  return level;
}

export interface AttributeBreakdown {
  key: AttributeKey;
  xp: number;
  level: number;
  xpInLevel: number;
  xpForNext: number;
  progress: number; // 0..1
}

export function buildBreakdown(
  xpBySource: Record<XPSource, number>,
): AttributeBreakdown[] {
  // Reduce sources → attribute keys
  const xpByAttr: Record<AttributeKey, number> = {
    forca: 0,
    constituicao: 0,
    inteligencia: 0,
    disciplina: 0,
    vitalidade: 0,
  };

  for (const [source, xp] of Object.entries(xpBySource) as Array<[XPSource, number]>) {
    const attr = SOURCE_TO_ATTRIBUTE[source];
    if (attr) xpByAttr[attr] += xp;
  }

  return ATTRIBUTES.map((def) => {
    const xp = xpByAttr[def.key];
    const level = attributeLevelFromXP(xp);
    const xpStart = xpForAttributeLevel(level);
    const xpNext = xpForAttributeLevel(level + 1);
    const xpInLevel = xp - xpStart;
    const xpForNext = xpNext - xpStart;
    return {
      key: def.key,
      xp,
      level,
      xpInLevel,
      xpForNext,
      progress: xpForNext > 0 ? xpInLevel / xpForNext : 1,
    };
  });
}
