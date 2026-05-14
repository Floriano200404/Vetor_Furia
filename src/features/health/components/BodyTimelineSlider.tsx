'use client';

/**
 * BodyTimelineSlider — scrub through biometry history to see the avatar evolve.
 *
 * Renders nothing if there are fewer than 2 records (the slider would have
 * no axis to travel).
 */

import { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import type { Biometry } from '../domain/biometry.types';
import { BodyAvatar } from './BodyAvatar';
import styles from './BodyTimelineSlider.module.css';

interface BodyTimelineSliderProps {
  records: Biometry[];
  level: number;
  levelEmoji?: string;
}

function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export function BodyTimelineSlider({
  records,
  level,
  levelEmoji,
}: BodyTimelineSliderProps) {
  // Sort ascending by date so slider goes left=oldest → right=newest.
  const sorted = useMemo(
    () => [...records].sort((a, b) => a.measuredAt - b.measuredAt),
    [records],
  );

  // Default to latest record.
  const [index, setIndex] = useState(() => Math.max(0, sorted.length - 1));

  if (sorted.length < 2) return null;

  const safeIndex = Math.min(index, sorted.length - 1);
  const current = sorted[safeIndex];
  const isLatest = safeIndex === sorted.length - 1;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <Clock size={14} />
        <span>Linha do tempo</span>
      </header>

      <div className={styles.content}>
        <BodyAvatar
          biometry={current}
          level={level}
          levelEmoji={levelEmoji}
          size="md"
          showLabel
        />

        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{current.weight} kg</span>
            <span className={styles.metricLabel}>peso</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue}>
              {(current.weight / Math.pow(current.height / 100, 2)).toFixed(1)}
            </span>
            <span className={styles.metricLabel}>IMC</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{formatShortDate(current.measuredAt)}</span>
            <span className={styles.metricLabel}>{isLatest ? 'agora' : 'medição'}</span>
          </div>
        </div>
      </div>

      <div className={styles.sliderRow}>
        <span className={styles.edgeLabel}>{formatShortDate(sorted[0].measuredAt)}</span>
        <input
          type="range"
          min={0}
          max={sorted.length - 1}
          step={1}
          value={safeIndex}
          onChange={(e) => setIndex(parseInt(e.target.value, 10))}
          className={styles.slider}
          aria-label="Arraste para navegar pelas medições"
        />
        <span className={styles.edgeLabel}>
          {formatShortDate(sorted[sorted.length - 1].measuredAt)}
        </span>
      </div>
    </section>
  );
}
