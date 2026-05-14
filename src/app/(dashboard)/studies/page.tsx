'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, BookOpen, Clock, Save, Trash2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTimer, useStudySessions, calculateStudyXP } from '@/features/studies';
import type { StudySession } from '@/features/studies';
import styles from './studies.module.css';

export default function StudiesPage() {
  const timer = useTimer(25);
  const { sessions, addSession, deleteSession } = useStudySessions();
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const handleStart = () => {
    if (!sessionStarted) { setStartTime(Date.now()); setSessionStarted(true); }
    timer.start();
  };

  const handleSave = () => {
    if (timer.minutes < 1 && timer.seconds < 30) return;
    addSession({ subject: subject || 'Sessão de Estudo', durationMinutes: Math.max(timer.minutes, 1), markdownNotes: notes, startedAt: startTime || Date.now() });
    setSubject(''); setNotes(''); setSessionStarted(false); timer.reset();
  };

  const potentialXP = calculateStudyXP(timer.minutes, notes.trim().length > 0);
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <motion.div className={styles.page} initial={{opacity:0}} animate={{opacity:1}}>
      <h1 className={styles.title}>Estudos</h1>

      {/* Timer Section */}
      <div className={styles.timerSection}>
        <div className={styles.timerCard}>
          {/* Circular Timer */}
          <div className={styles.timerRing}>
            <svg viewBox="0 0 200 200" className={styles.timerSvg}>
              <circle cx="100" cy="100" r="88" fill="none" stroke="var(--bg-elevated)" strokeWidth="8"/>
              <motion.circle
                cx="100" cy="100" r="88"
                fill="none" stroke="url(#timerGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={553}
                animate={{ strokeDashoffset: 553 * (1 - (timer.progress || 0)) }}
                transition={{ type:'spring', stiffness:40, damping:15 }}
                transform="rotate(-90 100 100)"
              />
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-primary)"/>
                  <stop offset="100%" stopColor="var(--accent-secondary)"/>
                </linearGradient>
              </defs>
            </svg>
            <div className={styles.timerDisplay}>
              <span className={styles.timerTime}>{pad(timer.minutes)}:{pad(timer.seconds)}</span>
              <span className={styles.timerLabel}>{timer.isComplete ? '✅ Completo!' : timer.isRunning ? 'Focando...' : 'Pronto'}</span>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.timerControls}>
            {!timer.isRunning ? (
              <motion.button className="btn btn-primary btn-lg" onClick={handleStart} whileHover={{scale:1.05}} whileTap={{scale:0.95}}>
                <Play size={20}/> {sessionStarted ? 'Continuar' : 'Iniciar'}
              </motion.button>
            ) : (
              <motion.button className="btn btn-secondary btn-lg" onClick={timer.pause} whileHover={{scale:1.05}} whileTap={{scale:0.95}}>
                <Pause size={20}/> Pausar
              </motion.button>
            )}
            <button className="btn btn-ghost" onClick={()=>{timer.reset();setSessionStarted(false);}}>
              <RotateCcw size={16}/> Reset
            </button>
          </div>

          {/* Duration selector */}
          <div className={styles.durationSelector}>
            {[15,25,45,60].map(m=>(
              <button key={m} className={`${styles.durationBtn} ${timer.target===m*60?styles.durationActive:''}`} onClick={()=>{timer.setTargetMin(m);if(!timer.isRunning)timer.reset();}}>
                {m}min
              </button>
            ))}
          </div>

          {/* Session meta */}
          <div className={styles.sessionMeta}>
            <div className={styles.formField}><label>Matéria / Tópico</label><input placeholder="Ex: React Hooks, Cálculo II" value={subject} onChange={e=>setSubject(e.target.value)}/></div>
            {potentialXP > 0 && <div className={styles.xpPreview}>Potencial: <strong>+{potentialXP} XP</strong></div>}
          </div>
        </div>

        {/* Notes Editor */}
        <div className={styles.notesCard}>
          <div className={styles.notesHeader}>
            <h3><FileText size={16}/> Notas & Resumo</h3>
            <div className={styles.notesTabs}>
              <button className={`${styles.noteTab} ${!showPreview?styles.noteTabActive:''}`} onClick={()=>setShowPreview(false)}>Editar</button>
              <button className={`${styles.noteTab} ${showPreview?styles.noteTabActive:''}`} onClick={()=>setShowPreview(true)}>Preview</button>
            </div>
          </div>
          {!showPreview ? (
            <textarea className={styles.notesEditor} placeholder="Escreva suas anotações em Markdown...&#10;&#10;# Título&#10;- Ponto importante&#10;- Outro ponto&#10;&#10;**Negrito** e _itálico_" value={notes} onChange={e=>setNotes(e.target.value)}/>
          ) : (
            <div className={styles.notesPreview}>
              {notes ? <ReactMarkdown remarkPlugins={[remarkGfm]} children={notes} /> : <p className={styles.previewEmpty}>Nenhuma nota escrita ainda.</p>}
            </div>
          )}
          {(timer.minutes >= 1 || timer.seconds >= 30) && (
            <div className={styles.saveSection}>
              <motion.button className="btn btn-success btn-lg" onClick={handleSave} whileHover={{scale:1.03}} whileTap={{scale:0.97}}>
                <Save size={18}/> Salvar Sessão {potentialXP > 0 && `(+${potentialXP} XP)`}
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Session History */}
      <div className={styles.historySection}>
        <h3 className={styles.sectionTitle}><Clock size={16}/> Sessões Anteriores</h3>
        {sessions.length === 0 ? (
          <div className={styles.emptyState}><BookOpen size={40} style={{color:'var(--text-muted)',opacity:0.4}}/><p>Nenhuma sessão registrada.</p></div>
        ) : sessions.map((s: StudySession) => (
          <div key={s.id} className={styles.sessionCard}>
            <div className={styles.sessionHeader}>
              <div><h4 className={styles.sessionSubject}>{s.subject}</h4><span className={styles.sessionDate}>{new Date(s.startedAt).toLocaleDateString('pt-BR')} · {s.durationMinutes}min</span></div>
              <div className={styles.sessionActions}><span className={styles.sessionXP}>+{s.xpEarned} XP</span><button className={styles.delBtn} onClick={()=>deleteSession(s.id)}><Trash2 size={14}/></button></div>
            </div>
            {s.markdownNotes && <div className={styles.sessionNotes}><ReactMarkdown remarkPlugins={[remarkGfm]} children={s.markdownNotes.slice(0,200) + (s.markdownNotes.length>200?'...':'')} /></div>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
