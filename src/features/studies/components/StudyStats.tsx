'use client';

/**
 * StudyStats — Shows study statistics (total hours, sessions this week, top subject).
 */

import { useMemo } from 'react';
import { Clock, BookOpen, Trophy, TrendingUp } from 'lucide-react';
import type { StudySession } from '../domain/study.types';
import styles from './StudyStats.module.css';

interface StudyStatsProps {
  sessions: StudySession[];
}

export function StudyStats({ sessions }: StudyStatsProps) {
  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    // Sessions this week
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = sessions.filter(s => s.startedAt >= weekAgo);
    const weekMinutes = thisWeek.reduce((sum, s) => sum + s.durationMinutes, 0);

    // Top subject
    const subjectMap: Record<string, number> = {};
    sessions.forEach(s => {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.durationMinutes;
    });
    const topSubject = Object.entries(subjectMap).sort((a, b) => b[1] - a[1])[0];

    // Total XP from studies
    const totalXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);

    return {
      totalHours,
      totalSessions: sessions.length,
      weekSessions: thisWeek.length,
      weekHours: Math.round(weekMinutes / 60 * 10) / 10,
      topSubject: topSubject ? topSubject[0] : '—',
      topSubjectHours: topSubject ? Math.round(topSubject[1] / 60 * 10) / 10 : 0,
      totalXP,
    };
  }, [sessions]);

  if (!stats) return null;

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.cardIcon} style={{ color: '#c084fc' }}><Clock size={20} /></div>
        <div className={styles.cardInfo}>
          <span className={styles.cardValue}>{stats.totalHours}h</span>
          <span className={styles.cardLabel}>Total Estudado</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardIcon} style={{ color: '#60a5fa' }}><BookOpen size={20} /></div>
        <div className={styles.cardInfo}>
          <span className={styles.cardValue}>{stats.weekSessions}</span>
          <span className={styles.cardLabel}>Sessões na Semana</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardIcon} style={{ color: '#f59e0b' }}><Trophy size={20} /></div>
        <div className={styles.cardInfo}>
          <span className={styles.cardValue} title={`${stats.topSubjectHours}h`}>{stats.topSubject}</span>
          <span className={styles.cardLabel}>Matéria Top</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardIcon} style={{ color: '#10b981' }}><TrendingUp size={20} /></div>
        <div className={styles.cardInfo}>
          <span className={styles.cardValue}>+{stats.totalXP}</span>
          <span className={styles.cardLabel}>XP em Estudos</span>
        </div>
      </div>
    </div>
  );
}
