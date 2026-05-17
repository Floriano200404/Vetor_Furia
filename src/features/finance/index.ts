export { useFinance } from './hooks/useFinance';
export { FinanceOverview } from './components/FinanceOverview';
export { TransactionForm } from './components/TransactionForm';
export { TransactionList } from './components/TransactionList';
export { CategoryDonut } from './components/CategoryDonut';
export { RecurringManager } from './components/RecurringManager';
export { BudgetManager } from './components/BudgetManager';
export { MonthNavigator } from './components/MonthNavigator';
export { ImportStatement } from './components/ImportStatement';
export { formatBRL, monthKey, monthLabel, shiftMonth, budgetStateOf } from './domain/finance.types';
export type {
  Transaction,
  RecurringRule,
  Category,
  TxKind,
  MonthSummary,
  CategorySlice,
  Budget,
  BudgetStatus,
  BudgetState,
} from './domain/finance.types';
export { DEFAULT_CATEGORIES, getCategory, categoriesFor } from './domain/categories';
