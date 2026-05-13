/**
 * Pre-built exercise catalog with GIF URLs from public APIs.
 */

import type { ExerciseCatalogItem } from './workout.types';

export const EXERCISE_CATALOG: ExerciseCatalogItem[] = [
  // Chest
  { name: 'Supino Reto', muscleGroup: 'Peito', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif' },
  { name: 'Supino Inclinado', muscleGroup: 'Peito', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Barbell-Bench-Press.gif' },
  { name: 'Crucifixo', muscleGroup: 'Peito', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Fly.gif' },
  { name: 'Flexão de Braço', muscleGroup: 'Peito', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif' },
  
  // Back
  { name: 'Puxada Frontal', muscleGroup: 'Costas', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif' },
  { name: 'Remada Curvada', muscleGroup: 'Costas', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif' },
  { name: 'Remada Unilateral', muscleGroup: 'Costas', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Row.gif' },
  
  // Shoulders
  { name: 'Desenvolvimento', muscleGroup: 'Ombros', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif' },
  { name: 'Elevação Lateral', muscleGroup: 'Ombros', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif' },
  
  // Arms
  { name: 'Rosca Direta', muscleGroup: 'Bíceps', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Curl.gif' },
  { name: 'Rosca Martelo', muscleGroup: 'Bíceps', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif' },
  { name: 'Tríceps Pulley', muscleGroup: 'Tríceps', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pushdown.gif' },
  { name: 'Tríceps Francês', muscleGroup: 'Tríceps', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Triceps-Extension.gif' },
  
  // Legs
  { name: 'Agachamento Livre', muscleGroup: 'Pernas', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif' },
  { name: 'Leg Press', muscleGroup: 'Pernas', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Press.gif' },
  { name: 'Extensora', muscleGroup: 'Pernas', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif' },
  { name: 'Flexora', muscleGroup: 'Pernas', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Curl.gif' },
  { name: 'Panturrilha', muscleGroup: 'Pernas', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Calf-Raise.gif' },
  
  // Abs
  { name: 'Abdominal Crunch', muscleGroup: 'Abdômen', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Crunch.gif' },
  { name: 'Prancha', muscleGroup: 'Abdômen', gifUrl: 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Front-Plank.gif' },
];

export const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Abdômen',
];
