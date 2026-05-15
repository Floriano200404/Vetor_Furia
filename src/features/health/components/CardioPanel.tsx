'use client';

/**
 * CardioPanel — single-page panel for the Cardio tab. Combines:
 *  - weekly stats header
 *  - form to log a new session (collapsible)
 *  - history list with delete
 *
 * Kept as one file because all 3 are tightly coupled by `useCardio` and
 * splitting would force prop-drilling without real reuse.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Bike, Clock, Flame, Plus, Trash2, X,
} from 'lucide-react';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { useToast } from '@/shared/components/Toast';
import {
  CARDIO_CATALOG,
  INTENSITY_LABEL,
  calculateCardioXP,
  estimateCalories,
  type CardioIntensity,
  type CardioType,
} from '../domain/cardio.types';
import { useCardio } from '../hooks/useCardio';
import { useBiometry } from '../hooks/useBiometry';
import styles from './CardioPanel.module.css';

const INTENSITIES: CardioIntensity[] = ['leve', 'moderada', 'intensa'];

function findCatalog(type: CardioType) {
  return CARDIO_CATALOG.find((c) => c.type === type) ?? CARDIO_CATALOG[0];
}

export function CardioPanel() {
  const { sessions, weeklyMinutes, addSession, deleteSession } = useCardio();
  const { records: bioRecs } = useBiometry();
  const latestWeight = bioRecs[0]?.weight ?? null;
  const confirm = useConfirm();
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<CardioType>('corrida');
  const [duration, setDuration] = useState<number>(30);
  const [distance, setDistance] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [intensity, setIntensity] = useState<CardioIntensity>('moderada');
  const [notes, setNotes] = useState('');

  const estimatedXP = useMemo(
    () => calculateCardioXP(duration, intensity, parseFloat(distance) || undefined),
    [duration, intensity, distance],
  );

  const estimatedCalories = useMemo(
    () => estimateCalories(type, duration, latestWeight),
    [type, duration, latestWeight],
  );

  const resetForm = () => {
    setType('corrida');
    setDuration(30);
    setDistance('');
    setCalories('');
    setIntensity('moderada');
    setNotes('');
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (duration <= 0) return;
    const d = parseFloat(distance);
    const c = parseFloat(calories);
    addSession({
      type,
      durationMinutes: duration,
      distanceKm: !isNaN(d) && d > 0 ? d : undefined,
      caloriesKcal: !isNaN(c) && c > 0 ? c : estimatedCalories || undefined,
      intensity,
      notes: notes.trim() || undefined,
    });
    toast.success(`Cardio salvo! +${estimatedXP} XP`);
    resetForm();
  };

  const handleDelete = async (id: string, label: string) => {
    const ok = await confirm({
      title: 'Excluir sessão de cardio?',
      message: `"${label}" será removido permanentemente.`,
      danger: true,
      confirmLabel: 'Excluir',
    });
    if (ok) deleteSession(id);
  };

  return (
    <div className={styles.wrapper}>
      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Activity size={16} className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{weeklyMinutes} min</span>
            <span className={styles.statLabel}>esta semana</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Bike size={16} className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{sessions.length}</span>
            <span className={styles.statLabel}>sessões registradas</span>
          </div>
        </div>
      </div>

      {!showForm && (
        <motion.button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.02 }}
          style={{ marginBottom: 'var(--space-lg)' }}
        >
          <Plus size={18} /> Registrar Cardio
        </motion.button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            className={styles.formSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className={styles.formHeader}>
              <h3>Nova sessão</h3>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={resetForm}
                aria-label="Cancelar"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.field}>
              <label>Atividade</label>
              <div className={styles.typeGrid}>
                {CARDIO_CATALOG.map((c) => (
                  <button
                    key={c.type}
                    type="button"
                    className={`${styles.typeBtn} ${type === c.type ? styles.typeBtnActive : ''}`}
                    onClick={() => setType(c.type)}
                  >
                    <span className={styles.typeIcon}>{c.icon}</span>
                    <span className={styles.typeLabel}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field} style={{ flex: 1 }}>
                <label>Duração (min)</label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div className={styles.field} style={{ flex: 1 }}>
                <label>Distância (km, opcional)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="—"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div className={styles.field} style={{ flex: 1 }}>
                <label>
                  Calorias (kcal{estimatedCalories > 0 ? ` ~${estimatedCalories}` : ''})
                </label>
                <input
                  type="number"
                  placeholder={estimatedCalories > 0 ? String(estimatedCalories) : '—'}
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Intensidade</label>
              <div className={styles.intensityRow}>
                {INTENSITIES.map((i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.intBtn} ${intensity === i ? styles.intBtnActive : ''} ${styles[`int_${i}`]}`}
                    onClick={() => setIntensity(i)}
                  >
                    {INTENSITY_LABEL[i]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Notas (opcional)</label>
              <textarea
                rows={2}
                placeholder="Como foi a sessão?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
              <motion.button
                type="button"
                className="btn btn-success btn-lg"
                onClick={handleSubmit}
                disabled={duration <= 0}
                whileHover={{ scale: 1.02 }}
              >
                Salvar (+{estimatedXP} XP)
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {sessions.length === 0 ? (
        <div className={styles.empty}>
          <Activity size={48} className={styles.emptyIcon} />
          <h3>Nenhuma sessão de cardio</h3>
          <p>Registre uma corrida, bike ou caminhada pra ganhar XP.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {sessions.map((s) => {
            const cat = findCatalog(s.type);
            const label = s.customName ?? cat.label;
            return (
              <motion.div
                key={s.id}
                className={styles.card}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className={styles.cardIcon}>{cat.icon}</span>
                <div className={styles.cardInfo}>
                  <h4 className={styles.cardTitle}>{label}</h4>
                  <div className={styles.cardMeta}>
                    <span><Clock size={11} /> {s.durationMinutes} min</span>
                    {s.distanceKm && s.distanceKm > 0 && (
                      <span>📏 {s.distanceKm} km</span>
                    )}
                    {s.caloriesKcal && s.caloriesKcal > 0 && (
                      <span><Flame size={11} /> {s.caloriesKcal} kcal</span>
                    )}
                    <span className={`${styles.intensityBadge} ${styles[`int_${s.intensity}`]}`}>
                      {INTENSITY_LABEL[s.intensity]}
                    </span>
                    <span className={styles.xpBadge}>+{s.totalXP} XP</span>
                  </div>
                  {s.notes && <p className={styles.notes}>{s.notes}</p>}
                </div>
                <div className={styles.cardActions}>
                  <span className={styles.cardDate}>
                    {new Date(s.date).toLocaleDateString('pt-BR')}
                  </span>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(s.id, label)}
                    aria-label={`Excluir ${label}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
