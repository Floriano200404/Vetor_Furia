'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell, Plus, X, Scale, BarChart3, History, ListChecks, Activity, CalendarClock,
} from 'lucide-react';
import {
  useWorkouts, useBiometry,
  DEFAULT_BIOMARKERS, classifyBiomarker,
  BiometryChart, BodySummary, BodyAvatar, BodyTimelineSlider, ProgressPhotos,
  WorkoutHistoryList, NewWorkoutForm, WorkoutStatsPanel,
  CardioPanel, RoutinesPanel,
  materializeStrengthSession,
} from '@/features/health';
import type {
  StrengthRoutine, CardioRoutine, WorkoutDraftSeed, CardioSeed,
} from '@/features/health';
import { usePlayerStats, getAvatarEmoji } from '@/features/core-rpg';
import { RestTimer } from '@/shared/components/RestTimer';
import { useToast } from '@/shared/components/Toast';
import styles from './workouts.module.css';

type TopTab = 'workouts' | 'cardio' | 'biometry';
type WorkoutSubTab = 'list' | 'new' | 'routines' | 'stats';

export default function WorkoutsPage() {
  const { workouts, addWorkout, deleteWorkout } = useWorkouts();
  const { records: bioRecs, addBiometry } = useBiometry();
  const { stats } = usePlayerStats();
  const toast = useToast();

  const [tab, setTab] = useState<TopTab>('workouts');
  const [subTab, setSubTab] = useState<WorkoutSubTab>('list');

  // Bumped each time we enter the stats tab so the chart re-mounts and
  // re-reads localStorage (picks up workouts saved seconds earlier).
  const [statsKey, setStatsKey] = useState(0);

  // Biometry form
  const [showBio, setShowBio] = useState(false);
  const [bw, setBw] = useState('');
  const [bh, setBh] = useState('');
  const [bm, setBm] = useState<Record<string, string>>({});

  // Rest Timer
  const [timerOpen, setTimerOpen] = useState(false);

  // Session started from a routine: seed pre-fills the form; sessionKey forces
  // a clean remount so the seed is picked up by the lazy state initializer.
  const [strengthSeed, setStrengthSeed] = useState<WorkoutDraftSeed | undefined>();
  const [cardioSeed, setCardioSeed] = useState<CardioSeed | undefined>();
  const [sessionKey, setSessionKey] = useState(0);

  const handleSubTab = (next: WorkoutSubTab) => {
    if (next === 'stats') setStatsKey((k) => k + 1);
    setSubTab(next);
  };

  const handleStartStrength = (routine: StrengthRoutine) => {
    const { name, exercises, notes } = materializeStrengthSession(routine);
    setStrengthSeed({ name, exercises });
    setSessionKey((k) => k + 1);
    setSubTab('new');
    if (notes.length > 0) {
      toast.info(`Coach: ${notes[0]}${notes.length > 1 ? ` (+${notes.length - 1})` : ''}`);
    }
  };

  const handleStartCardio = (routine: CardioRoutine) => {
    setCardioSeed({
      type: routine.cardioType,
      durationMinutes: routine.targetMinutes,
      intensity: routine.intensity,
    });
    setSessionKey((k) => k + 1);
    setTab('cardio');
    toast.info(`Rotina "${routine.name}" carregada — ajuste e salve.`);
  };

  const handleSubmitWorkout = (data: {
    name: string;
    exercises: Parameters<typeof addWorkout>[0]['exercises'];
    durationMinutes: number;
  }) => {
    addWorkout(data);
    const xp = data.exercises.length > 0 ? 30 + Math.max(0, data.exercises.length - 1) * 2 : 0;
    toast.success(`Treino salvo! +${xp} XP`);
    setSubTab('list');
  };

  const saveBiometry = () => {
    const w = parseFloat(bw);
    const h = parseFloat(bh);
    if (isNaN(w) || isNaN(h)) return;
    const p: Record<string, number | string> = {};
    Object.entries(bm).forEach(([k, v]) => {
      const n = parseFloat(v);
      p[k] = isNaN(n) ? v : n;
    });
    addBiometry({ weight: w, height: h, biomarkers: p });
    toast.success('Biometria salva! +15 XP');
    setShowBio(false);
    setBw('');
    setBh('');
    setBm({});
  };

  return (
    <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className={styles.header}>
        <h1 className={styles.title}>Saúde & Treinos</h1>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'workouts' ? styles.tabActive : ''}`}
            onClick={() => setTab('workouts')}
          >
            <Dumbbell size={16} /> Treinos
          </button>
          <button
            className={`${styles.tab} ${tab === 'cardio' ? styles.tabActive : ''}`}
            onClick={() => setTab('cardio')}
          >
            <Activity size={16} /> Cardio
          </button>
          <button
            className={`${styles.tab} ${tab === 'biometry' ? styles.tabActive : ''}`}
            onClick={() => setTab('biometry')}
          >
            <Scale size={16} /> Biometria
          </button>
        </div>
      </div>

      {tab === 'workouts' && (
        <>
          <div className={styles.subTabs} role="tablist" aria-label="Seções de treinos">
            <button
              role="tab"
              aria-selected={subTab === 'list'}
              className={`${styles.subTab} ${subTab === 'list' ? styles.subTabActive : ''}`}
              onClick={() => handleSubTab('list')}
            >
              <History size={14} /> Meus Treinos
            </button>
            <button
              role="tab"
              aria-selected={subTab === 'new'}
              className={`${styles.subTab} ${subTab === 'new' ? styles.subTabActive : ''}`}
              onClick={() => handleSubTab('new')}
            >
              <ListChecks size={14} /> Novo Treino
            </button>
            <button
              role="tab"
              aria-selected={subTab === 'routines'}
              className={`${styles.subTab} ${subTab === 'routines' ? styles.subTabActive : ''}`}
              onClick={() => handleSubTab('routines')}
            >
              <CalendarClock size={14} /> Rotinas
            </button>
            <button
              role="tab"
              aria-selected={subTab === 'stats'}
              className={`${styles.subTab} ${subTab === 'stats' ? styles.subTabActive : ''}`}
              onClick={() => handleSubTab('stats')}
            >
              <BarChart3 size={14} /> Estatísticas
            </button>
          </div>

          {subTab === 'list' && (
            <WorkoutHistoryList
              workouts={workouts}
              onDelete={deleteWorkout}
              onStartNew={() => handleSubTab('new')}
            />
          )}

          {subTab === 'new' && (
            <NewWorkoutForm
              key={sessionKey}
              seed={strengthSeed}
              onSubmit={(d) => { handleSubmitWorkout(d); setStrengthSeed(undefined); }}
              onCancel={() => { setStrengthSeed(undefined); handleSubTab('list'); }}
              onSetCompleted={() => setTimerOpen(true)}
            />
          )}

          {subTab === 'routines' && (
            <RoutinesPanel
              onStartStrength={handleStartStrength}
              onStartCardio={handleStartCardio}
            />
          )}

          {subTab === 'stats' && <WorkoutStatsPanel refreshKey={statsKey} />}
        </>
      )}

      {tab === 'cardio' && (
        <CardioPanel
          key={sessionKey}
          seed={cardioSeed}
          onConsumeSeed={() => setCardioSeed(undefined)}
        />
      )}

      {tab === 'biometry' && !showBio && (
        <div>
          {/* Visual avatar at the top — gamification reward for filling biometry */}
          <div className={styles.avatarHeader}>
            <BodyAvatar
              biometry={bioRecs[0] || null}
              level={stats.level}
              levelEmoji={getAvatarEmoji(stats.level)}
              size="lg"
              showLabel
            />
          </div>

          <BodyTimelineSlider
            records={bioRecs}
            level={stats.level}
            levelEmoji={getAvatarEmoji(stats.level)}
          />

          <BodySummary latest={bioRecs[0] || null} allRecords={bioRecs} />
          <BiometryChart records={bioRecs} />
          <ProgressPhotos />

          <motion.button
            className="btn btn-primary"
            onClick={() => setShowBio(true)}
            whileHover={{ scale: 1.03 }}
            style={{ marginBottom: 'var(--space-lg)' }}
          >
            <Plus size={18} /> Registrar Biometria
          </motion.button>
          {bioRecs.length === 0 ? (
            <div className={styles.emptyState}>
              <Scale size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <h3>Nenhuma biometria registrada</h3>
              <p>Registre peso e altura para acompanhar sua evolução.</p>
            </div>
          ) : bioRecs.map((b) => (
            <div key={b.id} className={styles.biometryCard}>
              <div className={styles.biometryHeader}>
                <span className={styles.biometryDate}>
                  {new Date(b.measuredAt).toLocaleDateString('pt-BR')}
                </span>
                <span className={styles.xpBadge}>+15 XP</span>
              </div>
              <div className={styles.biometryStats}>
                <div className={styles.bioStat}>
                  <span className={styles.bioValue}>{b.weight} kg</span>
                  <span className={styles.bioLabel}>Peso</span>
                </div>
                <div className={styles.bioStat}>
                  <span className={styles.bioValue}>{b.height} cm</span>
                  <span className={styles.bioLabel}>Altura</span>
                </div>
                <div className={styles.bioStat}>
                  <span className={styles.bioValue}>
                    {(b.weight / Math.pow(b.height / 100, 2)).toFixed(1)}
                  </span>
                  <span className={styles.bioLabel}>IMC</span>
                </div>
              </div>
              {Object.keys(b.biomarkers).length > 0 && (
                <div className={styles.biomarkersGrid}>
                  {Object.entries(b.biomarkers).map(([k, v]) => {
                    const d = DEFAULT_BIOMARKERS.find((x) => x.key === k);
                    const cls = classifyBiomarker(k, v);
                    return (
                      <div key={k} className={styles.biomarkerItem}>
                        <span className={styles.biomarkerLabel}>
                          {d ? `${d.label} (${d.unit})` : k}
                        </span>
                        <span className={styles.biomarkerValue}>
                          <span style={{ marginRight: '4px' }}>{cls.emoji}</span>
                          <span style={{ color: cls.color }}>{v}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'biometry' && showBio && (
        <motion.div
          className={styles.formSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.formHeader}>
            <h3>Registrar Biometria</h3>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => { setShowBio(false); setBw(''); setBh(''); setBm({}); }}
            >
              <X size={18} />
            </button>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Peso (kg)</label>
              <input
                type="number" step="0.1" placeholder="80.5"
                value={bw} onChange={(e) => setBw(e.target.value)}
              />
            </div>
            <div className={styles.formField}>
              <label>Altura (cm)</label>
              <input
                type="number" placeholder="178"
                value={bh} onChange={(e) => setBh(e.target.value)}
              />
            </div>
          </div>
          <h4 className={styles.catalogTitle} style={{ marginTop: 'var(--space-lg)' }}>
            Biomarcadores (opcional)
          </h4>
          <div className={styles.biomarkersForm}>
            {DEFAULT_BIOMARKERS.map((x) => (
              <div key={x.key} className={styles.formField}>
                <label>{x.label} ({x.unit})</label>
                <input
                  type="number" step="0.1" placeholder="—"
                  value={bm[x.key] || ''}
                  onChange={(e) => setBm({ ...bm, [x.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className={styles.formActions}>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowBio(false); setBw(''); setBh(''); setBm({}); }}
            >
              Cancelar
            </button>
            <motion.button
              className="btn btn-success btn-lg"
              onClick={saveBiometry}
              disabled={!bw || !bh}
              whileHover={{ scale: 1.03 }}
            >
              Salvar (+15 XP)
            </motion.button>
          </div>
        </motion.div>
      )}

      <RestTimer isOpen={timerOpen} onClose={() => setTimerOpen(false)} />
    </motion.div>
  );
}
