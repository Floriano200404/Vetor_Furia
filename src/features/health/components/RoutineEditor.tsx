'use client';

/**
 * RoutineEditor — create/edit a routine (strength or cardio) in a modal.
 * Strength: pick exercises from the catalog + target sets.
 * Cardio: type + target minutes + intensity.
 * Both: name, icon, weekdays.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { EXERCISE_CATALOG, MUSCLE_GROUPS } from '../domain/exercise-catalog';
import {
  CARDIO_CATALOG, INTENSITY_LABEL,
  type CardioIntensity, type CardioType,
} from '../domain/cardio.types';
import {
  WEEKDAY_SHORT,
  type Routine,
  type NewRoutineInput,
  type RoutineExercise,
  type WeekDay,
} from '../domain/workout-routine';
import styles from './RoutineEditor.module.css';

const ALL_DAYS: WeekDay[] = [1, 2, 3, 4, 5, 6, 7];
const ICONS = ['💪', '🔙', '🦵', '🔥', '🏋️', '🫁', '🏃', '⚡', '🎯'];

interface RoutineEditorProps {
  initial?: Routine;
  onClose: () => void;
  onSave: (data: NewRoutineInput) => void;
}

export function RoutineEditor({ initial, onClose, onSave }: RoutineEditorProps) {
  const [kind, setKind] = useState<'strength' | 'cardio'>(initial?.kind ?? 'strength');
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '💪');
  const [days, setDays] = useState<WeekDay[]>(initial?.daysOfWeek ?? [1]);

  const [exercises, setExercises] = useState<RoutineExercise[]>(
    initial && initial.kind === 'strength' ? initial.exercises : [],
  );

  const [cardioType, setCardioType] = useState<CardioType>(
    initial && initial.kind === 'cardio' ? initial.cardioType : 'corrida',
  );
  const [targetMinutes, setTargetMinutes] = useState(
    initial && initial.kind === 'cardio' ? initial.targetMinutes : 30,
  );
  const [intensity, setIntensity] = useState<CardioIntensity>(
    initial && initial.kind === 'cardio' ? initial.intensity : 'moderada',
  );

  const toggleDay = (d: WeekDay) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const addExercise = (exName: string, mg: string, gif?: string) => {
    if (exercises.some((e) => e.name === exName)) return;
    setExercises((cur) => [...cur, { name: exName, muscleGroup: mg, gifUrl: gif, targetSets: 3 }]);
  };

  const setSets = (exName: string, delta: number) =>
    setExercises((cur) =>
      cur.map((e) =>
        e.name === exName
          ? { ...e, targetSets: Math.max(1, Math.min(10, e.targetSets + delta)) }
          : e,
      ),
    );

  const removeExercise = (exName: string) =>
    setExercises((cur) => cur.filter((e) => e.name !== exName));

  const canSave =
    name.trim() !== '' &&
    days.length > 0 &&
    (kind === 'cardio' ? targetMinutes > 0 : exercises.length > 0);

  const handleSave = () => {
    if (!canSave) return;
    if (kind === 'strength') {
      onSave({ kind: 'strength', name: name.trim(), icon, daysOfWeek: days, exercises });
    } else {
      onSave({
        kind: 'cardio', name: name.trim(), icon, daysOfWeek: days,
        cardioType, targetMinutes, intensity,
      });
    }
    onClose();
  };

  return (
    <motion.div
      className={styles.backdrop}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <header className={styles.header}>
          <h3>{initial ? 'Editar rotina' : 'Nova rotina'}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          {!initial && (
            <div className={styles.toggleRow}>
              <button
                className={`${styles.toggleBtn} ${kind === 'strength' ? styles.toggleActive : ''}`}
                onClick={() => setKind('strength')}
              >
                🏋️ Musculação
              </button>
              <button
                className={`${styles.toggleBtn} ${kind === 'cardio' ? styles.toggleActive : ''}`}
                onClick={() => setKind('cardio')}
              >
                🫁 Cardio
              </button>
            </div>
          )}

          <label className={styles.field}>
            <span>Nome</span>
            <input
              autoFocus
              placeholder={kind === 'strength' ? 'Ex: Treino A - Peito' : 'Ex: Corrida matinal'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className={styles.field}>
            <span>Ícone</span>
            <div className={styles.iconRow}>
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  className={`${styles.iconBtn} ${icon === ic ? styles.iconActive : ''}`}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span>Dias da semana</span>
            <div className={styles.daysRow}>
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  className={`${styles.dayBtn} ${days.includes(d) ? styles.dayActive : ''}`}
                  onClick={() => toggleDay(d)}
                >
                  {WEEKDAY_SHORT[d]}
                </button>
              ))}
            </div>
          </div>

          {kind === 'strength' ? (
            <>
              {exercises.length > 0 && (
                <div className={styles.field}>
                  <span>Exercícios da rotina ({exercises.length})</span>
                  <div className={styles.selectedList}>
                    {exercises.map((e) => (
                      <div key={e.name} className={styles.selectedItem}>
                        <span className={styles.selectedName}>{e.name}</span>
                        <div className={styles.setsCtrl}>
                          <button onClick={() => setSets(e.name, -1)} aria-label="menos série">
                            <Minus size={12} />
                          </button>
                          <span>{e.targetSets}x</span>
                          <button onClick={() => setSets(e.name, +1)} aria-label="mais série">
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeExercise(e.name)}
                          aria-label="remover"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <span>Adicionar exercícios</span>
                {MUSCLE_GROUPS.map((g) => (
                  <div key={g} className={styles.catGroup}>
                    <h5>{g}</h5>
                    <div className={styles.catGrid}>
                      {EXERCISE_CATALOG.filter((x) => x.muscleGroup === g).map((x) => {
                        const added = exercises.some((e) => e.name === x.name);
                        return (
                          <button
                            key={x.name}
                            className={`${styles.catItem} ${added ? styles.catAdded : ''}`}
                            onClick={() => addExercise(x.name, x.muscleGroup, x.gifUrl)}
                            disabled={added}
                          >
                            {x.name} {added ? '✓' : <Plus size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={styles.field}>
                <span>Atividade</span>
                <div className={styles.catGrid}>
                  {CARDIO_CATALOG.map((c) => (
                    <button
                      key={c.type}
                      className={`${styles.catItem} ${cardioType === c.type ? styles.catAdded : ''}`}
                      onClick={() => setCardioType(c.type)}
                    >
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.rowFields}>
                <label className={styles.field}>
                  <span>Duração alvo (min)</span>
                  <input
                    type="number"
                    min={1}
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(parseInt(e.target.value) || 0)}
                  />
                </label>
                <div className={styles.field}>
                  <span>Intensidade</span>
                  <div className={styles.toggleRow}>
                    {(['leve', 'moderada', 'intensa'] as CardioIntensity[]).map((i) => (
                      <button
                        key={i}
                        className={`${styles.toggleBtn} ${intensity === i ? styles.toggleActive : ''}`}
                        onClick={() => setIntensity(i)}
                      >
                        {INTENSITY_LABEL[i]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-success" onClick={handleSave} disabled={!canSave}>
            {initial ? 'Salvar alterações' : 'Criar rotina'}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
