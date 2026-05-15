/**
 * Weekly Summary — aggregates the last 7 days into a retrospective shown
 * once per ISO week (on/after Monday).
 */

import type { Workout, CardioSession, Biometry } from '@/features/health';
import { getLedgerEntries } from '@/features/core-rpg/services/xp-ledger.service';
import { attributeForSource, ATTRIBUTES } from '@/features/core-rpg';
import type { XPSource } from '@/shared/events';

const MS_DAY = 86_400_000;
const SEEN_KEY = 'vetor_furia_weekly_seen';

function readRaw<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

/** ISO-ish week key: `YYYY-Www` based on year + week number. */
export function currentWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = date.getTime();
  date.setUTCMonth(0, 1);
  if (date.getUTCDay() !== 4) {
    date.setUTCMonth(0, 1 + ((4 - date.getUTCDay() + 7) % 7));
  }
  const week = 1 + Math.ceil((firstThursday - date.getTime()) / (7 * MS_DAY));
  return `${new Date(firstThursday).getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export interface WeeklySummary {
  xpTotal: number;
  workouts: number;
  cardios: number;
  cardioMinutes: number;
  habitCompletions: number;
  weightDelta: number | null;
  strongestAttribute: { label: string; icon: string } | null;
  weakestAttribute: { label: string; icon: string } | null;
}

export function buildWeeklySummary(): WeeklySummary {
  const since = Date.now() - 7 * MS_DAY;

  const ledger = getLedgerEntries().filter((e) => e.createdAt >= since);
  const xpTotal = ledger.reduce((a, e) => a + e.amount, 0);

  const workouts = readRaw<Workout>('vetor_furia_workouts').filter((w) => w.date >= since);
  const cardio = readRaw<CardioSession>('vetor_furia_cardio').filter((c) => c.date >= since);
  const cardioMinutes = cardio.reduce((a, c) => a + c.durationMinutes, 0);

  interface HLog { date: string; completed: boolean }
  const habitLogs = readRaw<HLog>('vetor_furia_habit_logs').filter(
    (l) => l.completed && new Date(l.date + 'T12:00:00').getTime() >= since,
  );

  const bio = readRaw<Biometry>('vetor_furia_biometry')
    .filter((b) => b.measuredAt >= since)
    .sort((a, b) => a.measuredAt - b.measuredAt);
  const weightDelta =
    bio.length >= 2 ? Math.round((bio[bio.length - 1].weight - bio[0].weight) * 10) / 10 : null;

  // XP per attribute this week
  const perAttr: Record<string, number> = {};
  for (const e of ledger) {
    const attr = attributeForSource(e.source as XPSource);
    perAttr[attr] = (perAttr[attr] ?? 0) + e.amount;
  }
  const ranked = ATTRIBUTES.map((a) => ({ def: a, xp: perAttr[a.key] ?? 0 })).sort(
    (a, b) => b.xp - a.xp,
  );
  const strongest = ranked[0]?.xp > 0
    ? { label: ranked[0].def.label, icon: ranked[0].def.icon }
    : null;
  const weakest = ranked.length > 0
    ? { label: ranked[ranked.length - 1].def.label, icon: ranked[ranked.length - 1].def.icon }
    : null;

  return {
    xpTotal,
    workouts: workouts.length,
    cardios: cardio.length,
    cardioMinutes,
    habitCompletions: habitLogs.length,
    weightDelta,
    strongestAttribute: strongest,
    weakestAttribute: weakest,
  };
}

/**
 * Should we surface the modal? Only on/after Monday, once per ISO week,
 * and only if there's actually some activity to report.
 */
export function shouldShowWeeklySummary(): boolean {
  if (typeof window === 'undefined') return false;
  const seen = localStorage.getItem(SEEN_KEY);
  const wk = currentWeekKey();
  if (seen === wk) return false;
  const summary = buildWeeklySummary();
  const hasActivity =
    summary.xpTotal > 0 || summary.workouts > 0 || summary.habitCompletions > 0;
  return hasActivity;
}

export function markWeeklySummarySeen(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SEEN_KEY, currentWeekKey());
  }
}
