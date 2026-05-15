export { useFinance } from './hooks/useFinance';
export { FinanceOverview } from './components/FinanceOverview';
export { TransactionForm } from './components/TransactionForm';
export { TransactionList } from './components/TransactionList';
export { CategoryDonut } from './components/CategoryDonut';
export { RecurringManager } from './components/RecurringManager';
export { formatBRL, monthKey } from './domain/finance.types';
export type {
  Transaction,
  RecurringRule,
  Category,
  TxKind,
  MonthSummary,
  CategorySlice,
} from './domain/finance.types';
export { DEFAULT_CATEGORIES, getCategory, categoriesFor } from './domain/categories';
