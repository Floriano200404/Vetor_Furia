'use client';

/**
 * ActivityHeatmap — GitHub-style contribution grid showing XP activity over the last 90 days.
 * Darker green = more XP earned that day.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './ActivityHeatmap.module.css';

interface HeatmapProps {
  entries: Array<{ createdAt: number; amount: number }>;
  days?: number;
}

interface DayData {
  date: string;
  xp: number;
  level: 0 | 1 | 2 | 3 | 4;
  dayOfWeek: number;
  weekIndex: number;
}

const LEVEL_COLORS = [
  'var(--heatmap-0)',
  'var(--heatmap-1)',
  'var(--heatmap-2)',
  'var(--heatmap-3)',
  'var(--heatmap-4)',
];

const DAY_LABELS = ['', 'Seg', '', 'Qua', '', 'Sex', ''];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function ActivityHeatmap({ entries, days = 90 }: HeatmapProps) {
  const { grid, weeks, months, totalXP, activeDays, maxDaily } = useMemo(() => {
    // Group entries by day
    const xpByDay: Record<string, number> = {};
    entries.forEach(e => {
      const day = getDateString(new Date(e.createdAt));
      xpByDay[day] = (xpByDay[day] || 0) + e.amount;
    });

    // Generate days array
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const dayList: DayData[] = [];
    
    // Find the max XP in a single day for level calculation
    let max = 0;
    for (const v of Object.values(xpByDay)) {
      if (v > max) max = v;
    }
    if (max === 0) max = 1; // prevent division by zero

    // Calculate start date aligned to start of week (Sunday)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);
    // Align to previous Sunday
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    const endDate = new Date(today);
    let weekIdx = 0;
    let prevWeekDay = -1;
    const d = new Date(startDate);
    
    while (d <= endDate) {
      const dateStr = getDateString(d);
      const dow = d.getDay();
      
      if (dow === 0 && prevWeekDay !== -1) weekIdx++;
      prevWeekDay = dow;

      const xp = xpByDay[dateStr] || 0;
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (xp > 0) {
        const ratio = xp / max;
        if (ratio >= 0.75) level = 4;
        else if (ratio >= 0.5) level = 3;
        else if (ratio >= 0.25) level = 2;
        else level = 1;
      }

      dayList.push({ date: dateStr, xp, level, dayOfWeek: dow, weekIndex: weekIdx });
      d.setDate(d.getDate() + 1);
    }

    // Calculate month labels
    const monthLabels: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;
    dayList.forEach(day => {
      const month = new Date(day.date + 'T12:00:00').getMonth();
      if (month !== lastMonth && day.dayOfWeek === 0) {
        monthLabels.push({ label: MONTH_NAMES[month], weekIndex: day.weekIndex });
        lastMonth = month;
      }
    });

    return {
      grid: dayList,
      weeks: weekIdx + 1,
      months: monthLabels,
      totalXP: Object.values(xpByDay).reduce((a, b) => a + b, 0),
      activeDays: Object.keys(xpByDay).length,
      maxDaily: max,
    };
  }, [entries, days]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>📊 Atividade ({days} dias)</h4>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <strong>{activeDays}</strong> dias ativos
          </span>
          <span className={styles.stat}>
            <strong>{totalXP.toLocaleString('pt-BR')}</strong> XP total
          </span>
        </div>
      </div>

      <div className={styles.heatmapWrapper}>
        {/* Day labels */}
        <div className={styles.dayLabels}>
          {DAY_LABELS.map((label, i) => (
            <span key={i} className={styles.dayLabel}>{label}</span>
          ))}
        </div>

        <div className={styles.gridWrapper}>
          {/* Month labels */}
          <div className={styles.monthLabels} style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
            {months.map((m, i) => (
              <span
                key={i}
                className={styles.monthLabel}
                style={{ gridColumnStart: m.weekIndex + 1 }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Heatmap grid */}
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
          >
            {grid.map((day, i) => (
              <motion.div
                key={day.date}
                className={styles.cell}
                style={{
                  gridColumn: day.weekIndex + 1,
                  gridRow: day.dayOfWeek + 1,
                  background: LEVEL_COLORS[day.level],
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.003, duration: 0.15 }}
                title={`${day.date}: ${day.xp} XP`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Menos</span>
        {LEVEL_COLORS.map((color, i) => (
          <div
            key={i}
            className={styles.legendCell}
            style={{ background: color }}
          />
        ))}
        <span className={styles.legendLabel}>Mais</span>
      </div>
    </div>
  );
}
