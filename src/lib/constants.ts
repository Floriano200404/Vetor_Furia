/**
 * Global constants for the Vetor Fúria application.
 */

// --- XP Rewards ---
export const XP_REWARDS = {
  HABIT_COMPLETE: 10,
  HABIT_STREAK_BONUS_PER_DAY: 5,
  HABIT_STREAK_BONUS_CAP: 50,
  HABIT_ALL_COMPLETE_BONUS: 50,
  WORKOUT_COMPLETE: 30,
  WORKOUT_EXERCISE_BONUS: 2,
  BIOMETRY_LOG: 15,
  STUDY_SESSION_BASE: 25,         // ≥ 25 min
  STUDY_SESSION_EXTRA_PER_25MIN: 10,
  STUDY_NOTES_BONUS: 10,
} as const;

// --- Level System ---
export const LEVEL_CONFIG = {
  /** Level = floor(0.3 × √totalXP) + 1 */
  SCALE_FACTOR: 0.3,
  /** Minimum level is 1 */
  MIN_LEVEL: 1,
} as const;

// --- Avatar Stages ---
export interface AvatarStageConfig {
  stage: number;
  name: string;
  minLevel: number;
  sprite: string;
  emoji: string;
  title: string;
  description: string;
  unlocks: string[];
  lore: string;
}

export const AVATAR_STAGES: AvatarStageConfig[] = [
  {
    stage: 1,
    name: 'Iniciante',
    minLevel: 1,
    sprite: '/avatars/stage-1.png',
    emoji: '🗡️',
    title: 'O Despertar',
    description: 'Você ouviu o chamado da aventura. A jornada começa agora.',
    unlocks: ['Hábitos Diários', 'Timer de Estudos', 'Registro de Treinos'],
    lore: 'Todo herói começa com um único passo. Nas terras de Fúria, os que despertam para o chamado são marcados pelo destino. O caminho é longo, mas a determinação é sua arma.',
  },
  {
    stage: 2,
    name: 'Aprendiz',
    minLevel: 5,
    sprite: '/avatars/stage-2.png',
    emoji: '🏹',
    title: 'O Primeiro Teste',
    description: 'Você provou sua disciplina. O mundo começa a notar sua presença.',
    unlocks: ['Streaks de Hábitos', 'Loja de Recompensas'],
    lore: 'Os Aprendizes são aqueles que provaram que o fogo interior não se apaga. Nas tavernas de Fúria, sussurram sobre um guerreiro que nunca falha em cumprir seus deveres diários.',
  },
  {
    stage: 3,
    name: 'Guerreiro',
    minLevel: 10,
    sprite: '/avatars/stage-3.png',
    emoji: '🛡️',
    title: 'Forjado em Batalha',
    description: 'Sua consistência é lendária. Poucos chegam até aqui.',
    unlocks: ['Biometria Avançada', 'Overload Progressivo'],
    lore: 'O título de Guerreiro é conquistado com suor e sangue. Suas mãos já conhecem o peso do ferro, sua mente já dominou a tentação da preguiça. Os fracos te temem, os fortes te respeitam.',
  },
  {
    stage: 4,
    name: 'Mestre',
    minLevel: 20,
    sprite: '/avatars/stage-4.png',
    emoji: '⚔️',
    title: 'Ascensão do Mestre',
    description: 'Você transcendeu os limites comuns. Sua disciplina inspira outros.',
    unlocks: ['Análise de Performance', 'Insights Avançados'],
    lore: 'Os Mestres são raros como diamantes nas minas de Obsidiana. Cada hábito concluído é uma vitória silenciosa, cada treino é uma batalha vencida. Seu nome será cantado nas baladas dos bardos.',
  },
  {
    stage: 5,
    name: 'Lendário',
    minLevel: 30,
    sprite: '/avatars/stage-5.png',
    emoji: '🐉',
    title: 'A Lenda Vive',
    description: 'Você é a lenda. Sua jornada é a prova viva de que limites são ilusões.',
    unlocks: ['Título Lendário', 'Aura Especial'],
    lore: 'Poucos mortais alcançam o status Lendário. Você domou o dragão interior — a preguiça, a dúvida, a desistência. Nas terras de Fúria, seu nome é gravado em pedra eterna. Você é a tempestade.',
  },
];

// --- Default User ID (MVP single-user mode) ---
export const DEFAULT_USER_ID = 'vetor-furia-player';

// --- Timer defaults ---
export const TIMER_DEFAULTS = {
  FOCUS_DURATION_MINUTES: 25,
  SHORT_BREAK_MINUTES: 5,
  LONG_BREAK_MINUTES: 15,
} as const;
