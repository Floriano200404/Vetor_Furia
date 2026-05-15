'use client';

/**
 * NewWorkoutForm — full form for creating a workout.
 *
 * Owns no persistence — receives the draft state via useWorkoutDraft and
 * calls onSubmit/onCancel with the materialized payload.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ChevronDown, ChevronUp, Plus, TrendingUp, X,
} from 'lucide-react';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { useToast } from '@/shared/components/Toast';
import { EXERCISE_CATALOG, MUSCLE_GROUPS } from '../domain/exercise-catalog';
import { getLastSessionForExercise } from '../services/workout-analytics.service';
import { getProgressionAdvice, type ProgressionAdvice } from '../domain/progression';
import { useWorkoutDraft, type WorkoutDraftSeed } from '../hooks/useWorkoutDraft';
import { WorkoutTemplates } from './WorkoutTemplates';
import type { Exercise, WorkoutTemplate } from '../domain/workout.types';
import styles from './NewWorkoutForm.module.css';

interface NewWorkoutFormProps {
  onSubmit: (data: {
    name: string;
    exercises: Exercise[];
    durationMinutes: number;
  }) => void;
  onCancel: () => void;
  /** Called when the user just completed a set — lets the host open the rest timer. */
  onSetCompleted?: () => void;
  /** Pre-fills the form (used when starting a session from a routine). */
  seed?: WorkoutDraftSeed;
}

