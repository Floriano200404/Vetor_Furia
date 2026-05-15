'use client';

/**
 * TodayMissions — aggregates pending actions across Habits, Workouts, Cardio
 * and Biometry into a single "what to do today" card on the Dashboard.
 *
 * The component does no IO of its own — it reads from the same feature hooks
 * each module exposes, so a refresh in any module is reflected here.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, ArrowRight, CheckCircle2, ChevronRight, Dumbbell,
  Flame, Sparkles, Target, Scale,
} from 'lucide-react';
import Link from 'next/link';
import { useHabits } from '@/features/habits';
import type { HabitWithLog } from '@/features/habits';
import { useWorkouts, useCardio, useBiometry } from '@/features/health';
import styles from './TodayMissions.module.css';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const THRESHOLDS = {
  workoutSuggest: 3,
  cardioSuggest: 3,
  biometrySuggest: 14,
  /** above this many days the item gets a "urgent" red color */
  urgent: 7,
};

interface MissionItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  /** 0–1 progress for the inline bar (only for quant. habits) */
  progress?: number;
  /** Higher = more urgent */
  priority: number;
  /** Render in danger color (overdue) */
  urgent?: boolean;
}

function daysSince(timestamp: number | undefined): number {
  if (!timestamp) return Infinity;
  return Math.floor((Date.now() - timestamp) / MS_PER_DAY);
}

function buildHabitItem(hw: HabitWithLog): MissionItem | null {
  if (!hw.isScheduledToday) return null;
  if (hw.log.completed) return null;

  const { habit, log } = hw;
  let subtitle: string;
  let progress: number | undefined;

  if (habit.trackingType === 'quantitative' && habit.target) {
    const pct = log.progress / habit.target;
    progress = pct;
    subtitle = `${log.progress}/${habit.target}${habit.unit ? ` ${habit.unit}` : ''}`;
  } else {
    subtitle = '+' + habit.xpReward + ' XP ao completar';
  }

  return {
    id: `habit-${habit.id}`,
    icon: <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{habit.icon}</span>,
    title: habit.title,
    subtitle,
    href: '/habits',
    progress,
    // Partially-progressed quantitative habits jump to top (almost there).
    priority: progress && progress > 0.5 ? 90 : 80,
  };
}

interface TodayMissionsProps {
  /**
   * Use a server-time "now" hint when needed. Defaults to Date.now() at render.
   * Mostly here for testing.
   */
  now?: number;
}

export function TodayMissions(_props: TodayMissionsProps = {}) {
  const { habitsWithLogs } = useHabits();
  const { workouts } = useWorkouts();
  const { sessions: cardioSessions } = useCardio();
  const { records: bioRecs } = useBiometry();

  const items: MissionItem[] = useMemo(() => {
    const out: MissionItem[] = [];

    // 1) Habits scheduled for today + still pending
    for (const hw of habitsWithLogs) {
      const item = buildHabitItem(hw);
      if (item) out.push(item);
    }

    // 2) Workout suggestion
    const workoutDays = daysSince(workouts[0]?.date);
    if (workoutDays >= THRESHOLDS.workoutSuggest) {
      out.push({
        id: 'suggest-workout',
        icon: <Dumbbell size={16} />,
        title: workoutDays === Infinity ? 'Registre seu primeiro treino' : `Treine ${workoutDays === 1 ? 'hoje' : 'logo'}`,
        subtitle:
          workoutDays === Infinity
            ? 'Sem treinos registrados ainda'
            : `Último treino ${workoutDays === 1 ? 'há 1 dia' : `há ${workoutDays} dias`}`,
        href: '/workouts',
        priority: 70,
        urgent: workoutDays >= THRESHOLDS.urgent,
      });
    }

    // 3) Cardio suggestion
    const cardioDays = daysSince(cardioSessions[0]?.date);
    if (cardioDays >= THRESHOLDS.cardioSuggest) {
      out.push({
        id: 'suggest-cardio',
        icon: <Activity size={16} />,
        title: cardioDays === Infinity ? 'Registre uma sessão de cardio' : `Cardio em dia?`,
        subtitle:
          cardioDays === Infinity
            ? 'Corrida, bike, caminhada…'
            : `Última sessão ${cardioDays === 1 ? 'há 1 dia' : `há ${cardioDays} dias`}`,
        href: '/workouts',
        priority: 60,
        urgent: cardioDays >= THRESHOLDS.urgent,
      });
    }

    // 4) Biometry suggestion
    const biometryDays = daysSince(bioRecs[0]?.measuredAt);
    if (biometryDays >= THRESHOLDS.biometrySuggest) {
      out.push({
        id: 'suggest-biometry',
        icon: <Scale size={16} />,
        title: biometryDays === Infinity ? 'Registre sua biometria' : 'Atualize sua biometria',
        subtitle:
          biometryDays === Infinity
            ? 'Peso, altura, % gordura'
            : `Última medição há ${biometryDays} dias`,
        href: '/workouts',
        priority: 50,
        urgent: biometryDays >= 30,
      });
    }

    return out.sort((a, b) => b.priority - a.priority);
  }, [habitsWithLogs, workouts, cardioSessions, bioRecs]);

  // Total of habits scheduled today (for the progress label)
  const scheduledToday = habitsWithLogs.filter((h) => h.isScheduledToday);
  const completedToday = scheduledToday.filter((h) => h.log.completed).length;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Target size={18} className={styles.headerIcon} />
          <h3 className={styles.title}>Missões de Hoje</h3>
        </div>
        {scheduledToday.length > 0 && (
          <span className={styles.progressTag}>
            {completedToday}/{scheduledToday.length} hábitos
          </span>
        )}
      </header>

      {items.length === 0 ? (
        <div className={styles.allClear}>
          <Sparkles size={28} className={styles.allClearIcon} />
          <div>
            <h4 className={styles.allClearTitle}>Tudo em dia!</h4>
            <p className={styles.allClearText}>
              {scheduledToday.length > 0
                ? 'Hábitos completos, treino e biometria em dia. Continue assim. 🔥'
                : 'Sem missões pendentes. Aproveite pra explorar a Loja ou ver suas estatísticas.'}
            </p>
          </div>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item, idx) => (
            <motion.li
              key={item.id}
              className={styles.itemWrap}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link
                href={item.href}
                className={`${styles.item} ${item.urgent ? styles.itemUrgent : ''}`}
              >
                <span className={styles.itemIcon}>{item.icon}</span>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemSubtitle}>{item.subtitle}</span>
                  {typeof item.progress === 'number' && (
                    <div className={styles.progressBar}>
                      <motion.div
                        className={styles.progressFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, item.progress * 100)}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      />
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className={styles.itemChevron} />
              </Link>
            </motion.li>
          ))}
        </ul>
      )}

      {/* Quick actions footer when there's stuff pending */}
      {items.length > 0 && (
        <footer className={styles.footer}>
          <Link href="/habits" className={styles.footerLink}>
            <CheckCircle2 size={14} /> Ver todos os hábitos
          </Link>
          <Link href="/workouts" className={styles.footerLink}>
            <Flame size={14} /> Treino & Cardio
            <ArrowRight size={12} />
          </Link>
        </footer>
      )}
    </section>
  );
}
