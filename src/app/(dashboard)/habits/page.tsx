'use client';

/**
 * Habits Page — daily checklist + weekly grid + reminder dispatcher.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, CheckCircle2, ListChecks, Plus, Sparkles, Trophy } from 'lucide-react';
import {
  HabitCard,
  HabitWizard,
  WeeklyView,
  useHabits,
  useHabitReminders,
} from '@/features/habits';
import type { AddHabitInput } from '@/features/habits/services/habits.service';
import styles from './habits.module.css';

const MOTIVATIONAL_QUOTES = [
  { text: 'A disciplina é a ponte entre metas e conquistas.', author: 'Jim Rohn' },
  { text: 'Você não precisa ser excelente para começar, mas precisa começar para ser excelente.', author: 'Zig Ziglar' },
  { text: 'O segredo para avançar é começar.', author: 'Mark Twain' },
  { text: 'Pequenas ações diárias criam transformações extraordinárias.', author: 'Robin Sharma' },
  { text: 'A consistência supera o talento quando o talento não é consistente.', author: 'Desconhecido' },
  { text: 'Não é sobre ter tempo. É sobre fazer tempo.', author: 'Desconhecido' },
  { text: 'O homem é aquilo que ele faz repetidamente. Excelência, então, não é um ato, mas um hábito.', author: 'Aristóteles' },
  { text: 'Faça hoje o que outros não querem. Amanhã fará o que outros não podem.', author: 'Jerry Rice' },
  { text: 'A dor da disciplina é muito menor que a dor do arrependimento.', author: 'Desconhecido' },
  { text: 'A força não vem da vitória. Suas lutas desenvolvem suas forças.', author: 'Arnold Schwarzenegger' },
];

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
  );
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 200, damping: 20 },
  },
};

type View = 'today' | 'week';

export default function HabitsPage() {
  const {
    habitsWithLogs,
    todayHabits,
    completedCount,
    totalCount,
    completionRate,
    addHabit,
    deleteHabit,
    toggleHabit,
    incrementHabit,
  } = useHabits();

  const [showWizard, setShowWizard] = useState(false);
  const [view, setView] = useState<View>('today');

  // Reminders polling — only enabled on the Habits page.
  useHabitReminders(habitsWithLogs);

  const handleCreate = (input: AddHabitInput) => {
    addHabit(input);
  };

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Split habits in two groups: scheduled for today (active) vs off-day (dimmed)
  const offDayHabits = habitsWithLogs.filter((h) => !h.isScheduledToday);

  return (
    <motion.div
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className={styles.header} variants={itemVariants}>
        <div>
          <h1 className={styles.title}>Hábitos Diários</h1>
          <p className={styles.date}>{todayFormatted}</p>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={() => setShowWizard(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={18} />
          Adicionar Hábito
        </motion.button>
      </motion.div>

      <motion.div className={styles.quoteCard} variants={itemVariants}>
        <Sparkles size={16} className={styles.quoteIcon} />
        <div className={styles.quoteContent}>
          <p className={styles.quoteText}>“{getDailyQuote().text}”</p>
          <span className={styles.quoteAuthor}>— {getDailyQuote().author}</span>
        </div>
      </motion.div>

      <motion.div className={styles.viewTabs} variants={itemVariants} role="tablist">
        <button
          role="tab"
          aria-selected={view === 'today'}
          className={`${styles.viewTab} ${view === 'today' ? styles.viewTabActive : ''}`}
          onClick={() => setView('today')}
        >
          <ListChecks size={14} /> Hoje
        </button>
        <button
          role="tab"
          aria-selected={view === 'week'}
          className={`${styles.viewTab} ${view === 'week' ? styles.viewTabActive : ''}`}
          onClick={() => setView('week')}
        >
          <CalendarDays size={14} /> Semana
        </button>
      </motion.div>

      {view === 'today' && (
        <>
          <motion.div className={styles.progressSection} variants={itemVariants}>
            <div className={styles.progressCards}>
              <div className={styles.progressCard}>
                <div className={styles.progressRing}>
                  <svg viewBox="0 0 72 72" className={styles.progressSvg}>
                    <circle
                      cx="36" cy="36" r="30"
                      fill="none"
                      stroke="var(--bg-elevated)"
                      strokeWidth="6"
                    />
                    <motion.circle
                      cx="36" cy="36" r="30"
                      fill="none"
                      stroke="var(--accent-success)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={188.5}
                      initial={{ strokeDashoffset: 188.5 }}
                      animate={{ strokeDashoffset: 188.5 * (1 - completionRate) }}
                      transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                      transform="rotate(-90 36 36)"
                    />
                  </svg>
                  <span className={styles.progressPercent}>
                    {Math.round(completionRate * 100)}%
                  </span>
                </div>
                <div className={styles.progressInfo}>
                  <span className={styles.progressLabel}>Progresso Hoje</span>
                  <span className={styles.progressValue}>
                    {completedCount} de {totalCount} concluídos
                  </span>
                </div>
              </div>

              {completionRate === 1 && totalCount > 0 && (
                <motion.div
                  className={styles.allCompleteCard}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                >
                  <Trophy size={24} />
                  <span>Todos concluídos! +50 XP bônus 🎉</span>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div className={styles.listSection} variants={itemVariants}>
            <AnimatePresence mode="popLayout">
              {habitsWithLogs.length === 0 ? (
                <motion.div
                  className={styles.emptyState}
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle2 size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <h3>Nenhum hábito cadastrado</h3>
                  <p>Clique em &ldquo;Adicionar Hábito&rdquo; para começar sua rotina!</p>
                </motion.div>
              ) : (
                todayHabits.map((hw) => (
                  <HabitCard
                    key={hw.habit.id}
                    habitWithLog={hw}
                    onToggle={toggleHabit}
                    onIncrement={incrementHabit}
                    onDelete={deleteHabit}
                  />
                ))
              )}
            </AnimatePresence>

            {offDayHabits.length > 0 && (
              <div className={styles.offDaySection}>
                <h4 className={styles.offDayTitle}>Outros dias da semana</h4>
                {offDayHabits.map((hw) => (
                  <HabitCard
                    key={hw.habit.id}
                    habitWithLog={hw}
                    onToggle={toggleHabit}
                    onIncrement={incrementHabit}
                    onDelete={deleteHabit}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {view === 'week' && (
        <motion.div variants={itemVariants}>
          {habitsWithLogs.length === 0 ? (
            <div className={styles.emptyState}>
              <CalendarDays size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <h3>Nenhum hábito cadastrado</h3>
              <p>Adicione hábitos para ver sua rotina semanal.</p>
            </div>
          ) : (
            <WeeklyView habits={habitsWithLogs} />
          )}
        </motion.div>
      )}

      <HabitWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onCreate={handleCreate}
      />
    </motion.div>
  );
}
