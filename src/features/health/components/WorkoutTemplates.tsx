'use client';

import { motion } from 'framer-motion';
import { Dumbbell, Plus } from 'lucide-react';
import { WORKOUT_TEMPLATES } from '../domain/exercise-catalog';
import type { Exercise, WorkoutTemplate } from '../domain/workout.types';
import styles from './WorkoutTemplates.module.css';

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Materializes a template into a list of `Exercise` ready to be edited.
 * Each exercise gets a fresh id and an array of default sets.
 */
function instantiateTemplate(template: WorkoutTemplate): Exercise[] {
  return template.exercises.map((t) => ({
    id: genId(),
    name: t.name,
    muscleGroup: t.muscleGroup,
    gifUrl: t.gifUrl,
    sets: Array.from({ length: t.defaultSets }, () => ({
      reps: t.defaultReps,
      weight: 0,
      completed: false,
    })),
  }));
}

interface WorkoutTemplatesProps {
  onSelectTemplate: (template: WorkoutTemplate, exercises: Exercise[]) => void;
}

export function WorkoutTemplates({ onSelectTemplate }: WorkoutTemplatesProps) {
  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h4 className={styles.title}>
          <Dumbbell size={16} /> Templates rápidos
        </h4>
        <p className={styles.subtitle}>
          Comece de um modelo pronto e ajuste cargas/reps no formulário abaixo.
        </p>
      </header>

      <div className={styles.grid}>
        {WORKOUT_TEMPLATES.map((tpl) => (
          <motion.button
            key={tpl.id}
            type="button"
            className={`${styles.card} ${styles[`accent_${tpl.accent}`]}`}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectTemplate(tpl, instantiateTemplate(tpl))}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>{tpl.icon}</span>
              <span className={styles.cardCount}>
                {tpl.exercises.length} exercícios
              </span>
            </div>
            <h5 className={styles.cardName}>{tpl.name}</h5>
            <p className={styles.cardDesc}>{tpl.description}</p>

            <ul className={styles.exList}>
              {tpl.exercises.slice(0, 4).map((ex) => (
                <li key={ex.name} className={styles.exItem}>
                  <span className={styles.exDot} /> {ex.name}
                </li>
              ))}
              {tpl.exercises.length > 4 && (
                <li className={styles.exMore}>
                  +{tpl.exercises.length - 4} mais
                </li>
              )}
            </ul>

            <div className={styles.cardFooter}>
              <Plus size={14} /> Usar este template
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
