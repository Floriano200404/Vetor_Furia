import type { StudySession } from '../domain/study.types';
import { DEFAULT_USER_ID, XP_REWARDS } from '@/lib/constants';
import { createAdapter } from '@/lib/storage';

const STORAGE_KEY = 'vetor_furia_study_sessions';
function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`; }

function readLocal(): StudySession[] {
  if (typeof window === 'undefined') return [];
  const s = localStorage.getItem(STORAGE_KEY);
  return s ? JSON.parse(s) : [];
}

function writeLocal(sessions: StudySession[]): void {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getSessions(): StudySession[] {
  return readLocal();
}

export function calculateStudyXP(durationMinutes: number, hasNotes: boolean): number {
  if (durationMinutes < 25) return 0;
  let xp = XP_REWARDS.STUDY_SESSION_BASE;
  const extraBlocks = Math.floor((durationMinutes - 25) / 25);
  xp += extraBlocks * XP_REWARDS.STUDY_SESSION_EXTRA_PER_25MIN;
  if (hasNotes) xp += XP_REWARDS.STUDY_NOTES_BONUS;
  return xp;
}

export function addSession(data: { subject: string; durationMinutes: number; markdownNotes: string; startedAt: number }): StudySession {
  const sessions = readLocal();
  const xp = calculateStudyXP(data.durationMinutes, data.markdownNotes.trim().length > 0);
  const session: StudySession = {
    id: genId(),
    userId: DEFAULT_USER_ID,
    subject: data.subject,
    durationMinutes: data.durationMinutes,
    markdownNotes: data.markdownNotes,
    xpEarned: xp,
    startedAt: data.startedAt,
    endedAt: Date.now(),
  };
  sessions.unshift(session);
  writeLocal(sessions);
  // Cloud persist
  createAdapter<StudySession>('study_sessions', DEFAULT_USER_ID).add(session).catch(console.error);
  return session;
}

export function deleteSession(id: string) {
  writeLocal(readLocal().filter(s => s.id !== id));
  createAdapter<StudySession>('study_sessions', DEFAULT_USER_ID).delete(id).catch(console.error);
}

/**
 * Get sessions eligible for spaced review (notes exist, older than N days).
 */
export function getSessionsForReview(daysOld: number = 7): StudySession[] {
  const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  return readLocal().filter(
    (s) => s.markdownNotes.trim().length > 0 && s.endedAt !== null && s.endedAt < cutoff
  );
}
