'use client';

/**
 * QuickLogFAB — floating action button (bottom-right) with quick logging
 * shortcuts so common daily actions don't require navigation:
 *  - tick / increment a habit scheduled today
 *  - log today's weight (reusing last known height)
 *  - jump to cardio
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle2, Plus, Scale, X } from 'lucide-react';
import Link from 'next/link';
import { useHabits } from '@/features/habits';
import { useBiometry } from '@/features/health';
import { useToast } from '@/shared/components/Toast';
import styles from './QuickLogFAB.module.css';

type Panel = 'menu' | 'habits' | 'weight' | null;

export function QuickLogFAB() {
  const { habitsWithLogs, toggleHabit, incrementHabit } = useHabits();
  const { records, addBiometry } = useBiometry();
  const toast = useToast();

  const [panel, setPanel] = useState<Panel>(null);
  const [weight, setWeight] = useState('');

  const pendingHabits = habitsWithLogs.filter(
    (h) => h.isScheduledToday && !h.log.completed,
  );
  const lastHeight = records[0]?.height ?? 0;

  const handleHabit = (id: string, isQuant: boolean) => {
    if (isQuant) incrementHabit(id, 1);
    else toggleHabit(id);
    toast.success('Registrado!');
  };

  const handleWeight = () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) return;
    if (lastHeight <= 0) {
      toast.error('Registre altura na aba Biometria primeiro.');
      return;
    }
    addBiometry({ weight: w, height: lastHeight, biomarkers: {} });
    toast.success(`Peso ${w}kg salvo! +15 XP`);
    setWeight('');
    setPanel(null);
  };

  const close = () => setPanel(null);

  return (
    <>
      <AnimatePresence>
        {panel && panel !== 'menu' && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <div className={styles.root}>
        {/* Sub-panels */}
        <AnimatePresence>
          {panel === 'habits' && (
            <motion.div
              className={styles.panel}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
            >
              <h4 className={styles.panelTitle}>Hábitos de hoje</h4>
              {pendingHabits.length === 0 ? (
                <p className={styles.panelEmpty}>Tudo completo! 🎉</p>
              ) : (
                <ul className={styles.habitList}>
                  {pendingHabits.slice(0, 6).map((h) => (
                    <li key={h.habit.id}>
                      <button
                        className={styles.habitBtn}
                        onClick={() =>
                          handleHabit(h.habit.id, h.habit.trackingType === 'quantitative')
                        }
                      >
                        <span>{h.habit.icon} {h.habit.title}</span>
                        <Plus size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {panel === 'weight' && (
            <motion.div
              className={styles.panel}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
            >
              <h4 className={styles.panelTitle}>Peso de hoje</h4>
              <div className={styles.weightRow}>
                <input
                  type="number"
                  step="0.1"
                  placeholder="80.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  autoFocus
                  className={styles.weightInput}
                />
                <span className={styles.weightUnit}>kg</span>
              </div>
              <button
                className={`btn btn-success ${styles.weightSave}`}
                onClick={handleWeight}
                disabled={!weight}
              >
                Salvar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded menu */}
        <AnimatePresence>
          {panel === 'menu' && (
            <motion.div
              className={styles.menu}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <button className={styles.action} onClick={() => setPanel('habits')}>
                <CheckCircle2 size={16} /> Hábito
                {pendingHabits.length > 0 && (
                  <span className={styles.badge}>{pendingHabits.length}</span>
                )}
              </button>
              <button className={styles.action} onClick={() => setPanel('weight')}>
                <Scale size={16} /> Peso
              </button>
              <Link href="/workouts" className={styles.action} onClick={close}>
                <Activity size={16} /> Cardio
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          className={styles.fab}
          onClick={() => setPanel(panel ? null : 'menu')}
          whileTap={{ scale: 0.9 }}
          aria-label="Ações rápidas"
        >
          <motion.span animate={{ rotate: panel ? 45 : 0 }} transition={{ duration: 0.2 }}>
            {panel ? <X size={22} /> : <Plus size={22} />}
          </motion.span>
        </motion.button>
      </div>
    </>
  );
}
