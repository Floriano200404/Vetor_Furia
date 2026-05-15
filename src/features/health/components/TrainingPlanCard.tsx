'use client';

/**
 * TrainingPlanCard — shows "today's focus" prominently + an editable weekly
 * grid. Auto-saves on every change.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CalendarDays, ChevronRight } from 'lucide-react';
import {
  PLAN_FOCUSES,
  focusDef,
  getTrainingPlan,
  saveTrainingPlan,
  todaysFocus,
  type PlanFocus,
  type WeeklyPlan,
} from '../domain/training-plan';
import styles from './TrainingPlanCard.module.css';

const WEEKDAYS: { iso: number; short: string }[] = [
  { iso: 1, short: 'Seg' },
  { iso: 2, short: 'Ter' },
  { iso: 3, short: 'Qua' },
  { iso: 4, short: 'Qui' },
  { iso: 5, short: 'Sex' },
  { iso: 6, short: 'Sáb' },
  { iso: 7, short: 'Dom' },
];

function isoToday(): number {
  const js = new Date().getDay();
  return js === 0 ? 7 : js;
}

export function TrainingPlanCard() {
  const [plan, setPlan] = useState<WeeklyPlan>(() =>
    typeof window === 'undefined' ? {} : getTrainingPlan(),
  );
  const [editing, setEditing] = useState(false);

  const today = isoToday();
  const focus = todaysFocus(plan);
  const def = focusDef(focus);
  const isRest = focus === 'descanso';

  const setDay = (iso: number, value: PlanFocus) => {
    const next = { ...plan, [iso]: value };
    setPlan(next);
    saveTrainingPlan(next);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <CalendarDays size={16} className={styles.headerIcon} />
          <h3 className={styles.title}>Plano da Semana</h3>
        </div>
        <button
          type="button"
          className={styles.editToggle}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? 'Concluir' : 'Editar'}
        </button>
      </header>

      {/* Today's focus banner */}
      <div
        className={styles.today}
        style={{ borderColor: `${def.color}66`, background: `${def.color}12` }}
      >
        <span className={styles.todayIcon}>{def.icon}</span>
        <div className={styles.todayInfo}>
          <span className={styles.todayLabel}>Hoje é dia de</span>
          <span className={styles.todayFocus} style={{ color: def.color }}>
            {def.label}
          </span>
        </div>
        {!isRest && (
          <Link href="/workouts" className={styles.todayCta}>
            Treinar <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Weekly grid */}
      <div className={styles.grid}>
        {WEEKDAYS.map(({ iso, short }) => {
          const d = focusDef(plan[iso] ?? 'descanso');
          const isToday = iso === today;
          return (
            <div
              key={iso}
              className={`${styles.day} ${isToday ? styles.dayToday : ''}`}
            >
              <span className={styles.dayName}>{short}</span>
              {editing ? (
                <select
                  className={styles.daySelect}
                  value={plan[iso] ?? 'descanso'}
                  onChange={(e) => setDay(iso, e.target.value as PlanFocus)}
                >
                  {PLAN_FOCUSES.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.icon} {f.label}
                    </option>
                  ))}
                </select>
              ) : (
                <motion.span
                  className={styles.dayFocus}
                  style={{ color: d.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  title={d.label}
                >
                  {d.icon}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
