'use client';

/**
 * LevelUpModal — Epic celebratory modal when the player levels up.
 * Shows narrative text when reaching a new avatar stage.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AVATAR_STAGES } from '@/lib/constants';
import type { AvatarStageConfig } from '@/lib/constants';
import styles from './LevelUpModal.module.css';

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number | null;
  onClose: () => void;
}

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  angle: (i * 18) * (Math.PI / 180),
  distance: 80 + Math.random() * 80,
  size: 4 + Math.random() * 6,
  delay: Math.random() * 0.3,
}));

function getStageForLevel(level: number): AvatarStageConfig {
  let current = AVATAR_STAGES[0];
  for (const stage of AVATAR_STAGES) {
    if (level >= stage.minLevel) current = stage;
  }
  return current;
}

function isNewStage(level: number): boolean {
  return AVATAR_STAGES.some(s => s.minLevel === level);
}

export function LevelUpModal({ isOpen, newLevel, onClose }: LevelUpModalProps) {
  const stage = newLevel ? getStageForLevel(newLevel) : AVATAR_STAGES[0];
  const isStageUp = newLevel ? isNewStage(newLevel) : false;

  return (
    <AnimatePresence>
      {isOpen && newLevel && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`${styles.modal} ${isStageUp ? styles.modalStageUp : ''}`}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 15, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Particle burst */}
            <div className={styles.particles}>
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  className={styles.particle}
                  style={{ width: p.size, height: p.size }}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos(p.angle) * p.distance,
                    y: Math.sin(p.angle) * p.distance,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 1, delay: p.delay, ease: 'easeOut' }}
                />
              ))}
            </div>

            {/* Stage emoji */}
            <motion.div
              className={styles.icon}
              initial={{ y: 20, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            >
              {stage.emoji}
            </motion.div>

            {/* Level number */}
            <motion.div
              className={styles.levelNumber}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, stiffness: 300, damping: 10 }}
            >
              {newLevel}
            </motion.div>

            {/* Title */}
            <motion.h2
              className={styles.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isStageUp ? `🏆 ${stage.title}` : 'Level Up!'}
            </motion.h2>

            {/* Stage-specific narrative */}
            {isStageUp ? (
              <>
                <motion.div
                  className={styles.stageBadge}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  Novo Estágio: <strong>{stage.name}</strong>
                </motion.div>

                <motion.p
                  className={styles.lore}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {stage.lore}
                </motion.p>

                {stage.unlocks.length > 0 && (
                  <motion.div
                    className={styles.unlocks}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <span className={styles.unlocksTitle}>🔓 Desbloqueado:</span>
                    <div className={styles.unlocksList}>
                      {stage.unlocks.map((u, i) => (
                        <span key={i} className={styles.unlockItem}>{u}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <motion.p
                className={styles.subtitle}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {stage.description}
              </motion.p>
            )}

            <motion.button
              className={`btn btn-primary btn-lg ${styles.button}`}
              onClick={onClose}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: isStageUp ? 0.7 : 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isStageUp ? '⚔️ Seguir em Frente' : 'Continuar'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
