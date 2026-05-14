/**
 * Pre-built exercise catalog with GIF URLs from public APIs.
 */

import type { ExerciseCatalogItem, WorkoutTemplate, TemplateExercise } from './workout.types';

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

/**
 * Find a catalog item by name to inherit `gifUrl` and `muscleGroup`.
 * Returns undefined if the name is not in the catalog.
 */
function fromCatalog(
  name: string,
  defaultSets: number,
  defaultReps: number,
): TemplateExercise {
  const item = EXERCISE_CATALOG.find((e) => e.name === name);
  if (!item) {
    // Surfaces a bug at module load time instead of silently shipping a broken template.
    throw new Error(`[WORKOUT_TEMPLATES] Exercise "${name}" not found in EXERCISE_CATALOG`);
  }
  return {
    name: item.name,
    muscleGroup: item.muscleGroup,
    gifUrl: item.gifUrl,
    defaultSets,
    defaultReps,
  };
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'tpl-push',
    name: 'Push — Peito, Ombro, Tríceps',
    description: 'Empurrar: foco em hipertrofia da cadeia anterior. 4 exercícios compostos + isoladores.',
    icon: '💪',
    accent: 'push',
    exercises: [
      fromCatalog('Supino Reto', 4, 8),
      fromCatalog('Supino Inclinado', 3, 10),
      fromCatalog('Desenvolvimento', 3, 10),
      fromCatalog('Elevação Lateral', 3, 12),
      fromCatalog('Tríceps Pulley', 3, 12),
      fromCatalog('Tríceps Francês', 3, 12),
    ],
  },
  {
    id: 'tpl-pull',
    name: 'Pull — Costas e Bíceps',
    description: 'Puxar: largura e espessura das costas + braço. Inclui dorsal e remada.',
    icon: '🔙',
    accent: 'pull',
    exercises: [
      fromCatalog('Puxada Frontal', 4, 10),
      fromCatalog('Remada Curvada', 4, 8),
      fromCatalog('Remada Unilateral', 3, 10),
      fromCatalog('Rosca Direta', 3, 12),
      fromCatalog('Rosca Martelo', 3, 12),
    ],
  },
  {
    id: 'tpl-legs',
    name: 'Legs — Pernas completas',
    description: 'Quadríceps, posterior, glúteo e panturrilha. Treino pesado, alto volume.',
    icon: '🦵',
    accent: 'legs',
    exercises: [
      fromCatalog('Agachamento Livre', 4, 8),
      fromCatalog('Leg Press', 4, 10),
      fromCatalog('Extensora', 3, 12),
      fromCatalog('Flexora', 3, 12),
      fromCatalog('Panturrilha', 4, 15),
    ],
  },
];
