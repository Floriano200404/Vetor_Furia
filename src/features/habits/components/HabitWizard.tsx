'use client';

/**
 * HabitWizard — multi-step modal to create a habit.
 *
 * Steps:
 *  1) Template gallery (or "começar do zero")
 *  2) Basics: name, icon, tracking type, target/unit if quantitative
 *  3) Schedule: daily / weekly days
 *  4) Reminders: list of HH:MM times
 *
 * The wizard is intentionally a single component (not 4 files) — splitting
 * would cost more in prop-drilling than it saves in line count.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BookOpen, Calendar, ChevronLeft, ChevronRight, Dumbbell,
  Heart, Sparkles, Trash2, Wand2, X,
} from 'lucide-react';
import {
  HABIT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type HabitTemplate,
} from '../domain/habit-templates';
import {
  WEEKDAY_SHORT,
  type HabitSchedule,
  type TrackingType,
  type WeekDay,
} from '../domain/habit.types';
import type { AddHabitInput } from '../services/habits.service';
import styles from './HabitWizard.module.css';

interface HabitWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: AddHabitInput) => void;
}

type Step = 'template' | 'basics' | 'schedule' | 'reminders';

const CATEGORY_ICONS = {
  health: Heart,
  study: BookOpen,
  wellness: Sparkles,
  fitness: Dumbbell,
} as const;

const COMMON_ICONS = ['🎯', '🔥', '⚡', '💪', '🧠', '📚', '💧', '🥗', '🏃', '🛌', '🎨', '🧘', '📵', '✍️', '🌍'];

const ALL_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 7];

const emptyDraft: AddHabitInput = {
  title: '',
  icon: '🎯',
  xpReward: 10,
  trackingType: 'binary',
  schedule: { type: 'daily' },
  reminderTimes: [],
};

export function HabitWizard({ isOpen, onClose, onCreate }: HabitWizardProps) {
  const [step, setStep] = useState<Step>('template');
  const [draft, setDraft] = useState<AddHabitInput>(emptyDraft);
  const [newTime, setNewTime] = useState('08:00');

  // Reset when reopened
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep('template');
       
      setDraft(emptyDraft);
       
      setNewTime('08:00');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const applyTemplate = (t: HabitTemplate) => {
    setDraft({
      title: t.title,
      icon: t.icon,
      xpReward: t.xpReward,
      trackingType: t.trackingType,
      target: t.target,
      unit: t.unit,
      schedule: t.schedule,
      reminderTimes: [...t.reminderTimes],
    });
    setStep('basics');
  };

  const startBlank = () => {
    setDraft(emptyDraft);
    setStep('basics');
  };

  const canAdvanceFromBasics =
    draft.title.trim() !== '' &&
    (draft.trackingType !== 'quantitative' ||
      ((draft.target ?? 0) > 0 && (draft.unit ?? '').trim() !== ''));

  const canAdvanceFromSchedule =
    draft.schedule?.type === 'daily' ||
    ((draft.schedule?.daysOfWeek?.length ?? 0) > 0);

  const handleFinish = () => {
    onCreate(draft);
    onClose();
  };

  const toggleDay = (d: WeekDay) => {
    const current = new Set(draft.schedule?.daysOfWeek ?? []);
    if (current.has(d)) current.delete(d);
    else current.add(d);
    setDraft((prev) => ({
      ...prev,
      schedule: { type: 'weekly', daysOfWeek: Array.from(current).sort() as WeekDay[] },
    }));
  };

  const setScheduleType = (type: 'daily' | 'weekly') => {
    setDraft((prev) => ({
      ...prev,
      schedule: type === 'daily'
        ? { type: 'daily' }
        : { type: 'weekly', daysOfWeek: prev.schedule?.daysOfWeek ?? [1, 2, 3, 4, 5] },
    }));
  };

  const addReminder = () => {
    if (!/^\d{2}:\d{2}$/.test(newTime)) return;
    if (draft.reminderTimes?.includes(newTime)) return;
    setDraft((prev) => ({
      ...prev,
      reminderTimes: [...(prev.reminderTimes ?? []), newTime].sort(),
    }));
  };

  const removeReminder = (t: string) => {
    setDraft((prev) => ({
      ...prev,
      reminderTimes: (prev.reminderTimes ?? []).filter((x) => x !== t),
    }));
  };

  return (
    <motion.div
      className={styles.backdrop}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
    >
      <motion.div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      >
        <header className={styles.header}>
          <h3 id="wizard-title" className={styles.title}>
            <Wand2 size={16} /> Novo Hábito
          </h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className={styles.stepIndicator}>
          {(['template', 'basics', 'schedule', 'reminders'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`${styles.stepDot} ${s === step ? styles.stepDotActive : ''}`}
              aria-label={`Passo ${i + 1}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className={styles.stepBody}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {step === 'template' && (
              <div>
                <p className={styles.hint}>
                  Comece de um modelo ou crie do zero.
                </p>
                <button
                  type="button"
                  className={styles.blankCard}
                  onClick={startBlank}
                >
                  <Sparkles size={16} /> Criar do zero
                </button>
                <div className={styles.templatesGrid}>
                  {HABIT_TEMPLATES.map((t) => {
                    const cat = TEMPLATE_CATEGORIES[t.category];
                    const Icon = CATEGORY_ICONS[t.category];
                    return (
                      <button
                        key={t.title}
                        type="button"
                        className={styles.templateCard}
                        onClick={() => applyTemplate(t)}
                      >
                        <span className={styles.templateIcon}>{t.icon}</span>
                        <div className={styles.templateInfo}>
                          <span className={styles.templateTitle}>{t.title}</span>
                          <span className={styles.templateMeta} style={{ color: cat.color }}>
                            <Icon size={11} /> {cat.label}
                            {t.trackingType === 'quantitative' && (
                              <> · {t.target} {t.unit}</>
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 'basics' && (
              <div className={styles.form}>
                <label className={styles.field}>
                  <span>Nome do hábito</span>
                  <input
                    autoFocus
                    placeholder="Ex: Beber água"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </label>

                <div className={styles.field}>
                  <span>Ícone</span>
                  <div className={styles.iconGrid}>
                    {COMMON_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        className={`${styles.iconBtn} ${draft.icon === ic ? styles.iconBtnActive : ''}`}
                        onClick={() => setDraft({ ...draft, icon: ic })}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <span>Como vou medir?</span>
                  <div className={styles.toggleRow}>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${draft.trackingType === 'binary' ? styles.toggleBtnActive : ''}`}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          trackingType: 'binary',
                          target: undefined,
                          unit: undefined,
                        })
                      }
                    >
                      Sim / Não
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${draft.trackingType === 'quantitative' ? styles.toggleBtnActive : ''}`}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          trackingType: 'quantitative',
                          target: draft.target ?? 5,
                          unit: draft.unit ?? 'vezes',
                        })
                      }
                    >
                      Contagem
                    </button>
                  </div>
                </div>

                {draft.trackingType === 'quantitative' && (
                  <div className={styles.row}>
                    <label className={styles.field} style={{ flex: 1 }}>
                      <span>Meta diária</span>
                      <input
                        type="number"
                        min={1}
                        value={draft.target ?? ''}
                        onChange={(e) =>
                          setDraft({ ...draft, target: parseInt(e.target.value, 10) || 0 })
                        }
                      />
                    </label>
                    <label className={styles.field} style={{ flex: 1 }}>
                      <span>Unidade</span>
                      <input
                        placeholder="L, min, vezes…"
                        value={draft.unit ?? ''}
                        onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                      />
                    </label>
                  </div>
                )}

                <label className={styles.field}>
                  <span>XP por completar</span>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={draft.xpReward}
                    onChange={(e) =>
                      setDraft({ ...draft, xpReward: parseInt(e.target.value, 10) || 10 })
                    }
                  />
                </label>
              </div>
            )}

            {step === 'schedule' && (
              <div className={styles.form}>
                <div className={styles.field}>
                  <span>Quando faço esse hábito?</span>
                  <div className={styles.toggleRow}>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${draft.schedule?.type === 'daily' ? styles.toggleBtnActive : ''}`}
                      onClick={() => setScheduleType('daily')}
                    >
                      Todo dia
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${draft.schedule?.type === 'weekly' ? styles.toggleBtnActive : ''}`}
                      onClick={() => setScheduleType('weekly')}
                    >
                      Dias específicos
                    </button>
                  </div>
                </div>

                {draft.schedule?.type === 'weekly' && (
                  <div className={styles.field}>
                    <span>Selecione os dias</span>
                    <div className={styles.daysGrid}>
                      {ALL_DAYS.map((d) => {
                        const active = (draft.schedule?.daysOfWeek ?? []).includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            className={`${styles.dayBtn} ${active ? styles.dayBtnActive : ''}`}
                            onClick={() => toggleDay(d)}
                          >
                            {WEEKDAY_SHORT[d]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 'reminders' && (
              <div className={styles.form}>
                <p className={styles.hint}>
                  Adicione horários para receber lembretes. Funciona com o app
                  aberto (PWA instalada na tela inicial). Sem horários = sem
                  notificações.
                </p>

                <div className={styles.row}>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addReminder}
                    disabled={!newTime}
                  >
                    <Bell size={14} /> Adicionar
                  </button>
                </div>

                {(draft.reminderTimes?.length ?? 0) > 0 ? (
                  <ul className={styles.remindersList}>
                    {draft.reminderTimes?.map((t) => (
                      <li key={t} className={styles.reminderItem}>
                        <Calendar size={12} />
                        <span>{t}</span>
                        <button
                          type="button"
                          className={styles.reminderRemove}
                          onClick={() => removeReminder(t)}
                          aria-label={`Remover lembrete ${t}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.hintMuted}>Sem lembretes configurados.</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <footer className={styles.footer}>
          {step !== 'template' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (step === 'basics') setStep('template');
                if (step === 'schedule') setStep('basics');
                if (step === 'reminders') setStep('schedule');
              }}
            >
              <ChevronLeft size={14} /> Voltar
            </button>
          )}

          <div style={{ flex: 1 }} />

          {step === 'basics' && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canAdvanceFromBasics}
              onClick={() => setStep('schedule')}
            >
              Próximo <ChevronRight size={14} />
            </button>
          )}

          {step === 'schedule' && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canAdvanceFromSchedule}
              onClick={() => setStep('reminders')}
            >
              Próximo <ChevronRight size={14} />
            </button>
          )}

          {step === 'reminders' && (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleFinish}
            >
              Criar hábito
            </button>
          )}
        </footer>
      </motion.div>
    </motion.div>
  );
}
