'use client';

/**
 * LevelBadge — Displays current level with a glowing badge.
 */

import { motion } from 'framer-motion';
import styles from './LevelBadge.module.css';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelBadge({ level, size = 'md' }: LevelBadgeProps) {
  return (
    <motion.div
      className={`${styles.badge} ${styles[size]}`}
      key={level}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      <span className={styles.label}>NV</span>
      <span className={styles.number}>{level}</span>
    </motion.div>
  );
}
