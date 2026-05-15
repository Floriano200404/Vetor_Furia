'use client';

/**
 * ComparisonCard — "você vs você de 30 dias atrás" across key metrics.
 * Renders nothing if there's no comparable history.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, History } from 'lucide-react';
import { buildComparison } from '../services/comparison.service';
import styles from './ComparisonCard.module.css';

export function ComparisonCard() {
  const [metrics] = useState(() =>
    typeof window === 'undefined' ? [] : buildComparison(),
  );

  if (metrics.length === 0) return null;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <History size={16} className={styles.headerIcon} />
        <div>
          <h3 className={styles.title}>Você vs Você</h3>
          <p className={styles.subtitle}>Últimos 30 dias vs os 30 anteriores</p>
        </div>
      </header>

      <ul className={styles.list}>
        {metrics.map((m, idx) => {
          const noBaseline = m.deltaPct === null;
          const up = (m.deltaPct ?? 0) > 0;
          const flat = (m.deltaPct ?? 0) === 0;
          const good = noBaseline ? true : up === m.higherIsBetter;

          return (
            <motion.li
              key={m.key}
              className={styles.item}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <span className={styles.itemIcon}>{m.icon}</span>
              <div className={styles.itemInfo}>
                <span className={styles.itemLabel}>{m.label}</span>
                <span className={styles.itemValues}>
                  <strong>{m.current.toLocaleString('pt-BR')}{m.unit && ` ${m.unit}`}</strong>
                  <span className={styles.itemPrev}>
                    antes: {m.previous.toLocaleString('pt-BR')}{m.unit && ` ${m.unit}`}
                  </span>
                </span>
              </div>
              <span
                className={`${styles.delta} ${
                  noBaseline ? styles.deltaNeutral : good ? styles.deltaGood : styles.deltaBad
                }`}
              >
                {noBaseline ? (
                  <>novo</>
                ) : flat ? (
                  <><Minus size={12} /> 0%</>
                ) : up ? (
                  <><TrendingUp size={12} /> +{m.deltaPct}%</>
                ) : (
                  <><TrendingDown size={12} /> {m.deltaPct}%</>
                )}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
