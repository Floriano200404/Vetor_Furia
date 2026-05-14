'use client';

/**
 * BodyAvatar — biometric silhouette + level-tier ring + level emoji distintivo.
 *
 * Composition:
 *   ┌─ outer ring (level tier color, glow)
 *   │   ┌─ body silhouette (BodyShape)
 *   │   └─ small badge in the corner (level emoji like 🐉, ⚔️, etc.)
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Biometry } from '../domain/biometry.types';
import {
  getBodyShape,
  getLevelTierColor,
  BODY_SHAPE_LABELS,
  type BodyShape,
} from '../domain/body-shape';
import { BodyShapeSVG } from './body-shapes/BodyShapes';
import styles from './BodyAvatar.module.css';

interface BodyAvatarProps {
  biometry: Biometry | null;
  level: number;
  /**
   * Optional emoji badge to overlay in the corner (e.g., the existing
   * `level emoji` from AvatarDisplay so we keep the RPG class signal).
   */
  levelEmoji?: string;
  size?: 'sm' | 'md' | 'lg';
  /** When true, shows the body shape label under the silhouette. */
  showLabel?: boolean;
  /**
   * When provided, the avatar uses this record instead of `biometry`.
   * Used by the temporal slider.
   */
  overrideRecord?: Biometry | null;
}

const SIZE_PX: Record<NonNullable<BodyAvatarProps['size']>, number> = {
  sm: 60,
  md: 110,
  lg: 170,
};

export function BodyAvatar({
  biometry,
  level,
  levelEmoji,
  size = 'md',
  showLabel = false,
  overrideRecord,
}: BodyAvatarProps) {
  const record = overrideRecord ?? biometry;
  const shape: BodyShape = useMemo(() => getBodyShape(record), [record]);
  const ringColor = useMemo(() => getLevelTierColor(level), [level]);
  const px = SIZE_PX[size];
  const isEmpty = !record;

  // Track hover for a subtle 'breathing' tooltip on label
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`${styles.wrapper} ${styles[size]}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={styles.ring}
        style={{
          width: px + 16,
          height: px + 16,
          background: `conic-gradient(from 180deg, ${ringColor}, transparent 60%, ${ringColor})`,
        }}
      />
      <div
        className={`${styles.body} ${isEmpty ? styles.bodyEmpty : ''}`}
        style={{ width: px, height: px }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={shape}
            className={styles.svgWrap}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <BodyShapeSVG
              shape={shape}
              className={styles.svg}
              style={{ color: isEmpty ? 'var(--text-muted)' : undefined }}
            />
          </motion.div>
        </AnimatePresence>

        {levelEmoji && (
          <div
            className={styles.badge}
            style={{ borderColor: ringColor, boxShadow: `0 0 10px ${ringColor}55` }}
            aria-label={`Nível ${level}`}
            title={`Nível ${level}`}
          >
            <span>{levelEmoji}</span>
          </div>
        )}
      </div>

      {showLabel && (
        <div className={`${styles.label} ${hovered ? styles.labelHover : ''}`}>
          {isEmpty ? (
            <span className={styles.labelEmpty}>Preencha sua biometria</span>
          ) : (
            <>
              <span className={styles.labelShape}>{BODY_SHAPE_LABELS[shape]}</span>
              <span className={styles.labelLevel}>Nv {level}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
