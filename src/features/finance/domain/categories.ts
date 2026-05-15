/**
 * Default categories (pt-BR). Users can't edit these in the MVP — custom
 * categories come in a later step. IDs are stable strings so transactions
 * keep referencing them safely.
 */

import type { Category } from './finance.types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Despesas
  { id: 'alimentacao', label: 'Alimentação', icon: '🍽️', color: '#ef4444', kind: 'despesa' },
  { id: 'transporte', label: 'Transporte', icon: '🚗', color: '#f59e0b', kind: 'despesa' },
  { id: 'moradia', label: 'Moradia', icon: '🏠', color: '#8b5cf6', kind: 'despesa' },
  { id: 'contas', label: 'Contas & Assinaturas', icon: '📄', color: '#06b6d4', kind: 'despesa' },
  { id: 'saude', label: 'Saúde', icon: '🏥', color: '#10b981', kind: 'despesa' },
  { id: 'educacao', label: 'Educação', icon: '📚', color: '#3b82f6', kind: 'despesa' },
  { id: 'lazer', label: 'Lazer', icon: '🎮', color: '#ec4899', kind: 'despesa' },
  { id: 'compras', label: 'Compras', icon: '🛍️', color: '#f97316', kind: 'despesa' },
  { id: 'outros_desp', label: 'Outros', icon: '💸', color: '#64748b', kind: 'despesa' },

  // Receitas
  { id: 'salario', label: 'Salário', icon: '💰', color: '#10b981', kind: 'receita' },
  { id: 'freela', label: 'Freelance', icon: '💼', color: '#06b6d4', kind: 'receita' },
  { id: 'investimentos', label: 'Investimentos', icon: '📈', color: '#a855f7', kind: 'receita' },
  { id: 'presente', label: 'Presente', icon: '🎁', color: '#ec4899', kind: 'receita' },
  { id: 'outros_rec', label: 'Outros', icon: '✨', color: '#64748b', kind: 'receita' },
];

const BY_ID = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category | undefined {
  return BY_ID.get(id);
}

export function categoriesFor(kind: 'receita' | 'despesa'): Category[] {
  return DEFAULT_CATEGORIES.filter((c) => c.kind === kind);
}
