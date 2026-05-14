'use client';

/**
 * GoldDisplay — Displays player's current gold balance.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './GoldDisplay.module.css';

interface GoldDisplayProps {
  gold: number;
}

export function GoldDisplay({ gold }: GoldDisplayProps) {
  const [prevGold, setPrevGold] = useState(gold);
  const [diff, setDiff] = useState<{ amount: number; id: number } | null>(null);

  useEffect(() => {
    if (gold !== prevGold) {
      const amount = gold - prevGold;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiff({ amount, id: Date.now() });
      setPrevGold(gold);
      
      const timer = setTimeout(() => setDiff(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [gold, prevGold]);

  return (
    <div className={styles.container}>
      <div className={styles.iconContainer}>
        <Coins size={14} className={styles.icon} />
      </div>
      <span className={styles.text}>{gold.toLocaleString('pt-BR')}</span>
      
      <AnimatePresence>
        {diff && (
          <motion.div
            key={diff.id}
            className={`${styles.diff} ${diff.amount > 0 ? styles.positive : styles.negative}`}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1.2 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 1 }}
          >
            {diff.amount > 0 ? '+' : ''}{diff.amount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
