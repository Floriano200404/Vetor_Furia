'use client';

/**
 * AttributeRadar — pentágono que mostra os 5 atributos do jogador.
 *
 * Eixos: Força (topo), Constituição, Inteligência, Disciplina, Vitalidade
 * (rotação horária). A área preenchida é proporcional ao XP normalizado
 * por atributo (cap no maior pra preencher o pentágono).
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ATTRIBUTES,
  attributeForSource,
  buildBreakdown,
} from '../domain/attributes';
import type { XPEntry } from '../domain/xp-ledger.types';
import type { XPSource } from '@/shared/events';
import styles from './AttributeRadar.module.css';

interface AttributeRadarProps {
  entries: XPEntry[];
  size?: number;
}

export function AttributeRadar({ entries, size = 280 }: AttributeRadarProps) {
  const breakdown = useMemo(() => {
    // Aggregate XP per source from the ledger
    const xpBySource: Record<XPSource, number> = {
      habits: 0, workouts: 0, cardio: 0, studies: 0, biometry: 0, bonus: 0,
    };
    for (const e of entries) {
      const src = e.source as XPSource;
      if (src in xpBySource) xpBySource[src] += e.amount;
    }
    return buildBreakdown(xpBySource);
  }, [entries]);

  // Force vertex order to match ATTRIBUTES (which is the rendering order).
  const radarPoints = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.4;
    // We have 5 attributes. Angle 0 at top, rotate clockwise by 72°.
    return breakdown.map((attr, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      // Normalize so the highest level fills 100% radius, others scale proportionally.
      // Min cap at 0.1 so even zeroed attributes show a tiny dot.
      const maxLevel = Math.max(...breakdown.map((a) => a.level), 1);
      const factor = Math.max(0.1, attr.level / maxLevel);
      return {
        labelX: cx + Math.cos(angle) * (radius + 22),
        labelY: cy + Math.sin(angle) * (radius + 22),
        x: cx + Math.cos(angle) * radius * factor,
        y: cy + Math.sin(angle) * radius * factor,
        axisX: cx + Math.cos(angle) * radius,
        axisY: cy + Math.sin(angle) * radius,
        ...attr,
      };
    });
  }, [breakdown, size]);

  const polygon = radarPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const baseline = radarPoints.map((p) => `${p.axisX},${p.axisY}`).join(' ');

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h3 className={styles.title}>🌟 Habilidades</h3>
        <p className={styles.subtitle}>XP distribuído entre os 5 atributos RPG</p>
      </header>

      <div className={styles.body}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className={styles.radar}
          aria-label="Radar de atributos"
        >
          {/* Concentric grid rings */}
          {[0.25, 0.5, 0.75, 1].map((scale) => {
            const ringPoints = radarPoints
              .map((p) => {
                const cx = size / 2;
                const cy = size / 2;
                const dx = (p.axisX - cx) * scale;
                const dy = (p.axisY - cy) * scale;
                return `${cx + dx},${cy + dy}`;
              })
              .join(' ');
            return (
              <polygon
                key={scale}
                points={ringPoints}
                className={styles.gridRing}
              />
            );
          })}

          {/* Spokes */}
          {radarPoints.map((p) => (
            <line
              key={`spoke-${p.key}`}
              x1={size / 2}
              y1={size / 2}
              x2={p.axisX}
              y2={p.axisY}
              className={styles.spoke}
            />
          ))}

          {/* Filled data shape */}
          <motion.polygon
            points={polygon}
            fill="url(#radarGradient)"
            stroke="var(--accent-primary)"
            strokeWidth="2"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, damping: 14 }}
            style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
          />

          {/* Data vertex dots */}
          {radarPoints.map((p) => {
            const def = ATTRIBUTES.find((a) => a.key === p.key)!;
            return (
              <motion.circle
                key={`dot-${p.key}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={def.color}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 320 }}
              />
            );
          })}

          {/* Axis labels */}
          {radarPoints.map((p) => {
            const def = ATTRIBUTES.find((a) => a.key === p.key)!;
            return (
              <text
                key={`label-${p.key}`}
                x={p.labelX}
                y={p.labelY}
                className={styles.label}
                fill={def.color}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {def.short}
              </text>
            );
          })}

          {/* Gradient defs */}
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.15" />
            </radialGradient>
          </defs>
        </svg>

        {/* Attribute legend */}
        <ul className={styles.legend}>
          {breakdown.map((attr) => {
            const def = ATTRIBUTES.find((a) => a.key === attr.key)!;
            return (
              <li key={attr.key} className={styles.legendItem}>
                <span className={styles.legendIcon} style={{ color: def.color }}>
                  {def.icon}
                </span>
                <div className={styles.legendInfo}>
                  <span className={styles.legendName}>
                    {def.label}
                    <span className={styles.legendLevel}>Nv {attr.level}</span>
                  </span>
                  <div className={styles.legendBar}>
                    <motion.div
                      className={styles.legendBarFill}
                      style={{ background: def.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${attr.progress * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    />
                  </div>
                </div>
                <span className={styles.legendXP}>
                  {attr.xpInLevel}/{attr.xpForNext}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
