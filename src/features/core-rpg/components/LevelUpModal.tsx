'use client';

/**
 * LevelUpModal — Celebratory modal when the player levels up.
 */

import { motion, AnimatePresence } from 'framer-motion';
import styles from './LevelUpModal.module.css';

interface LevelUpModalProps {
  isOpen: boolean;
  newLevel: number | null;
  onClose: () => void;
}

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i * 30) * (Math.PI / 180),
}));

export function LevelUpModal({ isOpen, newLevel, onClose }: LevelUpModalProps) {
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
            className={styles.modal}
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
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos(p.angle) * 120,
                    y: Math.sin(p.angle) * 120,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                />
              ))}
            </div>

            <motion.div
              className={styles.icon}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              ⚡
            </motion.div>

            <motion.h2
              className={styles.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Level Up!
            </motion.h2>

            <motion.div
              className={styles.levelNumber}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3, stiffness: 300, damping: 10 }}
            >
              {newLevel}
            </motion.div>

            <motion.p
              className={styles.subtitle}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Você alcançou um novo nível! Continue evoluindo.
            </motion.p>

            <motion.button
              className={`btn btn-primary btn-lg ${styles.button}`}
              onClick={onClose}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continuar
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
