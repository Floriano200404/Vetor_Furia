'use client';

/**
 * TransactionForm — add a one-off income/expense. Collapsible.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/shared/components/Toast';
import { categoriesFor } from '../domain/categories';
import { formatBRL, type TxKind } from '../domain/finance.types';
import type { AddTxInput } from '../services/finance.service';
import styles from './TransactionForm.module.css';

interface TransactionFormProps {
  onAdd: (input: AddTxInput) => void;
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({ onAdd }: TransactionFormProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<TxKind>('despesa');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('alimentacao');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayInput());

  const cats = categoriesFor(kind);
  const parsed = parseFloat(amount.replace(',', '.'));
  const valid = !isNaN(parsed) && parsed > 0 && description.trim() !== '';

  const switchKind = (k: TxKind) => {
    setKind(k);
    setCategoryId(categoriesFor(k)[0].id);
  };

  const reset = () => {
    setAmount('');
    setDescription('');
    setDate(todayInput());
    setOpen(false);
  };

  const submit = () => {
    if (!valid) return;
    onAdd({
      kind,
      amount: parsed,
      categoryId,
      description,
      date: new Date(date + 'T12:00:00').getTime(),
    });
    toast.success(`${kind === 'receita' ? 'Entrada' : 'Saída'} de ${formatBRL(parsed)} registrada`);
    reset();
  };

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Plus size={18} /> Nova transação
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles.form}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.header}>
          <h3>Nova transação</h3>
          <button className={styles.closeBtn} onClick={reset} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.kindToggle}>
          <button
            className={`${styles.kindBtn} ${kind === 'despesa' ? styles.kindExpense : ''}`}
            onClick={() => switchKind('despesa')}
          >
            Saída
          </button>
          <button
            className={`${styles.kindBtn} ${kind === 'receita' ? styles.kindIncome : ''}`}
            onClick={() => switchKind('receita')}
          >
            Entrada
          </button>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Valor (R$)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </label>
          <label className={styles.field}>
            <span>Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        <label className={styles.field}>
          <span>Descrição</span>
          <input
            placeholder={kind === 'receita' ? 'Ex: Salário de maio' : 'Ex: Mercado'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className={styles.field}>
          <span>Categoria</span>
          <div className={styles.catGrid}>
            {cats.map((c) => (
              <button
                key={c.id}
                className={`${styles.catBtn} ${categoryId === c.id ? styles.catActive : ''}`}
                style={categoryId === c.id ? { borderColor: c.color, background: `${c.color}22` } : undefined}
                onClick={() => setCategoryId(c.id)}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button className="btn btn-secondary" onClick={reset}>Cancelar</button>
          <button
            className="btn btn-success"
            onClick={submit}
            disabled={!valid}
          >
            Salvar
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
