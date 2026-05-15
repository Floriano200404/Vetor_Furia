'use client';

/**
 * CategoryDonut — expense breakdown by category for the month (recharts).
 * Recharts is already a project dep (used by ProgressionChart).
 */

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatBRL, type CategorySlice } from '../domain/finance.types';
import styles from './CategoryDonut.module.css';

interface CategoryDonutProps {
  slices: CategorySlice[];
}

export function CategoryDonut({ slices }: CategoryDonutProps) {
  const total = slices.reduce((a, s) => a + s.total, 0);

  if (slices.length === 0) {
    return (
      <section className={styles.wrapper}>
        <h3 className={styles.title}>Gastos por categoria</h3>
        <p className={styles.empty}>Sem despesas neste mês.</p>
      </section>
    );
  }

  return (
    <section className={styles.wrapper}>
      <h3 className={styles.title}>Gastos por categoria</h3>
      <div className={styles.body}>
        <div className={styles.chartBox}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={slices}
                dataKey="total"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {slices.map((s) => (
                  <Cell key={s.categoryId} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.centerLabel}>
            <span className={styles.centerValue}>{formatBRL(total)}</span>
            <span className={styles.centerHint}>total</span>
          </div>
        </div>

        <ul className={styles.legend}>
          {slices.map((s) => {
            const pct = total > 0 ? Math.round((s.total / total) * 100) : 0;
            return (
              <li key={s.categoryId} className={styles.legendItem}>
                <span className={styles.dot} style={{ background: s.color }} />
                <span className={styles.legendName}>
                  {s.icon} {s.label}
                </span>
                <span className={styles.legendValue}>
                  {formatBRL(s.total)} <span className={styles.pct}>({pct}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
