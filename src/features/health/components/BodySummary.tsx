'use client';

/**
 * BodySummary — Shows current body metrics with BMI classification.
 */

import type { Biometry } from '../domain/biometry.types';
import styles from './BodySummary.module.css';

interface BodySummaryProps {
  latest: Biometry | null;
  allRecords: Biometry[];
}

function getBMICategory(bmi: number): { label: string; color: string; emoji: string } {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: '#60a5fa', emoji: '🔵' };
  if (bmi < 25)   return { label: 'Peso normal', color: '#10b981', emoji: '🟢' };
  if (bmi < 30)   return { label: 'Sobrepeso', color: '#f59e0b', emoji: '🟡' };
  if (bmi < 35)   return { label: 'Obesidade I', color: '#f97316', emoji: '🟠' };
  return { label: 'Obesidade II+', color: '#ef4444', emoji: '🔴' };
}

export function BodySummary({ latest, allRecords }: BodySummaryProps) {
  if (!latest) return null;

  const bmi = latest.weight / Math.pow(latest.height / 100, 2);
  const bmiCat = getBMICategory(bmi);

  // Weight delta from first record
  const sorted = [...allRecords].filter(r => r.weight > 0).sort((a, b) => a.measuredAt - b.measuredAt);
  const first = sorted[0];
  const delta = first ? Math.round((latest.weight - first.weight) * 10) / 10 : 0;
  const hasDelta = sorted.length > 1;

  // BMI bar position (scale 15-40)
  const bmiMin = 15;
  const bmiMax = 40;
  const bmiPercent = Math.max(0, Math.min(100, ((bmi - bmiMin) / (bmiMax - bmiMin)) * 100));

  return (
    <div className={styles.card}>
      <h4 className={styles.title}>🏋️ Resumo Corporal</h4>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{latest.weight} <small>kg</small></span>
          <span className={styles.metricLabel}>Peso Atual</span>
          {hasDelta && (
            <span className={`${styles.delta} ${delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : ''}`}>
              {delta > 0 ? '+' : ''}{delta} kg
            </span>
          )}
        </div>

        <div className={styles.metric}>
          <span className={styles.metricValue}>{latest.height} <small>cm</small></span>
          <span className={styles.metricLabel}>Altura</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricValue} style={{ color: bmiCat.color }}>{bmi.toFixed(1)}</span>
          <span className={styles.metricLabel}>IMC</span>
          <span className={styles.bmiCategory} style={{ color: bmiCat.color }}>
            {bmiCat.emoji} {bmiCat.label}
          </span>
        </div>
      </div>

      {/* BMI Visual Scale */}
      <div className={styles.bmiBar}>
        <div className={styles.bmiTrack}>
          <div className={styles.bmiZone} style={{ left: '0%', width: '14%', background: '#60a5fa33' }} />
          <div className={styles.bmiZone} style={{ left: '14%', width: '26%', background: '#10b98133' }} />
          <div className={styles.bmiZone} style={{ left: '40%', width: '20%', background: '#f59e0b33' }} />
          <div className={styles.bmiZone} style={{ left: '60%', width: '20%', background: '#f9731633' }} />
          <div className={styles.bmiZone} style={{ left: '80%', width: '20%', background: '#ef444433' }} />
          <div
            className={styles.bmiIndicator}
            style={{ left: `${bmiPercent}%`, background: bmiCat.color }}
          />
        </div>
        <div className={styles.bmiLabels}>
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>35</span>
          <span>40</span>
        </div>
      </div>
    </div>
  );
}
