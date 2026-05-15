'use client';

/**
 * BudgetManager — set a monthly limit per expense category and watch the
 * progress bar fill (green → amber at 80% → red when over).
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Target } from 'lucide-react';
import { categoriesFor } from '../domain/categories';
import {
  formatBRL,
  type Budget,
  type BudgetStatus,
} from '../domain/finance.types';
import styles from './BudgetManager.module.css';

interface BudgetManagerProps {
  budgets: Budget[];
  statuses: BudgetStatus[];
  onSetBudget: (categoryId: string, limit: number) => void;
}

const STATE_COLOR: Record<BudgetStatus['state'], string> = {
  ok: 'var(--accent-success)',
  alerta: 'var(--accent-warning)',
  estourou: 'var(--accent-danger)',
};

export function BudgetManager({ budgets, statuses, onSetBudget }: BudgetManagerProps) {
  const expenseCats = categoriesFor('despesa');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const limitOf = (catId: string): number =>
    budgets.find((b) => b.categoryId === catId)?.monthlyLimit ?? 0;

  const statusOf = (catId: string): BudgetStatus | undefined =>
    statuses.find((s) => s.categoryId === catId);

  const commit = (catId: string) => {
    const raw = drafts[catId];
    if (raw === undefined) return;
    const value = parseFloat(raw.replace(',', '.'));
    onSetBudget(catId, isNaN(value) ? 0 : value);
    setDrafts((d) => {
      const next = { ...d };
      delete next[catId];
      return next;
    });
  };

  const totalLimit = budgets.reduce((a, b) => a + b.monthlyLimit, 0);
  const totalSpent = statuses.reduce((a, s) => a + s.spent, 0);

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <Target size={16} className={styles.headerIcon} />
        <div>
          <h3 className={styles.title}>Orçamento mensal</h3>
          <p className={styles.subtitle}>
            Defina um limite por categoria. Alerta a 80%, vermelho ao estourar.
          </p>
        </div>
      </header>

      {budgets.length > 0 && (
        <div className={styles.totals}>
          <span>Total orçado: <strong>{formatBRL(totalLimit)}</strong></span>
          <span>
            Gasto: <strong style={{ color: totalSpent > totalLimit ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
              {formatBRL(totalSpent)}
            </strong>
          </span>
        </div>
      )}

      <ul className={styles.list}>
        {expenseCats.map((cat) => {
          const limit = limitOf(cat.id);
          const status = statusOf(cat.id);
          const hasBudget = limit > 0;
          const draft = drafts[cat.id];
          const pct = status ? Math.min(100, status.ratio * 100) : 0;
          const overflow = status && status.ratio > 1;

          return (
            <li key={cat.id} className={styles.item}>
              <div className={styles.itemTop}>
                <span className={styles.catName}>
                  <span className={styles.catIcon}>{cat.icon}</span>
                  {cat.label}
                </span>
                <div className={styles.limitInput}>
                  <span className={styles.currency}>R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="sem limite"
                    value={draft ?? (hasBudget ? String(limit) : '')}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [cat.id]: e.target.value }))
                    }
                    onBlur={() => commit(cat.id)}
                    onKeyDown={(e) => e.key === 'Enter' && commit(cat.id)}
                  />
                  {draft !== undefined && (
                    <button
                      className={styles.saveBtn}
                      onClick={() => commit(cat.id)}
                      aria-label="Salvar limite"
                    >
                      <Check size={13} />
                    </button>
                  )}
                </div>
              </div>

              {hasBudget && status && (
                <div className={styles.progressRow}>
                  <div className={styles.bar}>
                    <motion.div
                      className={styles.fill}
                      style={{ background: STATE_COLOR[status.state] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <span
                    className={styles.figures}
                    style={{ color: STATE_COLOR[status.state] }}
                  >
                    {overflow && <AlertTriangle size={12} />}
                    {formatBRL(status.spent)} / {formatBRL(status.limit)}
                    {' '}({Math.round(status.ratio * 100)}%)
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
