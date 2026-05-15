'use client';

/**
 * RoutinesPanel — manage saved routines and start today's session.
 * "Iniciar" hands the routine up to the page, which opens the right
 * pre-filled form (strength → workout form, cardio → cardio panel).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { useToast } from '@/shared/components/Toast';
import { useRoutines } from '../hooks/useRoutines';
import {
  daysLabel,
  isStrengthRoutine,
  todayWeekDay,
  type Routine,
  type StrengthRoutine,
  type CardioRoutine,
} from '../domain/workout-routine';
import { RoutineEditor } from './RoutineEditor';
import styles from './RoutinesPanel.module.css';

interface RoutinesPanelProps {
  onStartStrength: (r: StrengthRoutine) => void;
  onStartCardio: (r: CardioRoutine) => void;
}

export function RoutinesPanel({ onStartStrength, onStartCardio }: RoutinesPanelProps) {
  const { routines, create, update, remove } = useRoutines();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState<Routine | 'new' | null>(null);

  const today = todayWeekDay();

  const handleDelete = async (r: Routine) => {
    const ok = await confirm({
      title: 'Excluir rotina?',
      message: `"${r.name}" será removida. O histórico de treinos não é afetado.`,
      danger: true,
      confirmLabel: 'Excluir',
    });
    if (ok) {
      remove(r.id);
      toast.info('Rotina excluída.');
    }
  };

  const start = (r: Routine) => {
    if (isStrengthRoutine(r)) onStartStrength(r);
    else onStartCardio(r);
  };

  // Today's routines first, then the rest.
  const ordered = [...routines].sort((a, b) => {
    const at = a.daysOfWeek.includes(today) ? 0 : 1;
    const bt = b.daysOfWeek.includes(today) ? 0 : 1;
    return at - bt;
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <p className={styles.intro}>
          Monte uma rotina uma vez. No dia, é só <strong>Iniciar</strong> — já
          vem com o peso sugerido pelo coach.
        </p>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Plus size={16} /> Nova rotina
        </button>
      </div>

      {ordered.length === 0 ? (
        <div className={styles.empty}>
          <CalendarClock size={44} className={styles.emptyIcon} />
          <h3>Nenhuma rotina ainda</h3>
          <p>Crie sua primeira rotina e pare de montar treino do zero todo dia.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {ordered.map((r) => {
            const isToday = r.daysOfWeek.includes(today);
            return (
              <motion.div
                key={r.id}
                className={`${styles.card} ${isToday ? styles.cardToday : ''}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className={styles.cardIcon}>{r.icon}</span>
                <div className={styles.cardInfo}>
                  <div className={styles.cardTitleRow}>
                    <span className={styles.cardName}>{r.name}</span>
                    {isToday && <span className={styles.todayTag}>hoje</span>}
                  </div>
                  <span className={styles.cardMeta}>
                    {r.kind === 'strength'
                      ? `${r.exercises.length} exercícios`
                      : `${r.cardioType} · ${r.targetMinutes}min`}
                    {' · '}
                    {daysLabel(r.daysOfWeek)}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    className={styles.startBtn}
                    onClick={() => start(r)}
                    aria-label={`Iniciar ${r.name}`}
                  >
                    <Play size={14} /> Iniciar
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => setEditing(r)}
                    aria-label="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => handleDelete(r)}
                    aria-label="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <RoutineEditor
            initial={editing === 'new' ? undefined : editing}
            onClose={() => setEditing(null)}
            onSave={(data) => {
              if (editing === 'new') {
                create(data);
                toast.success('Rotina criada!');
              } else {
                update(editing.id, data);
                toast.success('Rotina atualizada!');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
