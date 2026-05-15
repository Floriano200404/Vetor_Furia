'use client';

/**
 * useFinance — reactive wrapper. Materializes due recurring rules once on
 * mount, then exposes transactions, rules and the month aggregations.
 */

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/shared/components/Toast';
import type {
  Transaction,
  RecurringRule,
  MonthSummary,
  CategorySlice,
  Budget,
  BudgetStatus,
} from '../domain/finance.types';
import { monthKey, formatBRL, shiftMonth, isCurrentMonth } from '../domain/finance.types';
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  getRecurringRules,
  addRecurringRule,
  deleteRecurringRule,
  toggleRecurringRule,
  materializeRecurring,
  getMonthSummary,
  getExpenseByCategory,
  getTotalBalance,
  getBudgets,
  setBudget,
  getBudgetStatuses,
  getBudgetStatusForCategory,
  type AddTxInput,
  type AddRuleInput,
} from '../services/finance.service';

export function useFinance() {
  const toast = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  // Selected month ("YYYY-MM"). Navigable; defaults to the current month.
  const [month, setMonth] = useState<string>(() => monthKey());

  const goPrevMonth = useCallback(() => {
    setMonth((m) => shiftMonth(m, -1));
  }, []);

  const goNextMonth = useCallback(() => {
    // Never navigate past the current month (future is empty / not materialized).
    setMonth((m) => (isCurrentMonth(m) ? m : shiftMonth(m, 1)));
  }, []);

  const goCurrentMonth = useCallback(() => {
    setMonth(monthKey());
  }, []);

  const atCurrentMonth = isCurrentMonth(month);

  const refresh = useCallback(() => {
    setTransactions(getTransactions());
    setRules(getRecurringRules());
    setBudgets(getBudgets());
  }, []);

  // Materialize recurring rules due this month, then load. Once on mount.
  useEffect(() => {
    materializeRecurring();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const addTx = useCallback((input: AddTxInput) => {
    addTransaction(input);
    // Budget alert: only for expenses that have a budget set.
    if (input.kind === 'despesa') {
      const status = getBudgetStatusForCategory(input.categoryId);
      if (status && status.state === 'estourou') {
        toast.error(
          `Orçamento de ${status.label} estourado: ${formatBRL(status.spent)} / ${formatBRL(status.limit)}`,
        );
      } else if (status && status.state === 'alerta') {
        toast.warning(
          `${status.label} em ${Math.round(status.ratio * 100)}% do orçamento (${formatBRL(status.spent)} / ${formatBRL(status.limit)})`,
        );
      }
    }
    refresh();
  }, [refresh, toast]);

  const removeTx = useCallback((id: string) => {
    deleteTransaction(id);
    refresh();
  }, [refresh]);

  const addRule = useCallback((input: AddRuleInput) => {
    addRecurringRule(input);
    materializeRecurring(); // may apply immediately if already past dueday
    refresh();
  }, [refresh]);

  const removeRule = useCallback((id: string) => {
    deleteRecurringRule(id);
    refresh();
  }, [refresh]);

  const toggleRule = useCallback((id: string) => {
    toggleRecurringRule(id);
    refresh();
  }, [refresh]);

  const updateBudget = useCallback((categoryId: string, limit: number) => {
    setBudget(categoryId, limit);
    refresh();
  }, [refresh]);

  const summary: MonthSummary = getMonthSummary(month);
  // Delta is always vs the month BEFORE the selected one.
  const prevSummary: MonthSummary = getMonthSummary(shiftMonth(month, -1));
  const byCategory: CategorySlice[] = getExpenseByCategory(month);
  const totalBalance = getTotalBalance();
  const budgetStatuses: BudgetStatus[] = getBudgetStatuses(month);

  return {
    transactions,
    rules,
    budgets,
    budgetStatuses,
    month,
    atCurrentMonth,
    goPrevMonth,
    goNextMonth,
    goCurrentMonth,
    summary,
    prevSummary,
    byCategory,
    totalBalance,
    addTx,
    removeTx,
    addRule,
    removeRule,
    toggleRule,
    updateBudget,
    refresh,
  };
}
