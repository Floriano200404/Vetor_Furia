'use client';

/**
 * QuestDiaria — a "Quest Diária" do Sistema (estilo Solo Leveling).
 *
 * Reframe os hábitos agendados pra hoje como a missão diária do Sistema,
 * com contagem regressiva até a meia-noite e uma Janela do Sistema ao
 * concluir tudo. Lê os mesmos dados de `useHabits` (sem IO próprio).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Check, Clock } from 'lucide-react';
import Link from 'next/link';
import { useHabits } from '@/features/habits';
import { useSystem, sendWhatsApp } from '@/features/system';
import styles from './QuestDiaria.module.css';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

function msUntilMidnight(): number {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - Date.now();
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function QuestDiaria() {
  const { habitsWithLogs } = useHabits();
  const system = useSystem();

  const scheduled = useMemo(
    () => habitsWithLogs.filter((h) => h.isScheduledToday),
    [habitsWithLogs],
  );
  const total = scheduled.length;
  const completed = scheduled.filter((h) => h.log.completed).length;
  const allDone = total > 0 && completed === total;

  const [remaining, setRemaining] = useState(() => msUntilMidnight());
  useEffect(() => {
    const timer = setInterval(() => setRemaining(msUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dispara a Janela do Sistema na transição "tudo concluído" (uma vez).
  const wasDoneRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (wasDoneRef.current === null) {
      wasDoneRef.current = allDone; // estado inicial — não dispara
      return;
    }
    if (allDone && !wasDoneRef.current) {
      system.notify({
        title: 'QUEST DIÁRIA CONCLUÍDA',
        lines: [
          `Todas as ${total} missões do dia foram cumpridas.`,
          'Recuperação total. Você se fortaleceu, Caçador. ⚔️',
        ],
        variant: 'reward',
      });
      sendWhatsApp(`✅ Quest Diária concluída! Todas as ${total} missões cumpridas, Caçador. ⚔️`);
    }
    wasDoneRef.current = allDone;
  }, [allDone, total, system]);

  if (total === 0) {
    return (
      <section className={`${styles.card} ${styles.empty}`}>
        <header className={styles.head}>
          <Swords size={18} className={styles.headIcon} />
          <span className={styles.headLabel}>⟦ QUEST DIÁRIA ⟧</span>
        </header>
        <p className={styles.emptyText}>
          Nenhuma missão diária ativa. Defina seus hábitos pra o Sistema gerar sua quest.
        </p>
        <Link href="/habits" className={styles.cta}>Configurar hábitos</Link>
      </section>
    );
  }

  const urgent = !allDone && remaining < THREE_HOURS_MS;

  return (
    <section
      className={`${styles.card} ${allDone ? styles.done : ''} ${urgent ? styles.urgent : ''}`}
    >
      <header className={styles.head}>
        <Swords size={18} className={styles.headIcon} />
        <span className={styles.headLabel}>⟦ QUEST DIÁRIA ⟧</span>
        <span className={styles.countdown}>
          <Clock size={13} /> {allDone ? 'Concluída' : formatCountdown(remaining)}
        </span>
      </header>

      <div className={styles.progressRow}>
        <span className={styles.progressLabel}>{completed}/{total} missões</span>
        <div className={styles.bar}>
          <motion.div
            className={styles.fill}
            initial={false}
            animate={{ width: `${(completed / total) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <ul className={styles.list}>
        {scheduled.map((hw) => (
          <li
            key={hw.habit.id}
            className={`${styles.item} ${hw.log.completed ? styles.itemDone : ''}`}
          >
            <span className={styles.check}>{hw.log.completed && <Check size={14} />}</span>
            <span className={styles.itemIcon}>{hw.habit.icon}</span>
            <span className={styles.itemTitle}>{hw.habit.title}</span>
          </li>
        ))}
      </ul>

      {allDone ? (
        <p className={styles.doneText}>O Sistema reconhece seu esforço. ⚔️</p>
      ) : (
        <Link href="/habits" className={styles.cta}>
          {urgent ? 'O tempo está acabando — cumprir missões' : 'Cumprir missões'}
        </Link>
      )}
    </section>
  );
}
