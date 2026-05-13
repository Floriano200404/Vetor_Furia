'use client';

/**
 * AvatarDisplay — Renders the player avatar sprite with glow and float animation.
 */

import { motion, AnimatePresence } from 'framer-motion';
import styles from './AvatarDisplay.module.css';

interface AvatarDisplayProps {
  sprite: string;
  stageName: string;
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 48,
  md: 80,
  lg: 140,
};

export function AvatarDisplay({ sprite, stageName, level, size = 'md' }: AvatarDisplayProps) {
  const px = sizeMap[size];

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div className={styles.glowRing} />
      <AnimatePresence mode="wait">
        <motion.div
          key={sprite}
          className={styles.avatarWrapper}
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div
            className={styles.avatar}
            style={{ width: px, height: px }}
          >
            <div className={styles.avatarInner}>
              <span className={styles.avatarEmoji}>
                {getAvatarEmoji(level)}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      {size !== 'sm' && (
        <span className={styles.stageName}>{stageName}</span>
      )}
    </div>
  );
}

function getAvatarEmoji(level: number): string {
  if (level >= 30) return '🐉';
  if (level >= 20) return '⚔️';
  if (level >= 10) return '🛡️';
  if (level >= 5) return '🏹';
  return '🗡️';
}
