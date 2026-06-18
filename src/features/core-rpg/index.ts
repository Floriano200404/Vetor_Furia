export { XPBar } from './components/XPBar';
export { AvatarDisplay, getAvatarEmoji } from './components/AvatarDisplay';
export { LevelBadge } from './components/LevelBadge';
export { LevelUpModal } from './components/LevelUpModal';
export { HPBar } from './components/HPBar';
export { GoldDisplay } from './components/GoldDisplay';
export { ActivityHeatmap } from './components/ActivityHeatmap';
export { AttributeRadar } from './components/AttributeRadar';
export { AbilityPoints } from './components/AbilityPoints';
export {
  ATTRIBUTES,
  attributeForSource,
  attributeLevelFromXP,
  xpForAttributeLevel,
  buildBreakdown,
} from './domain/attributes';
export type { AttributeKey, AttributeDef, AttributeBreakdown } from './domain/attributes';
export { usePlayerStats } from './hooks/usePlayerStats';
export { calculatePlayerStats, calculateLevel, getAvatarStage } from './services/level-calculator';
export type { Player, PlayerStats } from './domain/player.types';
export type { XPEntry } from './domain/xp-ledger.types';
