'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus, X, Scale, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useWorkouts, useBiometry, EXERCISE_CATALOG, MUSCLE_GROUPS, DEFAULT_BIOMARKERS } from '@/features/health';
import type { Exercise } from '@/features/health';
import styles from './workouts.module.css';

function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`; }

export default function WorkoutsPage() {
  const { workouts, addWorkout, deleteWorkout } = useWorkouts();
  const { records: bioRecs, addBiometry } = useBiometry();
  const [tab, setTab] = useState<'workouts'|'biometry'>('workouts');
  const [showForm, setShowForm] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [wName, setWName] = useState('');
  const [wDur, setWDur] = useState(60);
  const [exs, setExs] = useState<Exercise[]>([]);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [bw, setBw] = useState('');
  const [bh, setBh] = useState('');
  const [bm, setBm] = useState<Record<string,string>>({});

  const addEx = (n:string,mg:string,g:string)=> setExs([...exs,{id:genId(),name:n,muscleGroup:mg,gifUrl:g,sets:[{reps:12,weight:0,completed:false}]}]);
  const rmEx = (id:string)=> setExs(exs.filter(e=>e.id!==id));
  const addSet = (id:string)=> setExs(exs.map(e=>e.id===id?{...e,sets:[...e.sets,{reps:e.sets.at(-1)?.reps||12,weight:e.sets.at(-1)?.weight||0,completed:false}]}:e));
  const updSet = (id:string,i:number,f:'reps'|'weight',v:number)=> setExs(exs.map(e=>{if(e.id!==id)return e;const s=[...e.sets];s[i]={...s[i],[f]:v};return{...e,sets:s};}));

  const saveW = ()=>{if(!wName.trim()||!exs.length)return;addWorkout({name:wName,exercises:exs,durationMinutes:wDur});setWName('');setExs([]);setWDur(60);setShowForm(false);};
  const saveB = ()=>{const w=parseFloat(bw),h=parseFloat(bh);if(isNaN(w)||isNaN(h))return;const p:Record<string,number|string>={};Object.entries(bm).forEach(([k,v])=>{const n=parseFloat(v);p[k]=isNaN(n)?v:n;});addBiometry({weight:w,height:h,biomarkers:p});setShowBio(false);};

  return (
    <motion.div className={styles.page} initial={{opacity:0}} animate={{opacity:1}}>
      <div className={styles.header}>
        <h1 className={styles.title}>Saúde & Treinos</h1>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab==='workouts'?styles.tabActive:''}`} onClick={()=>setTab('workouts')}><Dumbbell size={16}/> Treinos</button>
          <button className={`${styles.tab} ${tab==='biometry'?styles.tabActive:''}`} onClick={()=>setTab('biometry')}><Scale size={16}/> Biometria</button>
        </div>
      </div>

      {tab==='workouts' && !showForm && (
        <div>
          <motion.button className="btn btn-primary" onClick={()=>setShowForm(true)} whileHover={{scale:1.03}} style={{marginBottom:'var(--space-lg)'}}><Plus size={18}/> Novo Treino</motion.button>
          {workouts.length===0?(
            <div className={styles.emptyState}><Dumbbell size={48} style={{color:'var(--text-muted)',opacity:0.4}}/><h3>Nenhum treino registrado</h3><p>Registre seu primeiro treino para ganhar XP!</p></div>
          ):workouts.map(w=>(
            <motion.div key={w.id} className={styles.workoutCard} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
              <div className={styles.workoutHeader}><div><h4 className={styles.workoutName}>{w.name}</h4><div className={styles.workoutMeta}><span><Clock size={12}/> {w.durationMinutes}min</span><span><Dumbbell size={12}/> {w.exercises.length} exercícios</span><span className={styles.xpBadge}>+{w.totalXP} XP</span></div></div><div className={styles.workoutActions}><span className={styles.workoutDate}>{new Date(w.date).toLocaleDateString('pt-BR')}</span><button className={styles.deleteBtn} onClick={()=>deleteWorkout(w.id)}><Trash2 size={14}/></button></div></div>
              <div className={styles.exerciseList}>{w.exercises.map(ex=>(<div key={ex.id} className={styles.exerciseSummary}><span>{ex.name}</span><span className={styles.exerciseSets}>{ex.sets.length} séries</span></div>))}</div>
            </motion.div>
          ))}
        </div>
      )}

      {tab==='workouts' && showForm && (
        <motion.div className={styles.formSection} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <div className={styles.formHeader}><h3>Novo Treino</h3><button className="btn btn-ghost btn-icon" onClick={()=>setShowForm(false)}><X size={18}/></button></div>
          <div className={styles.formGrid}><div className={styles.formField}><label>Nome do Treino</label><input placeholder="Ex: Treino A - Peito" value={wName} onChange={e=>setWName(e.target.value)}/></div><div className={styles.formField}><label>Duração (min)</label><input type="number" value={wDur} onChange={e=>setWDur(parseInt(e.target.value)||0)}/></div></div>

          <div className={styles.catalogSection}><h4 className={styles.catalogTitle}>Adicionar Exercícios</h4>
            {MUSCLE_GROUPS.map(g=><div key={g} className={styles.muscleGroup}><h5 className={styles.muscleGroupTitle}>{g}</h5><div className={styles.catalogGrid}>{EXERCISE_CATALOG.filter(e=>e.muscleGroup===g).map(ex=><motion.button key={ex.name} className={styles.catalogItem} onClick={()=>addEx(ex.name,ex.muscleGroup,ex.gifUrl)} whileHover={{scale:1.02}}><span>{ex.name}</span><Plus size={14}/></motion.button>)}</div></div>)}
          </div>

          {exs.length>0&&<div className={styles.selectedSection}><h4 className={styles.catalogTitle}>Selecionados ({exs.length})</h4>
            {exs.map(ex=><div key={ex.id} className={styles.selectedExercise}>
              <div className={styles.selectedHeader} onClick={()=>setExpanded(expanded===ex.id?null:ex.id)}>
                <div className={styles.selectedInfo}>{ex.gifUrl&&<img src={ex.gifUrl} alt={ex.name} className={styles.exerciseGif} loading="lazy"/>}<div><span className={styles.exerciseName}>{ex.name}</span><span className={styles.exerciseMuscle}>{ex.muscleGroup}</span></div></div>
                <div className={styles.selectedActions}><span className={styles.setCount}>{ex.sets.length} séries</span>{expanded===ex.id?<ChevronUp size={16}/>:<ChevronDown size={16}/>}<button className={styles.removeBtn} onClick={e=>{e.stopPropagation();rmEx(ex.id);}}><X size={14}/></button></div>
              </div>
              <AnimatePresence>{expanded===ex.id&&<motion.div className={styles.setsSection} initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
                <div className={styles.setsHeader}><span>Série</span><span>Reps</span><span>Peso</span></div>
                {ex.sets.map((s,i)=><div key={i} className={styles.setRow}><span className={styles.setNumber}>{i+1}</span><input type="number" className={styles.setInput} value={s.reps} onChange={e=>updSet(ex.id,i,'reps',parseInt(e.target.value)||0)}/><input type="number" className={styles.setInput} value={s.weight} onChange={e=>updSet(ex.id,i,'weight',parseFloat(e.target.value)||0)}/></div>)}
                <button className="btn btn-ghost btn-sm" onClick={()=>addSet(ex.id)}><Plus size={14}/> Série</button>
              </motion.div>}</AnimatePresence>
            </div>)}
          </div>}

          <div className={styles.formActions}><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancelar</button><motion.button className="btn btn-success btn-lg" onClick={saveW} disabled={!wName.trim()||!exs.length} whileHover={{scale:1.03}}>Salvar Treino (+{exs.length>0?30+Math.max(0,exs.length-1)*2:0} XP)</motion.button></div>
        </motion.div>
      )}

      {tab==='biometry' && !showBio && (
        <div>
          <motion.button className="btn btn-primary" onClick={()=>setShowBio(true)} whileHover={{scale:1.03}} style={{marginBottom:'var(--space-lg)'}}><Plus size={18}/> Registrar Biometria</motion.button>
          {bioRecs.length===0?(
            <div className={styles.emptyState}><Scale size={48} style={{color:'var(--text-muted)',opacity:0.4}}/><h3>Nenhuma biometria registrada</h3><p>Registre peso e altura para acompanhar sua evolução.</p></div>
          ):bioRecs.map(b=><div key={b.id} className={styles.biometryCard}>
            <div className={styles.biometryHeader}><span className={styles.biometryDate}>{new Date(b.measuredAt).toLocaleDateString('pt-BR')}</span><span className={styles.xpBadge}>+15 XP</span></div>
            <div className={styles.biometryStats}><div className={styles.bioStat}><span className={styles.bioValue}>{b.weight} kg</span><span className={styles.bioLabel}>Peso</span></div><div className={styles.bioStat}><span className={styles.bioValue}>{b.height} cm</span><span className={styles.bioLabel}>Altura</span></div><div className={styles.bioStat}><span className={styles.bioValue}>{(b.weight/Math.pow(b.height/100,2)).toFixed(1)}</span><span className={styles.bioLabel}>IMC</span></div></div>
            {Object.keys(b.biomarkers).length>0&&<div className={styles.biomarkersGrid}>{Object.entries(b.biomarkers).map(([k,v])=>{const d=DEFAULT_BIOMARKERS.find(x=>x.key===k);return<div key={k} className={styles.biomarkerItem}><span className={styles.biomarkerLabel}>{d?.label||k}</span><span className={styles.biomarkerValue}>{v}</span></div>;})}</div>}
          </div>)}
        </div>
      )}

      {tab==='biometry' && showBio && (
        <motion.div className={styles.formSection} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <div className={styles.formHeader}><h3>Registrar Biometria</h3><button className="btn btn-ghost btn-icon" onClick={()=>setShowBio(false)}><X size={18}/></button></div>
          <div className={styles.formGrid}><div className={styles.formField}><label>Peso (kg)</label><input type="number" step="0.1" placeholder="80.5" value={bw} onChange={e=>setBw(e.target.value)}/></div><div className={styles.formField}><label>Altura (cm)</label><input type="number" placeholder="178" value={bh} onChange={e=>setBh(e.target.value)}/></div></div>
          <h4 className={styles.catalogTitle} style={{marginTop:'var(--space-lg)'}}>Biomarcadores (opcional)</h4>
          <div className={styles.biomarkersForm}>{DEFAULT_BIOMARKERS.map(x=><div key={x.key} className={styles.formField}><label>{x.label}</label><input type="number" step="0.1" placeholder="—" value={bm[x.key]||''} onChange={e=>setBm({...bm,[x.key]:e.target.value})}/></div>)}</div>
          <div className={styles.formActions}><button className="btn btn-secondary" onClick={()=>setShowBio(false)}>Cancelar</button><motion.button className="btn btn-success btn-lg" onClick={saveB} disabled={!bw||!bh} whileHover={{scale:1.03}}>Salvar (+15 XP)</motion.button></div>
        </motion.div>
      )}
    </motion.div>
  );
}
