'use client';

/**
 * WorkoutHistoryList — renders the saved workouts feed with 1RM badges and
 * confirmation-guarded delete.
 */

import { motion } from 'framer-motion';
import { Clock, Dumbbell, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { useToast } from '@/shared/components/Toast';
import { getWorkout1RM, isCompoundLift } from '../services/workout-analytics.service';
import type { Workout } from '../domain/workout.types';
import styles from './WorkoutHistoryList.module.css';

interface WorkoutHistoryListProps {
  workouts: Workout[];
  onDelete: (id: string) => void;
  onStartNew: () => void;
}

export function WorkoutHistoryList({
  workouts,
  onDelete,
  onStartNew,
}: WorkoutHistoryListProps) {
  const confirm = useConfirm();
  const toast = useToast();

  const handleDelete = async (workout: Workout) => {
    const ok = await confirm({
      title: 'Excluir treino?',
      message: `"${workout.name}" será removido permanentemente. Esta ação não pode ser desfeita.`,
      danger: true,
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    onDelete(workout.id);
    toast.info('Treino excluído.');
  };

  if (workouts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Dumbbell size={48} className={styles.emptyIcon} />
        <h3>Nenhum treino registrado</h3>
        <p>Use a aba &quot;Novo Treino&quot; para começar a ganhar XP.</p>
        <button className="btn btn-primary" onClick={onStartNew}>
          <Plus size={16} /> Criar primeiro treino
        </button>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {workouts.map((w) => (
        <motion.div
          key={w.id}
          className={styles.card}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.cardHeader}>
            <div>
              <h4 className={styles.name}>{w.name}</h4>
              <div className={styles.meta}>
                <span><Clock size={12} /> {w.durationMinutes}min</span>
                <span><Dumbbell size={12} /> {w.exercises.length} exercícios</span>
                <span className={styles.xpBadge}>+{w.totalXP} XP</span>
              </div>
            </div>
            <div className={styles.actions}>
              <span className={styles.date}>
                {new Date(w.date).toLocaleDateString('pt-BR')}
              </span>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => handleDelete(w)}
                aria-label={`Excluir ${w.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className={styles.exList}>
            {w.exercises.map((ex, idx) => {
              const oneRM = isCompoundLift(ex.name) ? getWorkout1RM(w, ex.name) : 0;
              // Compose key with workout id + index to survive legacy data where
              // ex.id might collide between rows. ex.id alone is not enough.
              return (
                <div key={`${w.id}-${idx}-${ex.id}`} className={styles.exRow}>
                  <span className={styles.exName}>
                    {ex.name}
                    {oneRM > 0 && (
                      <span className={styles.oneRMBadge} title="1RM estimado (Epley)">
                        <TrendingUp size={10} /> {oneRM} kg
                      </span>
                    )}
                  </span>
                  <span className={styles.exSets}>{ex.sets.length} séries</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
