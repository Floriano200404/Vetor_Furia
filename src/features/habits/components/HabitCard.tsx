'use client';

/**
 * HabitCard — renders one habit's row with one of two interaction modes:
 *  - binary:       single big checkbox
 *  - quantitative: progress bar + minus/plus buttons + value label
 *
 * Cards whose schedule doesn't cover today get dimmed and show the next
 * scheduled day instead of action buttons.
 */

import { motion } from 'framer-motion';
import { Bell, Calendar, Coins, Flame, Minus, Plus, Trash2 } from 'lucide-react';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import styles from './HabitCard.module.css';
import type { HabitWithLog } from '../domain/habit.types';

interface HabitCardProps {
  habitWithLog: HabitWithLog;
  onToggle: (habitId: string) => void;
  onIncrement: (habitId: string, delta: number) => void;
  onDelete: (habitId: string) => void;
}

function scheduleSummary(habitWithLog: HabitWithLog): string | null {
  const { habit, isScheduledToday, nextScheduledLabel } = habitWithLog;
  if (habit.schedule.type === 'daily') return null;
  if (isScheduledToday) return 'hoje';
  return nextScheduledLabel ? `próxima: ${nextScheduledLabel}` : null;
}

export function HabitCard({
  habitWithLog,
  onToggle,
  onIncrement,
  onDelete,
}: HabitCardProps) {
  const { habit, log, streak, isScheduledToday } = habitWithLog;
  const confirm = useConfirm();
  const isCompleted = log.completed;
  const isQuant = habit.trackingType === 'quantitative';
  const target = habit.target ?? 1;
  const progress = Math.max(0, Math.min(target, log.progress));
  const progressPct = target > 0 ? (progress / target) * 100 : 0;

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Excluir hábito?',
      message: `"${habit.title}" será removido junto com todo o histórico.`,
      danger: true,
      confirmLabel: 'Excluir',
    });
    if (ok) onDelete(habit.id);
  };

  // Increment unit: 1 unless the target is huge (steps) — then 1000.
  const incrementUnit = target >= 1000 ? Math.round(target / 10) : 1;

  const scheduleNote = scheduleSummary(habitWithLog);

  return (
    <motion.div
      className={`${styles.card} ${isCompleted ? styles.completed : ''} ${!isScheduledToday ? styles.offDay : ''}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Left action: checkbox (binary) or progress (quantitative) */}
      {!isQuant ? (
        <button
          className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`}
          onClick={() => onToggle(habit.id)}
          disabled={!isScheduledToday}
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
      ) : (
        <div className={styles.progressBox}>
          <button
            type="button"
            className={styles.qBtn}
            onClick={() => onIncrement(habit.id, -incrementUnit)}
            disabled={!isScheduledToday || progress === 0}
            aria-label="Diminuir"
          >
            <Minus size={14} />
          </button>
          <div
            className={styles.progressLabel}
            aria-label={`Progresso: ${progress} de ${target} ${habit.unit ?? ''}`}
          >
            <strong>{progress}</strong>
            <span className={styles.progressTarget}>/ {target}{habit.unit ? ` ${habit.unit}` : ''}</span>
          </div>
          <button
            type="button"
            className={`${styles.qBtn} ${styles.qBtnPlus} ${isCompleted ? styles.qBtnDone : ''}`}
            onClick={() => onIncrement(habit.id, incrementUnit)}
            disabled={!isScheduledToday || isCompleted}
            aria-label="Aumentar"
          >
            <Plus size={14} />
          </button>
        </div>
      )}

      <span className={styles.icon} aria-hidden="true">{habit.icon}</span>

      <div className={styles.info}>
        <span className={`${styles.title} ${isCompleted ? styles.titleDone : ''}`}>
          {habit.title}
        </span>
        <div className={styles.rewardsRow}>
          <span className={styles.xp}>+{habit.xpReward} XP</span>
          <span className={styles.gold}><Coins size={12} /> +5</span>

          {scheduleNote && (
            <span className={styles.scheduleNote} title="Frequência semanal">
              <Calendar size={11} /> {scheduleNote}
            </span>
          )}

          {habit.reminderTimes.length > 0 && (
            <span className={styles.reminderNote} title={habit.reminderTimes.join(' · ')}>
              <Bell size={11} /> {habit.reminderTimes[0]}
              {habit.reminderTimes.length > 1 && ` +${habit.reminderTimes.length - 1}`}
            </span>
          )}
        </div>

        {/* Quantitative inline bar */}
        {isQuant && (
          <div className={styles.progressBar} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={target}>
            <motion.div
              className={styles.progressFill}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        )}
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
        onClick={handleDelete}
        aria-label={`Remover "${habit.title}"`}
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}
