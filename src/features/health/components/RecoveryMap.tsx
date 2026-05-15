'use client';

/**
 * RecoveryMap — stylized front-body silhouette with muscle regions colored
 * by recovery state, plus a legend and a "best to train" suggestion.
 *
 * The silhouette is schematic (blocks per region), not anatomical — good
 * enough to read fatigue at a glance and stays on-brand with the SVG style.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse } from 'lucide-react';
import {
  getRecoveryMap,
  suggestNextGroup,
  type MuscleRecovery,
} from '../services/recovery.service';
import styles from './RecoveryMap.module.css';

function colorFor(map: MuscleRecovery[], group: string): string {
  return map.find((m) => m.group === group)?.color ?? '#475569';
}

function label(map: MuscleRecovery[], group: string): string {
  const m = map.find((x) => x.group === group);
  if (!m || m.hoursSince === null) return 'sem registro';
  if (m.hoursSince < 1) return 'agora';
  if (m.hoursSince < 24) return `${m.hoursSince}h atrás`;
  return `${Math.floor(m.hoursSince / 24)}d atrás`;
}

export function RecoveryMap() {
  const [map] = useState(() =>
    typeof window === 'undefined' ? [] : getRecoveryMap(),
  );
  const suggestion = suggestNextGroup(map);

  if (map.length === 0) return null;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <HeartPulse size={16} className={styles.headerIcon} />
        <div>
          <h3 className={styles.title}>Recuperação Muscular</h3>
          <p className={styles.subtitle}>Fadiga estimada por grupo</p>
        </div>
      </header>

      <div className={styles.body}>
        <svg viewBox="0 0 120 220" className={styles.figure} aria-label="Mapa de recuperação">
          {/* Head */}
          <circle cx="60" cy="20" r="13" fill="var(--bg-elevated)" stroke="var(--border-default)" />
          {/* Shoulders */}
          <rect x="28" y="38" width="20" height="14" rx="6" fill={colorFor(map, 'Ombros')} />
          <rect x="72" y="38" width="20" height="14" rx="6" fill={colorFor(map, 'Ombros')} />
          {/* Chest */}
          <rect x="42" y="40" width="36" height="26" rx="8" fill={colorFor(map, 'Peito')} />
          {/* Abs */}
          <rect x="46" y="68" width="28" height="34" rx="6" fill={colorFor(map, 'Abdômen')} />
          {/* Biceps (upper arm) */}
          <rect x="22" y="54" width="13" height="34" rx="6" fill={colorFor(map, 'Bíceps')} />
          <rect x="85" y="54" width="13" height="34" rx="6" fill={colorFor(map, 'Bíceps')} />
          {/* Triceps (forearm-ish lower segment) */}
          <rect x="21" y="90" width="12" height="28" rx="5" fill={colorFor(map, 'Tríceps')} />
          <rect x="87" y="90" width="12" height="28" rx="5" fill={colorFor(map, 'Tríceps')} />
          {/* Legs */}
          <rect x="44" y="106" width="14" height="80" rx="7" fill={colorFor(map, 'Pernas')} />
          <rect x="62" y="106" width="14" height="80" rx="7" fill={colorFor(map, 'Pernas')} />
          {/* Back hint pill */}
          <rect x="50" y="190" width="20" height="9" rx="4" fill={colorFor(map, 'Costas')} />
          <text x="60" y="212" textAnchor="middle" className={styles.figLabel}>
            Costas
          </text>
        </svg>

        <div className={styles.legend}>
          {map.map((m) => (
            <div key={m.group} className={styles.legendRow}>
              <span className={styles.dot} style={{ background: m.color }} />
              <span className={styles.legendName}>{m.group}</span>
              <span className={styles.legendTime}>{label(map, m.group)}</span>
            </div>
          ))}
        </div>
      </div>

      {suggestion && (
        <motion.div
          className={styles.suggestion}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          💡 Mais recuperado: <strong>{suggestion}</strong> — bom candidato pro
          treino de hoje.
        </motion.div>
      )}
    </section>
  );
}
