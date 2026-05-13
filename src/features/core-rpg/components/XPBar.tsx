'use client';

/**
 * XPBar — Animated XP progress bar using Framer Motion.
 * Uses scaleX transform for GPU-accelerated 60fps animation.
 */

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import styles from './XPBar.module.css';

interface XPBarProps {
  progress: number; // 0 to 1
  level: number;
  currentXP: number;
  nextLevelXP: number;
  compact?: boolean;
}

export function XPBar({ progress, level, currentXP, nextLevelXP, compact = false }: XPBarProps) {
  const motionProgress = useMotionValue(0);
  const scaleX = useTransform(motionProgress, [0, 1], [0, 1]);
  const glowOpacity = useTransform(motionProgress, [0, 0.5, 1], [0.2, 0.4, 0.8]);
  const previousProgress = useRef(0);

  useEffect(() => {
    const controls = animate(motionProgress, progress, {
      type: 'spring',
      stiffness: 80,
      damping: 20,
      mass: 0.8,
    });
    previousProgress.current = progress;
    return () => controls.stop();
  }, [progress, motionProgress]);

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {!compact && (
        <div className={styles.header}>
          <span className={styles.level}>Nível {level}</span>
          <span className={styles.xpText}>
            {currentXP.toLocaleString('pt-BR')} / {nextLevelXP.toLocaleString('pt-BR')} XP
          </span>
        </div>
      )}
      <div className={styles.track}>
        <motion.div
          className={styles.fill}
          style={{ scaleX, transformOrigin: 'left' }}
        />
        <motion.div
          className={styles.glow}
          style={{ scaleX, transformOrigin: 'left', opacity: glowOpacity }}
        />
        {/* Shimmer effect */}
        <motion.div
          className={styles.shimmer}
          style={{ scaleX, transformOrigin: 'left' }}
        />
      </div>
      {compact && (
        <span className={styles.compactLabel}>Nv. {level}</span>
      )}
    </div>
  );
}
