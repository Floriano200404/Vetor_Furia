'use client';

/**
 * WeeklySummaryModal — once-per-week retrospective. Self-gates via
 * shouldShowWeeklySummary(); mount it unconditionally on the Dashboard.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Activity, CheckCircle2, Scale, Sparkles, X, Zap } from 'lucide-react';
import {
  buildWeeklySummary,
  shouldShowWeeklySummary,
  markWeeklySummarySeen,
  type WeeklySummary,
} from '../services/weekly-summary.service';
import styles from './WeeklySummaryModal.module.css';

export function WeeklySummaryModal() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  useEffect(() => {
    if (shouldShowWeeklySummary()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSummary(buildWeeklySummary());
    }
  }, []);

  const close = () => {
    markWeeklySummarySeen();
    setSummary(null);
  };

  return (
    <AnimatePresence>
      {summary && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="weekly-title"
        >
          <motion.div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <button className={styles.closeBtn} onClick={close} aria-label="Fechar">
              <X size={18} />
            </button>

            <div className={styles.iconWrap}>
              <Sparkles size={28} />
            </div>
            <h3 id="weekly-title" className={styles.title}>Sua semana</h3>
            <p className={styles.subtitle}>Retrospectiva dos últimos 7 dias</p>

            <div className={styles.grid}>
              <div className={styles.stat}>
                <Zap size={18} className={styles.statIcon} style={{ color: 'var(--accent-secondary)' }} />
                <span className={styles.statValue}>{summary.xpTotal.toLocaleString('pt-BR')}</span>
                <span className={styles.statLabel}>XP ganho</span>
              </div>
              <div className={styles.stat}>
                <Dumbbell size={18} className={styles.statIcon} style={{ color: 'var(--accent-warning)' }} />
                <span className={styles.statValue}>{summary.workouts}</span>
                <span className={styles.statLabel}>treinos</span>
              </div>
              <div className={styles.stat}>
                <Activity size={18} className={styles.statIcon} style={{ color: 'var(--accent-primary)' }} />
                <span className={styles.statValue}>{summary.cardios}</span>
                <span className={styles.statLabel}>cardios ({summary.cardioMinutes}min)</span>
              </div>
              <div className={styles.stat}>
                <CheckCircle2 size={18} className={styles.statIcon} style={{ color: 'var(--accent-success)' }} />
                <span className={styles.statValue}>{summary.habitCompletions}</span>
                <span className={styles.statLabel}>hábitos feitos</span>
              </div>
              {summary.weightDelta !== null && (
                <div className={styles.stat}>
                  <Scale size={18} className={styles.statIcon} style={{ color: 'var(--accent-secondary)' }} />
                  <span className={styles.statValue}>
                    {summary.weightDelta > 0 ? '+' : ''}{summary.weightDelta} kg
                  </span>
                  <span className={styles.statLabel}>peso</span>
                </div>
              )}
            </div>

            <div className={styles.attrs}>
              {summary.strongestAttribute && (
                <div className={`${styles.attrCard} ${styles.attrStrong}`}>
                  <span>Ponto forte</span>
                  <strong>
                    {summary.strongestAttribute.icon} {summary.strongestAttribute.label}
                  </strong>
                </div>
              )}
              {summary.weakestAttribute && (
                <div className={`${styles.attrCard} ${styles.attrWeak}`}>
                  <span>A melhorar</span>
                  <strong>
                    {summary.weakestAttribute.icon} {summary.weakestAttribute.label}
                  </strong>
                </div>
              )}
            </div>

            <button className={`btn btn-primary ${styles.cta}`} onClick={close}>
              Bora pra próxima semana
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
