/**
 * Hunter Rank — rank de Caçador (E→S), estilo Solo Leveling.
 * Derivado do nível do jogador.
 */

export interface HunterRank {
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  label: string;
  color: string;
  minLevel: number;
}

const RANK_TABLE: HunterRank[] = [
  { rank: 'S', label: 'Rank S', color: '#f5d020', minLevel: 30 },
  { rank: 'A', label: 'Rank A', color: '#a855f7', minLevel: 20 },
  { rank: 'B', label: 'Rank B', color: '#3b82f6', minLevel: 15 },
  { rank: 'C', label: 'Rank C', color: '#10b981', minLevel: 10 },
  { rank: 'D', label: 'Rank D', color: '#94a3b8', minLevel: 5 },
  { rank: 'E', label: 'Rank E', color: '#a8a29e', minLevel: 1 },
];

/** Retorna o rank de Caçador para um dado nível. */
export function getHunterRank(level: number): HunterRank {
  return RANK_TABLE.find((r) => level >= r.minLevel) ?? RANK_TABLE[RANK_TABLE.length - 1];
}

/** Próximo rank e quantos níveis faltam (null se já for S). */
export function getNextRank(level: number): { rank: HunterRank; levelsAway: number } | null {
  const current = getHunterRank(level);
  if (current.rank === 'S') return null;
  const idx = RANK_TABLE.findIndex((r) => r.rank === current.rank);
  const next = RANK_TABLE[idx - 1]; // tabela está em ordem decrescente
  return { rank: next, levelsAway: next.minLevel - level };
}
