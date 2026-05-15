'use client';

/**
 * WeeklyView — grade de 7 colunas (Seg→Dom) com os hábitos vinculados a cada dia.
 *
 * Hábitos `daily` aparecem em todas as colunas; `weekly` só nos dias da semana
 * configurados. O dia atual ganha destaque visual.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  type HabitWithLog,
  type WeekDay,
  WEEKDAY_SHORT,
  dayOfWeekIso,
  isScheduledOn,
} from '../domain/habit.types';
import styles from './WeeklyView.module.css';

interface WeeklyViewProps {
  habits: HabitWithLog[];
}

const ALL_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 7];

export function WeeklyView({ habits }: WeeklyViewProps) {
  const today = useMemo(() => dayOfWeekIso(new Date()), []);

  const byDay: Record<WeekDay, HabitWithLog[]> = useMemo(() => {
    const map = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] } as Record<WeekDay, HabitWithLog[]>;
    for (const hw of habits) {
      for (const d of ALL_DAYS) {
        if (isScheduledOn(hw.habit.schedule, d)) map[d].push(hw);
      }
    }
    return map;
  }, [habits]);

  return (
    <div className={styles.grid}>
      {ALL_DAYS.map((d) => (
        <motion.div
          key={d}
          className={`${styles.column} ${d === today ? styles.columnToday : ''}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d * 0.03 }}
        >
          <header className={styles.dayHeader}>
            <span className={styles.dayName}>{WEEKDAY_SHORT[d]}</span>
            {d === today && <span className={styles.todayBadge}>hoje</span>}
            <span className={styles.dayCount}>{byDay[d].length}</span>
          </header>

          <ul className={styles.list}>
            {byDay[d].length === 0 ? (
              <li className={styles.empty}>—</li>
            ) : (
              byDay[d].map((hw) => (
                <li key={hw.habit.id} className={styles.row} title={hw.habit.title}>
                  <span className={styles.rowIcon}>{hw.habit.icon}</span>
                  <span className={styles.rowTitle}>{hw.habit.title}</span>
                </li>
              ))
            )}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}
