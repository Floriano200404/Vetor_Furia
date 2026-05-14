/**
 * Definição dos eventos de XP — contrato público entre módulos.
 * Qualquer módulo pode emitir XP_EARNED; o Core RPG consome.
 */

export const XP_EVENTS = {
  XP_EARNED: 'XP_EARNED',
  LEVEL_UP: 'LEVEL_UP',
} as const;

export const GAME_EVENTS = {
  HP_DAMAGE: 'HP_DAMAGE',
  HP_HEALED: 'HP_HEALED',
  GOLD_EARNED: 'GOLD_EARNED',
  GOLD_SPENT: 'GOLD_SPENT',
} as const;

export type XPSource = 'habits' | 'workouts' | 'studies' | 'biometry' | 'bonus';

export interface XPEarnedPayload {
  userId: string;
  amount: number;
  source: XPSource;
  sourceId: string;
  description: string;
  timestamp: number;
}

export interface LevelUpPayload {
  userId: string;
  previousLevel: number;
  newLevel: number;
  previousAvatarStage: number;
  newAvatarStage: number;
  totalXP: number;
}

export interface HPDamagePayload {
  userId: string;
  amount: number;
  reason: string;
  sourceId: string;
}

export interface HPHealedPayload {
  userId: string;
  amount: number;
  reason: string;
}

export interface GoldEarnedPayload {
  userId: string;
  amount: number;
  source: string;
}

export interface GoldSpentPayload {
  userId: string;
  amount: number;
  item: string;
}
