'use client';

/**
 * FinanceOverview — month income/expense/net + total balance + delta vs
 * previous month.
 */

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatBRL, type MonthSummary } from '../domain/finance.types';
import styles from './FinanceOverview.module.css';

interface FinanceOverviewProps {
  summary: MonthSummary;
  prevSummary: MonthSummary;
  totalBalance: number;
}

export function FinanceOverview({ summary, prevSummary, totalBalance }: FinanceOverviewProps) {
  const deltaVsPrev =
    prevSummary.balance === 0
      ? null
      : Math.round(((summary.balance - prevSummary.balance) / Math.abs(prevSummary.balance)) * 100);

  return (
    <section className={styles.wrapper}>
      <div className={styles.balanceCard}>
        <span className={styles.balanceLabel}>
          <Wallet size={14} /> Saldo total
        </span>
        <motion.span
          key={totalBalance}
          className={`${styles.balanceValue} ${totalBalance < 0 ? styles.negative : ''}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {formatBRL(totalBalance)}
        </motion.span>
      </div>

      <div className={styles.grid}>
        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ color: 'var(--accent-success)' }}>
            <ArrowUpRight size={18} />
          </span>
          <div>
            <span className={styles.statValue}>{formatBRL(summary.income)}</span>
            <span className={styles.statLabel}>Entradas (mês)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon} style={{ color: 'var(--accent-danger)' }}>
            <ArrowDownRight size={18} />
          </span>
          <div>
            <span className={styles.statValue}>{formatBRL(summary.expense)}</span>
            <span className={styles.statLabel}>Saídas (mês)</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <span
            className={styles.statIcon}
            style={{ color: summary.balance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}
          >
            {summary.balance >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </span>
          <div>
            <span className={styles.statValue}>{formatBRL(summary.balance)}</span>
            <span className={styles.statLabel}>
              Resultado do mês
              {deltaVsPrev !== null && (
                <span
                  className={deltaVsPrev >= 0 ? styles.deltaUp : styles.deltaDown}
                >
                  {' '}{deltaVsPrev >= 0 ? '+' : ''}{deltaVsPrev}% vs mês ant.
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
