'use client';

/**
 * HunterRankBadge — selo de Rank de Caçador (E→S), estilo Solo Leveling.
 */

import type { CSSProperties } from 'react';
import { getHunterRank } from '../domain/hunter-rank';
import styles from './HunterRankBadge.module.css';

export function HunterRankBadge({ level }: { level: number }) {
  const hr = getHunterRank(level);
  return (
    <div
      className={styles.badge}
      style={{ '--rank': hr.color } as CSSProperties}
      title={hr.label}
      aria-label={hr.label}
    >
      <span className={styles.tag}>RANK</span>
      <span className={styles.letter}>{hr.rank}</span>
    </div>
  );
}
