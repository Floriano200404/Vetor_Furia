/**
 * Daily Check Service — Evaluates yesterday's performance and applies HP consequences.
 * Runs once per day on first dashboard access.
 * 
 * Rules:
 * - 0% habits completed:    -25 HP
 * - < 50% habits completed: -10 HP
 * - 50-99% completed:        No damage
 * - 100% completed:          +5 HP heal
 * - HP reaches 0:            Lose 20% Gold, reset HP to 50
 */

import { getHabitsWithLogs } from '@/features/habits/services/habits.service';
import { getPlayer, savePlayer } from '@/features/core-rpg/services/xp-ledger.service';
import { eventBus, GAME_EVENTS } from '@/shared/events';

const DAILY_CHECK_KEY = 'vetor_furia_last_daily_check';

interface DailyCheckResult {
  type: 'damage' | 'heal' | 'death' | 'none' | 'no_habits';
  amount: number;
  completionRate: number;
  goldLost?: number;
  message: string;
}

/**
 * Get yesterday's date string
 */
function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Get today's date string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate yesterday's habit completion rate
 */
function getYesterdayCompletionRate(): { completed: number; total: number; rate: number } {
  const yesterday = getYesterdayString();
  
  // Read all habit logs from localStorage
  if (typeof window === 'undefined') return { completed: 0, total: 0, rate: 0 };
  const raw = localStorage.getItem('vetor_furia_habit_logs');
  const logs = raw ? JSON.parse(raw) : [];
  const rawHabits = localStorage.getItem('vetor_furia_habits');
  const habits = rawHabits ? JSON.parse(rawHabits) : [];
  
  if (habits.length === 0) return { completed: 0, total: 0, rate: -1 }; // -1 = no habits
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yesterdayLogs = logs.filter((l: any) => l.date === yesterday && l.completed);
  const completedCount = yesterdayLogs.length;
  
  return {
    completed: completedCount,
    total: habits.length,
    rate: habits.length > 0 ? completedCount / habits.length : 0,
  };
}

/**
 * Run the daily check. Returns the result of the evaluation.
 * Should be called on dashboard mount. Will only execute once per day.
 */
export function runDailyCheck(): DailyCheckResult | null {
  if (typeof window === 'undefined') return null;
  
  const today = getTodayString();
  const lastCheck = localStorage.getItem(DAILY_CHECK_KEY);
  
  // Already checked today
  if (lastCheck === today) return null;
  
  // First ever visit — don't punish, just mark
  if (!lastCheck) {
    localStorage.setItem(DAILY_CHECK_KEY, today);
    return null;
  }
  
  // Mark as checked for today
  localStorage.setItem(DAILY_CHECK_KEY, today);
  
  const { completed, total, rate } = getYesterdayCompletionRate();
  
  // No habits registered — skip
  if (rate === -1) {
    return { type: 'no_habits', amount: 0, completionRate: 0, message: '' };
  }
  
  const player = getPlayer();
  
  // 100% completed — heal!
  if (rate === 1) {
    const healAmount = 5;
    eventBus.emit(GAME_EVENTS.HP_HEALED, {
      userId: player.uid,
      amount: healAmount,
      reason: 'Todos os hábitos concluídos ontem!',
    });
    return {
      type: 'heal',
      amount: healAmount,
      completionRate: rate,
      message: `💚 Todos os ${total} hábitos concluídos ontem! +${healAmount} HP recuperados.`,
    };
  }
  
  // 50-99% — safe zone
  if (rate >= 0.5) {
    return {
      type: 'none',
      amount: 0,
      completionRate: rate,
      message: `✅ ${completed}/${total} hábitos concluídos ontem. Sem penalidade.`,
    };
  }
  
  // < 50% — damage!
  const damageAmount = rate === 0 ? 25 : 10;
  
  eventBus.emit(GAME_EVENTS.HP_DAMAGE, {
    userId: player.uid,
    amount: damageAmount,
    reason: rate === 0 
      ? 'Nenhum hábito foi concluído ontem!' 
      : `Apenas ${completed}/${total} hábitos concluídos ontem.`,
    sourceId: `daily-check-${today}`,
  });
  
  // Check for death (HP will be updated by the event handler, so re-read)
  const updatedPlayer = getPlayer();
  const newHp = Math.max(0, updatedPlayer.hp);
  
  if (newHp <= 0) {
    // Death penalty: lose 20% gold, reset HP to 50
    const goldLost = Math.floor(updatedPlayer.gold * 0.2);
    
    if (goldLost > 0) {
      eventBus.emit(GAME_EVENTS.GOLD_SPENT, {
        userId: updatedPlayer.uid,
        amount: goldLost,
        item: 'Penalidade de morte — HP zerou',
      });
    }
    
    // Reset HP to 50
    const p = getPlayer();
    p.hp = 50;
    savePlayer(p);
    eventBus.emit('STATS_CHANGED', { newLevel: null });
    
    return {
      type: 'death',
      amount: damageAmount,
      completionRate: rate,
      goldLost,
      message: `💀 Seu HP chegou a zero! Você perdeu ${goldLost} Gold e foi ressuscitado com 50 HP. Cuide dos seus hábitos!`,
    };
  }
  
  return {
    type: 'damage',
    amount: damageAmount,
    completionRate: rate,
    message: rate === 0 
      ? `🩸 Nenhum hábito concluído ontem! Você sofreu -${damageAmount} HP de dano.`
      : `⚠️ Apenas ${completed}/${total} hábitos ontem. -${damageAmount} HP de dano.`,
  };
}
