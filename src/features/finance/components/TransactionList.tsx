'use client';

/**
 * TransactionList — current month's transactions, newest first, with delete.
 * Recurring-generated rows get a small badge.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, Trash2 } from 'lucide-react';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { getCategory } from '../domain/categories';
import { formatBRL, monthKey, type Transaction } from '../domain/finance.types';
import styles from './TransactionList.module.css';

interface TransactionListProps {
  transactions: Transaction[];
  month: string;
  onDelete: (id: string) => void;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function TransactionList({ transactions, month, onDelete }: TransactionListProps) {
  const confirm = useConfirm();
  const monthTx = transactions.filter((t) => monthKey(t.date) === month);

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
    <div className={styles.list}>
      <AnimatePresence>
        {monthTx.map((t) => {
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
  );
}
