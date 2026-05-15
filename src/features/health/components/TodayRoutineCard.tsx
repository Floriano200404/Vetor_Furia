'use client';

/**
 * TodayRoutineCard — Dashboard card that surfaces the routine(s) scheduled
 * for today and links straight into starting them. Replaces the abstract
 * "Seg = Push" label card with something actionable.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CalendarClock, ChevronRight, Play } from 'lucide-react';
import { getRoutines } from '../services/routines.service';
import {
  daysLabel,
  todayWeekDay,
  WEEKDAY_LONG,
  type Routine,
} from '../domain/workout-routine';
import styles from './TodayRoutineCard.module.css';

export function TodayRoutineCard() {
  const [routines] = useState<Routine[]>(() =>
    typeof window === 'undefined' ? [] : getRoutines(),
  );

  const today = todayWeekDay();
  const todays = routines.filter((r) => r.daysOfWeek.includes(today));

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <CalendarClock size={16} className={styles.headerIcon} />
        <div>
          <h3 className={styles.title}>Treino de hoje</h3>
          <p className={styles.subtitle}>{WEEKDAY_LONG[today]}</p>
        </div>
      </header>

      {todays.length === 0 ? (
        <div className={styles.empty}>
          {routines.length === 0 ? (
            <>
              <p>Você ainda não tem rotinas. Monte uma vez e nunca mais crie do zero.</p>
              <Link href="/workouts" className={styles.cta}>
                Criar rotina <ChevronRight size={14} />
              </Link>
            </>
          ) : (
            <p className={styles.rest}>😴 Dia livre — nenhuma rotina pra hoje. Descanso é treino também.</p>
          )}
        </div>
      ) : (
        <ul className={styles.list}>
          {todays.map((r, idx) => (
            <motion.li
              key={r.id}
              className={styles.item}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <span className={styles.itemIcon}>{r.icon}</span>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{r.name}</span>
                <span className={styles.itemMeta}>
                  {r.kind === 'strength'
                    ? `${r.exercises.length} exercícios`
                    : `${r.cardioType} · ${r.targetMinutes}min`}
                  {' · '}
                  {daysLabel(r.daysOfWeek)}
                </span>
              </div>
              <Link href="/workouts" className={styles.startBtn}>
                <Play size={14} /> Iniciar
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
