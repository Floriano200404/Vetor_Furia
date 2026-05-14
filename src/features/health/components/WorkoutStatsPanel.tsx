'use client';

/**
 * WorkoutStatsPanel — wraps the 1RM calculator and the (lazy-loaded) progression chart.
 *
 * The chart is dynamically imported because recharts is heavy (~95kb gzip)
 * and only this tab needs it.
 */

import dynamic from 'next/dynamic';
import { OneRepMaxCalculator } from './OneRepMaxCalculator';
import styles from './WorkoutStatsPanel.module.css';

const ProgressionChart = dynamic(
  () => import('./ProgressionChart').then((m) => ({ default: m.ProgressionChart })),
  {
    ssr: false,
    loading: () => (
      <div className={styles.chartFallback}>
        <div className={styles.spinner} aria-hidden="true" />
        <span>Carregando gráfico…</span>
      </div>
    ),
  },
);

interface WorkoutStatsPanelProps {
  /** Bumped by the parent to force re-mount after a save, so the chart re-reads localStorage. */
  refreshKey?: number;
}

export function WorkoutStatsPanel({ refreshKey = 0 }: WorkoutStatsPanelProps) {
  return (
    <div className={styles.wrapper}>
      <OneRepMaxCalculator />
      <ProgressionChart key={refreshKey} />
    </div>
  );
}
