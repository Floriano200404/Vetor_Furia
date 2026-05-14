/**
 * Level Calculator — pure functions for level system.
 * Level = floor(0.3 × √totalXP) + 1
 */

import { LEVEL_CONFIG, AVATAR_STAGES } from '@/lib/constants';
import type { Player, PlayerStats } from '../domain/player.types';

/**
 * Calculate player level from total XP.
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(LEVEL_CONFIG.SCALE_FACTOR * Math.sqrt(totalXP)) + LEVEL_CONFIG.MIN_LEVEL;
}

/**
 * Calculate total XP needed to reach a given level.
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.ceil(Math.pow((level - 1) / LEVEL_CONFIG.SCALE_FACTOR, 2));
}

/**
 * Get avatar stage based on current level.
 */
export function getAvatarStage(level: number) {
  let current = AVATAR_STAGES[0];
  for (const stage of AVATAR_STAGES) {
    if (level >= stage.minLevel) {
      current = stage;
    }
  }
  return current;
}

/**
 * Calculate full player stats from player object.
 */
export function calculatePlayerStats(player: Player): PlayerStats {
  const level = calculateLevel(player.totalXP);
  const avatarStageConfig = getAvatarStage(level);
  
  const xpForCurrentLevel = xpRequiredForLevel(level);
  const xpForNextLevel = xpRequiredForLevel(level + 1);
  const xpInCurrentLevel = player.totalXP - xpForCurrentLevel;
  const xpRangeForLevel = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = xpRangeForLevel > 0 ? Math.min(xpInCurrentLevel / xpRangeForLevel, 1) : 0;

  return {
    displayName: player.displayName,
    totalXP: player.totalXP,
    level,
    avatarStage: avatarStageConfig.name,
    avatarSprite: avatarStageConfig.sprite,
    xpForCurrentLevel,
    xpForNextLevel,
    xpProgress,
    levelTitle: avatarStageConfig.name,
    hp: player.hp,
    maxHp: player.maxHp,
    gold: player.gold,
  };
}
