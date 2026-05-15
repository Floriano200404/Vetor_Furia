/**
 * Boss Battle — one daily challenge, deterministic per calendar day.
 *
 * Risk/reward: accepting is opt-in. If you accept and complete → bonus XP +
 * Gold. If you accept and the day ends unfulfilled → HP penalty (resolved
 * once, on the next app open). Not accepting = no stakes.
 */

import type { Workout, CardioSession } from '@/features/health';

export type BossKind = 'treino' | 'cardio' | 'habitos' | 'volume';
export type BossState = 'idle' | 'accepted' | 'won' | 'lost';

export interface BossBattle {
  date: string; // YYYY-MM-DD
  kind: BossKind;
  title: string;
  description: string;
  icon: string;
  target: number;
  xpReward: number;
  goldReward: number;
  hpPenalty: number;
}

interface BossRecord {
  date: string;
  state: BossState;
  /** true once the reward/penalty has been applied (idempotency guard). */
  settled: boolean;
}

const STORAGE_KEY = 'vetor_furia_boss_battle';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function readRaw<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

/** Deterministic seed from a date string (so the boss is stable all day). */
function seedFromDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getTodaysBoss(): BossBattle {
  const date = todayStr();
  const seed = seedFromDate(date);
  const kinds: BossKind[] = ['treino', 'cardio', 'habitos', 'volume'];
  const kind = kinds[seed % kinds.length];

  switch (kind) {
    case 'treino':
      return {
        date, kind,
        title: 'O Desafio do Ferro',
        description: 'Registre 1 treino completo hoje.',
        icon: '⚔️',
        target: 1,
        xpReward: 60,
        goldReward: 30,
        hpPenalty: 10,
      };
    case 'cardio':
      return {
        date, kind,
        title: 'Fôlego do Dragão',
        description: 'Acumule 20 minutos de cardio hoje.',
        icon: '🐉',
        target: 20,
        xpReward: 50,
        goldReward: 25,
        hpPenalty: 8,
      };
    case 'habitos':
      return {
        date, kind,
        title: 'Disciplina Inabalável',
        description: 'Complete todos os hábitos agendados pra hoje.',
        icon: '🛡️',
        target: 1,
        xpReward: 70,
        goldReward: 35,
        hpPenalty: 12,
      };
    case 'volume':
    default:
      return {
        date, kind,
        title: 'Levante a Montanha',
        description: 'Acumule 3.000 kg de volume em treinos hoje.',
        icon: '🗿',
        target: 3000,
        xpReward: 80,
        goldReward: 40,
        hpPenalty: 15,
      };
  }
}

function getRecord(): BossRecord | null {
  const all = readRaw<BossRecord>(STORAGE_KEY);
  const today = todayStr();
  return all.find((r) => r.date === today) ?? null;
}

function writeRecord(rec: BossRecord): void {
  if (typeof window === 'undefined') return;
  const all = readRaw<BossRecord>(STORAGE_KEY).filter((r) => r.date !== rec.date);
  // Keep only last 30 days of history.
  all.push(rec);
  const trimmed = all.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getBossState(): BossState {
  return getRecord()?.state ?? 'idle';
}

export function acceptBoss(): void {
  writeRecord({ date: todayStr(), state: 'accepted', settled: false });
}

/** Evaluate today's progress toward the boss objective. */
export function evaluateBossProgress(boss: BossBattle): { current: number; done: boolean } {
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const since = todayMidnight.getTime();

  if (boss.kind === 'treino' || boss.kind === 'volume') {
    const workouts = readRaw<Workout>('vetor_furia_workouts').filter((w) => w.date >= since);
    if (boss.kind === 'treino') {
      return { current: workouts.length, done: workouts.length >= boss.target };
    }
    let vol = 0;
    for (const w of workouts)
      for (const ex of w.exercises) for (const s of ex.sets) vol += s.weight * s.reps;
    return { current: Math.round(vol), done: vol >= boss.target };
  }

  if (boss.kind === 'cardio') {
    const mins = readRaw<CardioSession>('vetor_furia_cardio')
      .filter((c) => c.date >= since)
      .reduce((a, c) => a + c.durationMinutes, 0);
    return { current: mins, done: mins >= boss.target };
  }

  // habitos: all scheduled-today habits completed
  interface HLog { habitId: string; date: string; completed: boolean }
  const logs = readRaw<HLog>('vetor_furia_habit_logs').filter(
    (l) => l.date === todayStr() && l.completed,
  );
  const habits = readRaw<{ id: string }>('vetor_furia_habits');
  const done = habits.length > 0 && logs.length >= habits.length;
  return { current: logs.length, done };
}

/**
 * Resolve yesterday-or-earlier accepted battles that were never settled.
 * Returns the action to take ('won' | 'lost' | null) for the CURRENT day so
 * the UI can emit XP/Gold or HP events exactly once.
 */
export function settleToday(boss: BossBattle): 'won' | 'lost' | null {
  const rec = getRecord();
  if (!rec || rec.state !== 'accepted' || rec.settled) return null;

  const { done } = evaluateBossProgress(boss);
  if (done) {
    writeRecord({ ...rec, state: 'won', settled: true });
    return 'won';
  }
  // Not done yet — only "lost" if the day is effectively over isn't tracked
  // here; we let the UI mark win on completion. Losing is handled lazily:
  // when a NEW day's record is created while an old accepted one is unsettled.
  return null;
}

/**
 * Called on mount: if there's an unsettled ACCEPTED record from a previous
 * day, it's a loss. Returns the hpPenalty to apply (0 if nothing to do).
 */
export function reconcilePastLoss(): number {
  if (typeof window === 'undefined') return 0;
  const all = readRaw<BossRecord>(STORAGE_KEY);
  const today = todayStr();
  let penalty = 0;
  const updated = all.map((r) => {
    if (r.date !== today && r.state === 'accepted' && !r.settled) {
      penalty += 1; // count; actual HP comes from that day's boss def — use flat fallback
      return { ...r, state: 'lost' as BossState, settled: true };
    }
    return r;
  });
  if (penalty > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  // Flat 10 HP per missed accepted battle (kept simple; per-boss penalty
  // would require storing the boss def, not worth the complexity).
  return penalty * 10;
}

export function markWon(): void {
  const rec = getRecord();
  if (rec) writeRecord({ ...rec, state: 'won', settled: true });
}
