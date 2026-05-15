'use client';

/**
 * useFinance — reactive wrapper. Materializes due recurring rules once on
 * mount, then exposes transactions, rules and the month aggregations.
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  Transaction,
  RecurringRule,
  MonthSummary,
  CategorySlice,
} from '../domain/finance.types';
import { monthKey } from '../domain/finance.types';
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
  getPreviousMonthSummary,
  getExpenseByCategory,
  getTotalBalance,
  type AddTxInput,
  type AddRuleInput,
} from '../services/finance.service';

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [month] = useState<string>(() => monthKey());

  const refresh = useCallback(() => {
    setTransactions(getTransactions());
    setRules(getRecurringRules());
  }, []);

  // Materialize recurring rules due this month, then load. Once on mount.
  useEffect(() => {
    materializeRecurring();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const addTx = useCallback((input: AddTxInput) => {
    addTransaction(input);
    refresh();
  }, [refresh]);

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

  const summary: MonthSummary = getMonthSummary(month);
  const prevSummary: MonthSummary = getPreviousMonthSummary();
  const byCategory: CategorySlice[] = getExpenseByCategory(month);
  const totalBalance = getTotalBalance();

  return {
    transactions,
    rules,
    month,
    summary,
    prevSummary,
    byCategory,
    totalBalance,
    addTx,
    removeTx,
    addRule,
    removeRule,
    toggleRule,
    refresh,
  };
}
