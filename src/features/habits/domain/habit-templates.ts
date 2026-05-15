/**
 * Pre-built habit templates covering health, study, well-being and fitness.
 *
 * v2: templates carry trackingType, target/unit, schedule and reminderTimes
 * so the wizard can pre-fill the form completely from a template.
 */

import type { HabitSchedule, TrackingType } from './habit.types';

export interface HabitTemplate {
  title: string;
  icon: string;
  xpReward: number;
  category: 'health' | 'study' | 'wellness' | 'fitness';
  trackingType: TrackingType;
  target?: number;
  unit?: string;
  schedule: HabitSchedule;
  reminderTimes: string[];
}

// Shortcuts for common schedules
const DAILY: HabitSchedule = { type: 'daily' };
const WEEKDAYS: HabitSchedule = { type: 'weekly', daysOfWeek: [1, 2, 3, 4, 5] };

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // --- Health ---
  {
    title: 'Beber água',
    icon: '💧',
    xpReward: 10,
    category: 'health',
    trackingType: 'quantitative',
    target: 5,
    unit: 'L',
    schedule: DAILY,
    reminderTimes: ['09:00', '12:00', '15:00', '18:00'],
  },
  {
    title: 'Tomar suplementos',
    icon: '💊',
    xpReward: 10,
    category: 'health',
    trackingType: 'binary',
    schedule: DAILY,
    reminderTimes: ['08:00'],
  },
  {
    title: 'Dormir 8 horas',
    icon: '😴',
    xpReward: 15,
    category: 'health',
    trackingType: 'binary',
    schedule: DAILY,
    reminderTimes: ['22:30'],
  },
  {
    title: 'Refeições saudáveis',
    icon: '🥗',
    xpReward: 15,
    category: 'health',
    trackingType: 'quantitative',
    target: 5,
    unit: 'ref.',
    schedule: DAILY,
    reminderTimes: [],
  },

  // --- Study ---
  {
    title: 'Estudo de idioma',
    icon: '🌍',
    xpReward: 15,
    category: 'study',
    trackingType: 'quantitative',
    target: 30,
    unit: 'min',
    schedule: DAILY,
    reminderTimes: ['19:00'],
  },
  {
    title: 'Leitura',
    icon: '📚',
    xpReward: 20,
    category: 'study',
    trackingType: 'quantitative',
    target: 60,
    unit: 'min',
    schedule: DAILY,
    reminderTimes: ['21:00'],
  },
  {
    title: 'Revisar notas do dia',
    icon: '📝',
    xpReward: 10,
    category: 'study',
    trackingType: 'binary',
    schedule: WEEKDAYS,
    reminderTimes: ['18:30'],
  },

  // --- Wellness ---
  {
    title: 'Meditação',
    icon: '🧘',
    xpReward: 10,
    category: 'wellness',
    trackingType: 'quantitative',
    target: 10,
    unit: 'min',
    schedule: DAILY,
    reminderTimes: ['07:30'],
  },
  {
    title: 'Journaling',
    icon: '✍️',
    xpReward: 10,
    category: 'wellness',
    trackingType: 'binary',
    schedule: DAILY,
    reminderTimes: ['22:00'],
  },
  {
    title: 'Sem redes sociais',
    icon: '📵',
    xpReward: 15,
    category: 'wellness',
    trackingType: 'binary',
    schedule: WEEKDAYS,
    reminderTimes: [],
  },

  // --- Fitness ---
  {
    title: 'Alongamento matinal',
    icon: '🤸',
    xpReward: 10,
    category: 'fitness',
    trackingType: 'binary',
    schedule: DAILY,
    reminderTimes: ['07:00'],
  },
  {
    title: '10.000 passos',
    icon: '🚶',
    xpReward: 15,
    category: 'fitness',
    trackingType: 'quantitative',
    target: 10000,
    unit: 'passos',
    schedule: DAILY,
    reminderTimes: ['12:00', '18:00'],
  },
];

export const TEMPLATE_CATEGORIES = {
  health: { label: 'Saúde', color: 'var(--accent-success)' },
  study: { label: 'Estudo', color: 'var(--accent-secondary)' },
  wellness: { label: 'Bem-estar', color: 'var(--accent-primary)' },
  fitness: { label: 'Fitness', color: 'var(--accent-warning)' },
} as const;
