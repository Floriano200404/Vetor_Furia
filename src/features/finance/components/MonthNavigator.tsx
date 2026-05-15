'use client';

/**
 * MonthNavigator — ◀ Mês Ano ▶ selector. The "next" arrow is disabled at
 * the current month (no point browsing empty future months).
 */

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { monthLabel } from '../domain/finance.types';
import styles from './MonthNavigator.module.css';

interface MonthNavigatorProps {
  month: string;
  atCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCurrent: () => void;
}

export function MonthNavigator({
  month,
  atCurrentMonth,
  onPrev,
  onNext,
  onCurrent,
}: MonthNavigatorProps) {
  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.arrow}
        onClick={onPrev}
        aria-label="Mês anterior"
      >
        <ChevronLeft size={16} />
      </button>

      <span className={styles.label}>{monthLabel(month)}</span>

      <button
        type="button"
        className={styles.arrow}
        onClick={onNext}
        disabled={atCurrentMonth}
        aria-label="Próximo mês"
      >
        <ChevronRight size={16} />
      </button>

      {!atCurrentMonth && (
        <button
          type="button"
          className={styles.todayBtn}
          onClick={onCurrent}
          title="Voltar ao mês atual"
        >
          <RotateCcw size={12} /> hoje
        </button>
      )}
    </div>
  );
}
