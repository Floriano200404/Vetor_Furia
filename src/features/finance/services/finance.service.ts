/**
 * Finance Service — transactions + recurring rules + aggregations.
 * Pure localStorage, isolated keys (vetor_furia_finance_*).
 */

import type {
  Transaction,
  RecurringRule,
  TxKind,
  MonthSummary,
  CategorySlice,
  Budget,
  BudgetStatus,
} from '../domain/finance.types';
import { monthKey, budgetStateOf } from '../domain/finance.types';
import { getCategory } from '../domain/categories';

const TX_KEY = 'vetor_furia_finance_tx';
const RULE_KEY = 'vetor_furia_finance_recurring';
const BUDGET_KEY = 'vetor_furia_finance_budgets';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(data));
}

// --- Transactions ---

export function getTransactions(): Transaction[] {
  return read<Transaction>(TX_KEY).sort((a, b) => b.date - a.date);
}

export interface AddTxInput {
  kind: TxKind;
  amount: number;
  categoryId: string;
  description: string;
  date?: number;
}

export function addTransaction(input: AddTxInput): Transaction {
  const tx: Transaction = {
    id: genId(),
    kind: input.kind,
    amount: Math.abs(input.amount),
    categoryId: input.categoryId,
    description: input.description.trim(),
    date: input.date ?? Date.now(),
    createdAt: Date.now(),
  };
  const all = read<Transaction>(TX_KEY);
  all.push(tx);
  write(TX_KEY, all);
  return tx;
}

/** Hashes of transactions already stored — used to skip import duplicates. */
export function getImportHashes(): Set<string> {
  const set = new Set<string>();
  for (const t of read<Transaction>(TX_KEY)) {
    if (t.importHash) set.add(t.importHash);
  }
  return set;
}

export interface ImportedRow {
  kind: TxKind;
  amount: number;
  categoryId: string;
  description: string;
  date: number;
  importHash: string;
}

/**
 * Batch-insert imported rows tagged with a source (bank) name. Returns the
 * count actually written.
 */
export function addImportedTransactions(
  rows: ImportedRow[],
  source: string,
): number {
  if (rows.length === 0) return 0;
  const all = read<Transaction>(TX_KEY);
  const now = Date.now();
  for (const r of rows) {
    all.push({
      id: genId(),
      kind: r.kind,
      amount: Math.abs(r.amount),
      categoryId: r.categoryId,
      description: r.description.trim(),
      date: r.date,
      source: source.trim() || 'Importado',
      importHash: r.importHash,
      createdAt: now,
    });
  }
  write(TX_KEY, all);
  return rows.length;
}

export function deleteTransaction(id: string): void {
  write(TX_KEY, read<Transaction>(TX_KEY).filter((t) => t.id !== id));
}

// --- Recurring rules ---

export function getRecurringRules(): RecurringRule[] {
  return read<RecurringRule>(RULE_KEY);
}

export interface AddRuleInput {
  kind: TxKind;
  amount: number;
  categoryId: string;
  description: string;
  dayOfMonth: number;
}

export function addRecurringRule(input: AddRuleInput): RecurringRule {
  const rule: RecurringRule = {
    id: genId(),
    kind: input.kind,
    amount: Math.abs(input.amount),
    categoryId: input.categoryId,
    description: input.description.trim(),
    dayOfMonth: Math.min(28, Math.max(1, Math.round(input.dayOfMonth))),
    active: true,
    createdAt: Date.now(),
  };
  const all = getRecurringRules();
  all.push(rule);
  write(RULE_KEY, all);
  return rule;
}

export function deleteRecurringRule(id: string): void {
  write(RULE_KEY, getRecurringRules().filter((r) => r.id !== id));
}

export function toggleRecurringRule(id: string): void {
  write(
    RULE_KEY,
    getRecurringRules().map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
  );
}

/**
 * Materialize active recurring rules for the CURRENT month.
 *
 * A rule generates one transaction per month, dated on its dayOfMonth, but
 * only once the current day has reached that dayOfMonth. Dedupe is by
 * (recurringId, competence="YYYY-MM"), so calling this repeatedly is safe.
 *
 * Returns how many transactions were created.
 */
