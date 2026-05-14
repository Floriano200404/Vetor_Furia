'use client';

/**
 * HabitCard — Individual habit item with animated toggle and streak display.
 */

import { motion } from 'framer-motion';
import { Flame, Trash2, Coins } from 'lucide-react';
import styles from './HabitCard.module.css';
import type { HabitWithLog } from '../domain/habit.types';

interface HabitCardProps {
  habitWithLog: HabitWithLog;
  onToggle: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

export function HabitCard({ habitWithLog, onToggle, onDelete }: HabitCardProps) {
  const { habit, log, streak } = habitWithLog;
  const isCompleted = log.completed;

  return (
    <motion.div
      className={`${styles.card} ${isCompleted ? styles.completed : ''}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <button
        className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`}
        onClick={() => onToggle(habit.id)}
        aria-label={`Marcar "${habit.title}" como ${isCompleted ? 'incompleto' : 'completo'}`}
      >
        {isCompleted && (
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            className={styles.checkIcon}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.svg>
        )}
      </button>

      <span className={styles.icon}>{habit.icon}</span>

      <div className={styles.info}>
        <span className={`${styles.title} ${isCompleted ? styles.titleDone : ''}`}>
          {habit.title}
        </span>
        <div className={styles.rewardsRow}>
          <span className={styles.xp}>+{habit.xpReward} XP</span>
          <span className={styles.gold}><Coins size={12} /> +5</span>
        </div>
      </div>

      {streak > 0 && (
        <motion.div
          className={styles.streak}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Flame size={14} />
          <span>{streak}</span>
        </motion.div>
      )}

      <button
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Tem certeza que deseja deletar o hábito "${habit.title}"?`)) {
            onDelete(habit.id);
          }
        }}
        aria-label={`Remover "${habit.title}"`}
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}
