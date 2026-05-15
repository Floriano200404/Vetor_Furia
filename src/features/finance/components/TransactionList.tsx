'use client';

/**
 * TransactionList — selected month's transactions, newest first, with delete.
 * Includes a filter bar: text search (description), kind, and category.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, Search, Trash2, X } from 'lucide-react';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { getCategory } from '../domain/categories';
import { formatBRL, monthKey, type Transaction, type TxKind } from '../domain/finance.types';
import styles from './TransactionList.module.css';

interface TransactionListProps {
  transactions: Transaction[];
  month: string;
  onDelete: (id: string) => void;
}

type KindFilter = 'todas' | TxKind;

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function TransactionList({ transactions, month, onDelete }: TransactionListProps) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('todas');
  const [categoryId, setCategoryId] = useState<string>('all');

  const monthTx = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === month),
    [transactions, month],
  );

  // Categories present this month (so the dropdown only offers what exists).
  const monthCategories = useMemo(() => {
    const ids = Array.from(new Set(monthTx.map((t) => t.categoryId)));
    return ids
      .map((id) => ({ id, cat: getCategory(id) }))
      .filter((x) => x.cat)
      .sort((a, b) => (a.cat!.label > b.cat!.label ? 1 : -1));
  }, [monthTx]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return monthTx.filter((t) => {
      if (kind !== 'todas' && t.kind !== kind) return false;
      if (categoryId !== 'all' && t.categoryId !== categoryId) return false;
      if (q) {
        const cat = getCategory(t.categoryId);
        const hay = `${t.description} ${cat?.label ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [monthTx, query, kind, categoryId]);

  const hasFilter = query.trim() !== '' || kind !== 'todas' || categoryId !== 'all';

  const clearFilters = () => {
    setQuery('');
    setKind('todas');
    setCategoryId('all');
  };

  const handleDelete = async (t: Transaction) => {
    const ok = await confirm({
      title: 'Excluir transação?',
      message: `"${t.description}" (${formatBRL(t.amount)}) será removida.`,
      danger: true,
      confirmLabel: 'Excluir',
    });
    if (ok) onDelete(t.id);
  };

  if (monthTx.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nenhuma transação neste mês ainda.</p>
        <span>Registre sua primeira entrada ou saída.</span>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          {query && (
            <button
              className={styles.clearInline}
              onClick={() => setQuery('')}
              aria-label="Limpar busca"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className={styles.kindChips}>
          {(['todas', 'receita', 'despesa'] as KindFilter[]).map((k) => (
            <button
              key={k}
              className={`${styles.chip} ${kind === k ? styles.chipActive : ''}`}
              onClick={() => setKind(k)}
            >
              {k === 'todas' ? 'Todas' : k === 'receita' ? 'Entradas' : 'Saídas'}
            </button>
          ))}
        </div>

        <select
          className={styles.catSelect}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label="Filtrar por categoria"
        >
          <option value="all">Todas as categorias</option>
          {monthCategories.map(({ id, cat }) => (
            <option key={id} value={id}>
              {cat!.icon} {cat!.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilter && (
        <div className={styles.filterMeta}>
          <span>
            {filtered.length} de {monthTx.length} transações
          </span>
          <button className={styles.clearAll} onClick={clearFilters}>
            <X size={12} /> limpar filtros
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhuma transação corresponde aos filtros.</p>
          <span>Tente ajustar a busca ou os filtros.</span>
        </div>
      ) : (
        <div className={styles.list}>
          <AnimatePresence>
            {filtered.map((t) => {
              const cat = getCategory(t.categoryId);
              const isIncome = t.kind === 'receita';
              return (
                <motion.div
                  key={t.id}
                  className={styles.row}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  layout
                >
                  <span
                    className={styles.catIcon}
                    style={{ background: `${cat?.color ?? '#64748b'}22`, color: cat?.color ?? '#64748b' }}
                  >
                    {cat?.icon ?? '💸'}
                  </span>
                  <div className={styles.info}>
                    <span className={styles.desc}>
                      {t.description}
                      {t.recurringId && (
                        <span className={styles.recBadge} title="Lançamento recorrente">
                          <Repeat size={10} /> fixo
                        </span>
                      )}
                    </span>
                    <span className={styles.meta}>
                      {cat?.label ?? t.categoryId} · {fmtDate(t.date)}
                    </span>
                  </div>
                  <span
                    className={`${styles.amount} ${isIncome ? styles.income : styles.expense}`}
                  >
                    {isIncome ? '+' : '−'} {formatBRL(t.amount)}
                  </span>
                  <button
                    className={styles.delBtn}
                    onClick={() => handleDelete(t)}
                    aria-label="Excluir transação"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