export function materializeRecurring(now = new Date()): number {
  const rules = getRecurringRules().filter((r) => r.active);
  if (rules.length === 0) return 0;

  const all = read<Transaction>(TX_KEY);
  const comp = monthKey(now);
  const today = now.getDate();
  let created = 0;

  for (const rule of rules) {
    if (today < rule.dayOfMonth) continue; // not due yet this month
    const exists = all.some(
      (t) => t.recurringId === rule.id && t.competence === comp,
    );
    if (exists) continue;

    const dueDate = new Date(now.getFullYear(), now.getMonth(), rule.dayOfMonth, 12, 0, 0);
    all.push({
      id: genId(),
      kind: rule.kind,
      amount: rule.amount,
      categoryId: rule.categoryId,
      description: rule.description,
      date: dueDate.getTime(),
      recurringId: rule.id,
      competence: comp,
      createdAt: Date.now(),
    });
    created++;
  }

  if (created > 0) write(TX_KEY, all);
  return created;
}

// --- Aggregations ---

export function getMonthTransactions(month = monthKey()): Transaction[] {
  return getTransactions().filter((t) => monthKey(t.date) === month);
}

export function getMonthSummary(month = monthKey()): MonthSummary {
  const txs = getMonthTransactions(month);
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.kind === 'receita') income += t.amount;
    else expense += t.amount;
  }
  return {
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    balance: Math.round((income - expense) * 100) / 100,
    txCount: txs.length,
  };
}

/** All-time running balance (every income minus every expense). */
export function getTotalBalance(): number {
  let bal = 0;
  for (const t of getTransactions()) {
    bal += t.kind === 'receita' ? t.amount : -t.amount;
  }
  return Math.round(bal * 100) / 100;
}

export function getExpenseByCategory(month = monthKey()): CategorySlice[] {
  const txs = getMonthTransactions(month).filter((t) => t.kind === 'despesa');
  const totals = new Map<string, number>();
  for (const t of txs) {
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }
  const slices: CategorySlice[] = [];
  for (const [categoryId, total] of totals) {
    const cat = getCategory(categoryId);
    slices.push({
      categoryId,
      label: cat?.label ?? categoryId,
      color: cat?.color ?? '#64748b',
      icon: cat?.icon ?? '💸',
      total: Math.round(total * 100) / 100,
    });
  }
  return slices.sort((a, b) => b.total - a.total);
}

// --- Budgets ---

export function getBudgets(): Budget[] {
  return read<Budget>(BUDGET_KEY);
}

/** Upsert. A non-positive limit removes the budget for that category. */
export function setBudget(categoryId: string, monthlyLimit: number): void {
  const list = getBudgets().filter((b) => b.categoryId !== categoryId);
  if (monthlyLimit > 0) {
    list.push({ categoryId, monthlyLimit: Math.round(monthlyLimit * 100) / 100 });
  }
  write(BUDGET_KEY, list);
}

export function getBudgetFor(categoryId: string): Budget | undefined {
  return getBudgets().find((b) => b.categoryId === categoryId);
}

/** Spending status for every category that has a budget set. */
export function getBudgetStatuses(month = monthKey()): BudgetStatus[] {
  const budgets = getBudgets();
  if (budgets.length === 0) return [];

  const spentByCat = new Map<string, number>();
  for (const t of getMonthTransactions(month)) {
    if (t.kind !== 'despesa') continue;
    spentByCat.set(t.categoryId, (spentByCat.get(t.categoryId) ?? 0) + t.amount);
  }

  return budgets
    .map((b) => {
      const cat = getCategory(b.categoryId);
      const spent = Math.round((spentByCat.get(b.categoryId) ?? 0) * 100) / 100;
      return {
        categoryId: b.categoryId,
        label: cat?.label ?? b.categoryId,
        icon: cat?.icon ?? '💸',
        color: cat?.color ?? '#64748b',
        limit: b.monthlyLimit,
        spent,
        ratio: b.monthlyLimit > 0 ? spent / b.monthlyLimit : 0,
        state: budgetStateOf(spent, b.monthlyLimit),
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

/**
 * Status for one category after a hypothetical/just-added expense — used to
 * decide whether to fire an alert toast. Returns null if no budget set.
 */
export function getBudgetStatusForCategory(
  categoryId: string,
  month = monthKey(),
): BudgetStatus | null {
  return getBudgetStatuses(month).find((s) => s.categoryId === categoryId) ?? null;
}
