'use client';

/**
 * RecurringManager — fixed monthly income/expenses (aluguel, salário,
 * assinaturas). They auto-post on their day each month.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Plus, Repeat, Trash2, X } from 'lucide-react';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { useToast } from '@/shared/components/Toast';
import { categoriesFor, getCategory } from '../domain/categories';
import { formatBRL, type RecurringRule, type TxKind } from '../domain/finance.types';
import type { AddRuleInput } from '../services/finance.service';
import styles from './RecurringManager.module.css';

interface RecurringManagerProps {
  rules: RecurringRule[];
  onAdd: (input: AddRuleInput) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}

export function RecurringManager({ rules, onAdd, onRemove, onToggle }: RecurringManagerProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<TxKind>('despesa');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('moradia');
  const [description, setDescription] = useState('');
  const [day, setDay] = useState('5');

  const parsed = parseFloat(amount.replace(',', '.'));
  const valid = !isNaN(parsed) && parsed > 0 && description.trim() !== '';

  const switchKind = (k: TxKind) => {
    setKind(k);
    setCategoryId(categoriesFor(k)[0].id);
  };

  const reset = () => {
    setAmount('');
    setDescription('');
    setDay('5');
    setOpen(false);
  };

  const submit = () => {
    if (!valid) return;
    onAdd({
      kind,
      amount: parsed,
      categoryId,
      description,
      dayOfMonth: parseInt(day, 10) || 1,
    });
    toast.success('Recorrência criada — será lançada automaticamente todo mês');
    reset();
  };

  const handleRemove = async (r: RecurringRule) => {
    const ok = await confirm({
      title: 'Excluir recorrência?',
      message: `"${r.description}" não será mais lançada. Transações já criadas permanecem.`,
      danger: true,
      confirmLabel: 'Excluir',
    });
    if (ok) onRemove(r.id);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.title}>
            <Repeat size={16} /> Fixos mensais
          </h3>
          <p className={styles.subtitle}>
            Aluguel, salário, assinaturas — lançados sozinhos todo mês.
          </p>
        </div>
        {!open && (
          <button className="btn btn-secondary" onClick={() => setOpen(true)}>
            <Plus size={14} /> Adicionar
          </button>
        )}
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.form}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className={styles.formHead}>
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
              <button className={styles.closeBtn} onClick={reset} aria-label="Fechar">
                <X size={16} />
              </button>
            </div>

            <div className={styles.row}>
              <input
                className={styles.input}
                placeholder="Descrição (ex: Aluguel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className={styles.row}>
              <input
                className={styles.input}
                type="text"
                inputMode="decimal"
                placeholder="Valor R$"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <select
                className={styles.input}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                aria-label="Dia do mês"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>dia {d}</option>
                ))}
              </select>
            </div>
            <div className={styles.catGrid}>
              {categoriesFor(kind).map((c) => (
                <button
                  key={c.id}
                  className={`${styles.catBtn} ${categoryId === c.id ? styles.catActive : ''}`}
                  onClick={() => setCategoryId(c.id)}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <div className={styles.actions}>
              <button className="btn btn-secondary" onClick={reset}>Cancelar</button>
              <button className="btn btn-success" onClick={submit} disabled={!valid}>
                Criar recorrência
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {rules.length === 0 ? (
        <p className={styles.empty}>Nenhum fixo cadastrado.</p>
      ) : (
        <ul className={styles.list}>
          {rules.map((r) => {
            const cat = getCategory(r.categoryId);
            return (
              <li key={r.id} className={`${styles.item} ${!r.active ? styles.itemPaused : ''}`}>
                <span className={styles.itemIcon}>{cat?.icon ?? '💸'}</span>
                <div className={styles.itemInfo}>
                  <span className={styles.itemDesc}>{r.description}</span>
                  <span className={styles.itemMeta}>
                    todo dia {r.dayOfMonth} · {cat?.label ?? r.categoryId}
                  </span>
                </div>
                <span
                  className={`${styles.itemAmount} ${r.kind === 'receita' ? styles.income : styles.expense}`}
                >
                  {r.kind === 'receita' ? '+' : '−'} {formatBRL(r.amount)}
                </span>
                <button
                  className={styles.iconBtn}
                  onClick={() => onToggle(r.id)}
                  aria-label={r.active ? 'Pausar' : 'Retomar'}
                  title={r.active ? 'Pausar' : 'Retomar'}
                >
                  {r.active ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button
                  className={styles.iconBtn}
                  onClick={() => handleRemove(r)}
                  aria-label="Excluir"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
