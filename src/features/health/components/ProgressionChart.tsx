'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import {
  getExerciseHistory,
  getLoggedExerciseNames,
} from '../services/workout-analytics.service';
import type { ExerciseHistoryPoint } from '../domain/workout.types';
import styles from './ProgressionChart.module.css';

type Metric = 'calculated1RM' | 'maxWeight';

const METRIC_META: Record<Metric, { label: string; color: string; unit: string }> = {
  calculated1RM: {
    label: '1RM Estimado',
    color: 'var(--accent-primary)',
    unit: 'kg',
  },
  maxWeight: {
    label: 'Carga Máxima',
    color: 'var(--accent-secondary)',
    unit: 'kg',
  },
};

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ExerciseHistoryPoint; value: number; color: string }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>
        {new Date(point.date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </div>
      <div className={styles.tooltipRow}>
        <span>1RM:</span>
        <strong>{point.calculated1RM} kg</strong>
      </div>
      <div className={styles.tooltipRow}>
        <span>Carga máx:</span>
        <strong>
          {point.maxWeight} kg × {point.topReps} reps
        </strong>
      </div>
      <div className={styles.tooltipRow}>
        <span>Volume:</span>
        <strong>{point.volume} kg</strong>
      </div>
    </div>
  );
}

interface ProgressionChartProps {
  /**
   * Optional pre-selected exercise. If omitted, defaults to the most-recent
   * exercise in the user's history.
   */
  initialExercise?: string;
}

export function ProgressionChart({ initialExercise }: ProgressionChartProps) {
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [metric, setMetric] = useState<Metric>('calculated1RM');

  // Read available exercises once at mount and whenever the storage key bumps.
  // We re-read on `storage` events so the chart reacts to workouts added in
  // another tab; in the same tab we rely on the parent re-mounting via key.
  useEffect(() => {
    const refresh = () => {
      const names = getLoggedExerciseNames();
      setAvailable(names);
      setSelected((prev) => {
        if (prev && names.includes(prev)) return prev;
        if (initialExercise && names.includes(initialExercise)) return initialExercise;
        return names[0] ?? '';
      });
    };
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [initialExercise]);

  const data: ExerciseHistoryPoint[] = useMemo(
    () => (selected ? getExerciseHistory(selected) : []),
    [selected],
  );

  const meta = METRIC_META[metric];

  if (available.length === 0) {
    return (
      <section className={styles.wrapper}>
        <header className={styles.header}>
          <h3 className={styles.title}>
            <TrendingUp size={18} /> Progressão de carga
          </h3>
        </header>
        <div className={styles.empty}>
          <BarChart3 size={40} className={styles.emptyIcon} />
          <p>Registre alguns treinos para ver sua progressão aqui.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h3 className={styles.title}>
          <TrendingUp size={18} /> Progressão de carga
        </h3>

        <div className={styles.controls}>
          <select
            className={styles.select}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Selecionar exercício"
          >
            {available.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <div className={styles.toggle} role="tablist" aria-label="Métrica">
            <button
              type="button"
              role="tab"
              aria-selected={metric === 'calculated1RM'}
              className={`${styles.toggleBtn} ${
                metric === 'calculated1RM' ? styles.toggleBtnActive : ''
              }`}
              onClick={() => setMetric('calculated1RM')}
            >
              1RM
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={metric === 'maxWeight'}
              className={`${styles.toggleBtn} ${
                metric === 'maxWeight' ? styles.toggleBtnActive : ''
              }`}
              onClick={() => setMetric('maxWeight')}
            >
              Carga máx
            </button>
          </div>
        </div>
      </header>

      {data.length === 0 ? (
        <div className={styles.empty}>
          <BarChart3 size={40} className={styles.emptyIcon} />
          <p>Nenhum dado para {selected}.</p>
        </div>
      ) : data.length === 1 ? (
        <div className={styles.singlePoint}>
          <span className={styles.singleLabel}>{meta.label}</span>
          <span className={styles.singleValue}>
            {data[0][metric]} {meta.unit}
          </span>
          <span className={styles.singleHint}>
            Registre mais sessões para visualizar a evolução.
          </span>
        </div>
      ) : (
        <div className={styles.chartBox}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                stroke="var(--border-default)"
              />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                stroke="var(--border-default)"
                unit=" kg"
                width={56}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={meta.color}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                name={meta.label}
                isAnimationActive
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
