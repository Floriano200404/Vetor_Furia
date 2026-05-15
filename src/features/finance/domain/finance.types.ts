/**
 * Finance Domain — personal finance, fully isolated from the RPG system
 * (no XP/Gold/HP). Single-balance model, pt-BR / BRL.
 */

export type TxKind = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  kind: TxKind;
  amount: number; // always positive; sign comes from `kind`
  categoryId: string;
  description: string;
  date: number; // timestamp of the transaction
  /** Set when this tx was auto-created from a recurring rule. */
  recurringId?: string;
  /** Competence month "YYYY-MM" — used to dedupe recurring materialization. */
  competence?: string;
  createdAt: number;
}

export interface RecurringRule {
  id: string;
  kind: TxKind;
  amount: number;
  categoryId: string;
  description: string;
  /** Day of month it falls due (1–28 to stay safe across months). */
  dayOfMonth: number;
  active: boolean;
  createdAt: number;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  kind: TxKind;
}

/** "YYYY-MM" for a given date. */
export function monthKey(d: Date | number = new Date()): string {
  const date = typeof d === 'number' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number; // income - expense (the month's net)
  txCount: number;
}

export interface CategorySlice {
  categoryId: string;
  label: string;
  color: string;
  icon: string;
  total: number;
}

/** Monthly spending limit for an expense category. */
export interface Budget {
  categoryId: string;
  monthlyLimit: number;
}

export type BudgetState = 'ok' | 'alerta' | 'estourou';

export interface BudgetStatus {
  categoryId: string;
  label: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  /** spent / limit; can exceed 1 when over budget. */
  ratio: number;
  state: BudgetState;
}

/** ok < 80% <= alerta <= 100% < estourou */
export function budgetStateOf(spent: number, limit: number): BudgetState {
  if (limit <= 0) return 'ok';
  const r = spent / limit;
  if (r > 1) return 'estourou';
  if (r >= 0.8) return 'alerta';
  return 'ok';
}
