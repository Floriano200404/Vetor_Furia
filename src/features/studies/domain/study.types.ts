export interface StudySession {
  id: string;
  userId: string;
  subject: string;
  durationMinutes: number;
  markdownNotes: string;
  xpEarned: number;
  startedAt: number;
  endedAt: number | null;
}

export interface TimerState {
  isRunning: boolean;
  elapsedSeconds: number;
  targetMinutes: number;
}
