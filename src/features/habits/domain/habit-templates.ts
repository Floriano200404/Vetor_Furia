/**
 * Pre-built habit templates covering health, study, and well-being.
 */

import type { Habit } from './habit.types';

export interface HabitTemplate {
  title: string;
  icon: string;
  xpReward: number;
  category: 'health' | 'study' | 'wellness' | 'fitness';
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Health
  { title: 'Beber 4L de água', icon: '💧', xpReward: 10, category: 'health' },
  { title: 'Tomar suplementos/vitaminas', icon: '💊', xpReward: 10, category: 'health' },
  { title: 'Dormir 8 horas', icon: '😴', xpReward: 15, category: 'health' },
  { title: 'Comer 5 refeições saudáveis', icon: '🥗', xpReward: 15, category: 'health' },
  
  // Study
  { title: '30 min de idiomas', icon: '🌍', xpReward: 15, category: 'study' },
  { title: '1 hora de leitura', icon: '📚', xpReward: 20, category: 'study' },
  { title: 'Revisar notas do dia', icon: '📝', xpReward: 10, category: 'study' },
  
  // Wellness
  { title: '10 min de meditação', icon: '🧘', xpReward: 10, category: 'wellness' },
  { title: 'Journaling (diário)', icon: '✍️', xpReward: 10, category: 'wellness' },
  { title: 'Sem redes sociais por 2h', icon: '📵', xpReward: 15, category: 'wellness' },
  
  // Fitness
  { title: 'Alongamento matinal', icon: '🤸', xpReward: 10, category: 'fitness' },
  { title: '10.000 passos', icon: '🚶', xpReward: 15, category: 'fitness' },
];

export const TEMPLATE_CATEGORIES = {
  health: { label: 'Saúde', color: 'var(--accent-success)' },
  study: { label: 'Estudo', color: 'var(--accent-secondary)' },
  wellness: { label: 'Bem-estar', color: 'var(--accent-primary)' },
  fitness: { label: 'Fitness', color: 'var(--accent-warning)' },
} as const;
