'use client';

/**
 * Finanças — personal finance module. Fully isolated from the RPG system
 * (no XP/Gold). Tabs: Visão geral | Fixos mensais.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Repeat, Target } from 'lucide-react';
import {
  useFinance,
  FinanceOverview,
  TransactionForm,
  TransactionList,
  CategoryDonut,
  RecurringManager,
  BudgetManager,
} from '@/features/finance';
import styles from './financas.module.css';

type Tab = 'overview' | 'budget' | 'recurring';

export default function FinancasPage() {
  const {
    transactions, rules, budgets, budgetStatuses, month,
    summary, prevSummary, byCategory, totalBalance,
    addTx, removeTx, addRule, removeRule, toggleRule, updateBudget,
  } = useFinance();

  const [tab, setTab] = useState<Tab>('overview');

  const monthLabel = new Date(month + '-02T12:00:00').toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Finanças</h1>
          <p className={styles.subtitle}>{monthLabel}</p>
        </div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'overview' ? styles.tabActive : ''}`}
            onClick={() => setTab('overview')}
          >
            <LayoutGrid size={16} /> Visão geral
          </button>
          <button
            className={`${styles.tab} ${tab === 'budget' ? styles.tabActive : ''}`}
            onClick={() => setTab('budget')}
          >
            <Target size={16} /> Orçamento
          </button>
          <button
            className={`${styles.tab} ${tab === 'recurring' ? styles.tabActive : ''}`}
            onClick={() => setTab('recurring')}
          >
            <Repeat size={16} /> Fixos mensais
          </button>
        </div>
      </div>

      {tab === 'overview' && (
        <div className={styles.stack}>
          <FinanceOverview
            summary={summary}
            prevSummary={prevSummary}
            totalBalance={totalBalance}
          />

          <TransactionForm onAdd={addTx} />

          <CategoryDonut slices={byCategory} />

          <div>
            <h3 className={styles.sectionTitle}>Transações do mês</h3>
            <TransactionList
              transactions={transactions}
              month={month}
              onDelete={removeTx}
            />
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <BudgetManager
          budgets={budgets}
          statuses={budgetStatuses}
          onSetBudget={updateBudget}
        />
      )}

      {tab === 'recurring' && (
        <RecurringManager
          rules={rules}
          onAdd={addRule}
          onRemove={removeRule}
          onToggle={toggleRule}
        />
      )}
    </motion.div>
  );
}
