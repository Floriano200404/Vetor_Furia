'use client';

/**
 * HPBar — Displays player health points.
 */

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import styles from './HPBar.module.css';

interface HPBarProps {
  hp: number;
  maxHp: number;
}

export function HPBar({ hp, maxHp }: HPBarProps) {
  const percentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const isLow = percentage <= 25;

  return (
    <div className={styles.container}>
      <div className={`${styles.iconContainer} ${isLow ? styles.pulsing : ''}`}>
        <Heart size={14} className={styles.icon} />
      </div>
      <div className={styles.barBackground}>
        <motion.div
          className={`${styles.barFill} ${isLow ? styles.barLow : ''}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        />
      </div>
      <span className={styles.text}>
        {hp}/{maxHp}
      </span>
    </div>
  );
}
