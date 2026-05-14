'use client';

/**
 * Habits Page — Daily habit checklist with templates, streaks, and XP rewards.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Flame, Trophy, Sparkles } from 'lucide-react';
import { HabitCard, HabitTemplateSelector, useHabits } from '@/features/habits';
import type { HabitTemplate } from '@/features/habits';
import styles from './habits.module.css';

const MOTIVATIONAL_QUOTES = [
  { text: 'A disciplina é a ponte entre metas e conquistas.', author: 'Jim Rohn' },
  { text: 'Você não precisa ser excelente para começar, mas precisa começar para ser excelente.', author: 'Zig Ziglar' },
  { text: 'O segredo para avançar é começar.', author: 'Mark Twain' },
  { text: 'Pequenas ações diárias criam transformações extraordinárias.', author: 'Robin Sharma' },
  { text: 'A consistência supera o talento quando o talento não é consistente.', author: 'Desconhecido' },
  { text: 'Não é sobre ter tempo. É sobre fazer tempo.', author: 'Desconhecido' },
  { text: 'O homem é aquilo que ele faz repetidamente. Excelência, então, não é um ato, mas um hábito.', author: 'Aristóteles' },
  { text: 'Faça hoje o que outros não querem. Amanha fará o que outros não podem.', author: 'Jerry Rice' },
  { text: 'A dor da disciplina é muito menor que a dor do arrependimento.', author: 'Desconhecido' },
  { text: 'Só existe um caminho para a felicidade e este consiste em parar de se preocupar com coisas que estão além do nosso poder.', author: 'Epícteto' },
  { text: 'A força não vem da vitória. Suas lutas desenvolvem suas forças.', author: 'Arnold Schwarzenegger' },
  { text: 'Você é o que faz consistentemente. Então, a excelência não é um ato, mas um hábito.', author: 'Shaquille O\'Neal' },
  { text: 'Não desista. O começo é sempre o mais difícil.', author: 'Desconhecido' },
  { text: 'Cada dia é uma nova oportunidade de se tornar quem você quer ser.', author: 'Desconhecido' },
];

function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
};

export default function HabitsPage() {
  const {
    habitsWithLogs,
    completedCount,
    totalCount,
    completionRate,
    addHabit,
    deleteHabit,
    toggleHabit,
  } = useHabits();

  const [showTemplates, setShowTemplates] = useState(false);

  const handleTemplateSelect = (template: HabitTemplate) => {
    addHabit({
      title: template.title,
      icon: template.icon,
      xpReward: template.xpReward,
    });
  };

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <motion.div
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className={styles.header} variants={itemVariants}>
        <div>
          <h1 className={styles.title}>Hábitos Diários</h1>
          <p className={styles.date}>{todayFormatted}</p>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={() => setShowTemplates(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={18} />
          Adicionar Hábito
        </motion.button>
      </motion.div>

      {/* Motivational Quote of the Day */}
      <motion.div className={styles.quoteCard} variants={itemVariants}>
        <Sparkles size={16} className={styles.quoteIcon} />
        <div className={styles.quoteContent}>
          <p className={styles.quoteText}>“{getDailyQuote().text}”</p>
          <span className={styles.quoteAuthor}>— {getDailyQuote().author}</span>
        </div>
      </motion.div>

      {/* Progress Overview */}
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

      {/* Habit List */}
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
            habitsWithLogs.map((hw) => (
              <HabitCard
                key={hw.habit.id}
                habitWithLog={hw}
                onToggle={toggleHabit}
                onDelete={deleteHabit}
              />
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Template Selector */}
      <HabitTemplateSelector
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
      />
    </motion.div>
  );
}
