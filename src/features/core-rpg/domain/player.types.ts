/**
 * Core RPG Domain Types — Player, Level, Avatar
 */

export interface Player {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  totalXP: number;
  level: number;
  avatarStage: number;
  hp: number;
  maxHp: number;
  gold: number;
  createdAt: number;
  updatedAt: number;
}

export interface PlayerStats {
  displayName: string;
  totalXP: number;
  level: number;
  avatarStage: string;
  avatarSprite: string;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number; // 0-1 (percentage within current level)
  levelTitle: string;
  hp: number;
  maxHp: number;
  gold: number;
}

export type AvatarStage = 1 | 2 | 3 | 4 | 5;