export function NewWorkoutForm({
  onSubmit,
  onCancel,
  onSetCompleted,
  seed,
}: NewWorkoutFormProps) {
  const draft = useWorkoutDraft(seed);
  const confirm = useConfirm();
  const toast = useToast();

  // Progression advice per exercise. Synchronous localStorage reads memoized
  // so they don't run on every keystroke.
  const adviceByName = useMemo(() => {
    const data: Record<string, ProgressionAdvice> = {};
    draft.exercises.forEach((ex) => {
      if (!data[ex.name]) {
        const last = getLastSessionForExercise(ex.name);
        data[ex.name] = getProgressionAdvice(ex.name, last);
      }
    });
    return data;
  }, [draft.exercises]);

  const handleSelectTemplate = (template: WorkoutTemplate, exercises: Exercise[]) => {
    draft.setExercises(exercises);
    if (draft.name.trim() === '') draft.setName(template.name);
    toast.success(`Template "${template.name}" carregado!`);
  };

  const handleSubmit = () => {
    if (!draft.isValid) return;
    onSubmit({
      name: draft.name,
      exercises: draft.exercises,
      durationMinutes: draft.durationMinutes,
    });
    draft.reset();
  };

  const handleDiscard = async () => {
    if (!draft.isDirty) {
      onCancel();
      return;
    }
    const ok = await confirm({
      title: 'Descartar rascunho?',
      message: 'Você tem um treino em progresso. Os dados serão perdidos.',
      danger: true,
      confirmLabel: 'Descartar',
    });
    if (!ok) return;
    draft.reset();
    onCancel();
  };

  const handleToggleSet = (exId: string, idx: number) => {
    const becameCompleted = draft.toggleSetCompleted(exId, idx);
    if (becameCompleted && onSetCompleted) onSetCompleted();
  };

  return (
    <motion.div
      className={styles.section}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={styles.header}>
        <h3>Novo Treino</h3>
        {draft.isDirty && (
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={handleDiscard}
            title="Descartar rascunho"
            aria-label="Descartar rascunho"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <WorkoutTemplates onSelectTemplate={handleSelectTemplate} />

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="workout-name">Nome do Treino</label>
          <input
            id="workout-name"
            placeholder="Ex: Treino A - Peito"
            value={draft.name}
            onChange={(e) => draft.setName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="workout-duration">Duração (min)</label>
          <input
            id="workout-duration"
            type="number"
            value={draft.durationMinutes}
            onChange={(e) => draft.setDuration(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className={styles.catalog}>
        <h4 className={styles.catalogTitle}>Adicionar Exercícios</h4>
        {MUSCLE_GROUPS.map((g) => (
          <div key={g} className={styles.muscleGroup}>
            <h5 className={styles.muscleGroupTitle}>{g}</h5>
            <div className={styles.catalogGrid}>
              {EXERCISE_CATALOG.filter((e) => e.muscleGroup === g).map((ex) => (
                <motion.button
                  key={ex.name}
                  type="button"
                  className={styles.catalogItem}
                  onClick={() => draft.addExercise(ex.name, ex.muscleGroup, ex.gifUrl)}
                  whileHover={{ scale: 1.02 }}
                >
                  <span>{ex.name}</span>
                  <Plus size={14} />
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {draft.exercises.length > 0 && (
        <div className={styles.selected}>
          <h4 className={styles.catalogTitle}>
            Selecionados ({draft.exercises.length})
          </h4>
          {draft.exercises.map((ex) => {
            const advice = adviceByName[ex.name];
            const isExpanded = draft.expandedExerciseId === ex.id;
            return (
              <div key={ex.id} className={styles.exercise}>
                <div
                  className={styles.exHeader}
                  onClick={() => draft.setExpanded(isExpanded ? null : ex.id)}
                >
                  <div className={styles.exInfo}>
                    {ex.gifUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ex.gifUrl}
                        alt={ex.name}
                        className={styles.exGif}
                        loading="lazy"
                      />
                    )}
                    <div>
                      <span className={styles.exName}>{ex.name}</span>
                      <span className={styles.exMuscle}>{ex.muscleGroup}</span>
                    </div>
                  </div>
                  <div className={styles.exActions}>
                    <span className={styles.setCount}>{ex.sets.length} séries</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        draft.removeExercise(ex.id);
                      }}
                      aria-label={`Remover ${ex.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {advice && advice.status !== 'first-time' && (
                  <motion.div
                    className={`${styles.overload} ${styles[`adv_${advice.status}`]}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={styles.overloadIcon}>
                      <TrendingUp size={14} />
                    </div>
                    <div className={styles.overloadContent}>
                      <div className={styles.advHeadline}>{advice.headline}</div>
                      <div className={styles.overloadLast}>
                        Último: <strong>{advice.lastWeight}kg × {advice.lastTopReps} reps</strong>
                      </div>
                      <div className={styles.advDetail}>{advice.detail}</div>
                      {advice.loadBreakdown && (
                        <div className={styles.advBreakdown}>📐 {advice.loadBreakdown}</div>
                      )}
                      {advice.status === 'progress' && (
                        <button
                          type="button"
                          className={styles.advApply}
                          onClick={() =>
                            draft.applyOverloadSuggestion(
                              ex.id,
                              advice.suggestedWeight,
                              advice.suggestedReps,
                            )
                          }
                        >
                          Aplicar {advice.suggestedWeight}kg × {advice.suggestedReps}
                          {advice.addedPerSide
                            ? ` (+${advice.addedPerSide}kg/lado)`
                            : ` (+${advice.addedTotal}kg)`}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      className={styles.setsSection}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className={styles.setsHeader}>
                        <span>Série</span>
                        <span>Reps</span>
                        <span>Peso</span>
                        <span>✓</span>
                      </div>
                      {ex.sets.map((s, i) => (
                        <div
                          key={i}
                          className={`${styles.setRow} ${s.completed ? styles.setDone : ''}`}
                        >
                          <span className={styles.setNumber}>{i + 1}</span>
                          <input
                            type="number"
                            className={styles.setInput}
                            value={s.reps}
                            onChange={(e) =>
                              draft.updateSet(ex.id, i, 'reps', parseInt(e.target.value) || 0)
                            }
                            onFocus={(e) => e.target.select()}
                          />
                          <input
                            type="number"
                            className={styles.setInput}
                            value={s.weight}
                            onChange={(e) =>
                              draft.updateSet(ex.id, i, 'weight', parseFloat(e.target.value) || 0)
                            }
                            onFocus={(e) => e.target.select()}
                          />
                          <button
                            type="button"
                            className={`${styles.checkBtn} ${s.completed ? styles.checkBtnDone : ''}`}
                            onClick={() => handleToggleSet(ex.id, i)}
                            aria-label={s.completed ? 'Desmarcar série' : 'Marcar série como concluída'}
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => draft.addSet(ex.id)}
                      >
                        <Plus size={14} /> Série
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.formActions}>
        <button type="button" className="btn btn-secondary" onClick={handleDiscard}>
          Cancelar
        </button>
        <motion.button
          type="button"
          className="btn btn-success btn-lg"
          onClick={handleSubmit}
          disabled={!draft.isValid}
          whileHover={{ scale: 1.03 }}
        >
          Salvar Treino (+{draft.estimatedXP} XP)
        </motion.button>
      </div>
    </motion.div>
  );
}
