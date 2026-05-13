'use client';

/**
 * usePlayerStats — Hook para estado reativo do jogador.
 * Escuta eventos XP_EARNED para atualizar o dashboard em tempo real.
 */

import { useState, useEffect, useCallback } from 'react';
import { eventBus, XP_EVENTS } from '@/shared/events';
import type { XPEarnedPayload } from '@/shared/events';
import type { PlayerStats } from '../domain/player.types';
import type { XPEntry } from '../domain/xp-ledger.types';
import { calculatePlayerStats } from '../services/level-calculator';
import { getPlayer, savePlayer, addXPEntry, getRecentEntries } from '../services/xp-ledger.service';
import { DEFAULT_USER_ID } from '@/lib/constants';
import type { Player } from '../domain/player.types';
import { GAME_EVENTS } from '@/shared/events';
import type { HPDamagePayload, HPHealedPayload, GoldEarnedPayload, GoldSpentPayload } from '@/shared/events';

export interface UsePlayerStatsReturn {
  stats: PlayerStats;
  recentXP: XPEntry[];
  isLevelingUp: boolean;
  dismissLevelUp: () => void;
  newLevel: number | null;
  refreshStats: () => void;
}

export function usePlayerStats(): UsePlayerStatsReturn {
  const [stats, setStats] = useState<PlayerStats>(() => {
    // Retorna algo vazio no primeiro render (server side safe)
    // Depois é hidratado no useEffect
    return {
      totalXP: 0, level: 1, avatarStage: '1', avatarSprite: 'avatar_1.png',
      xpForCurrentLevel: 0, xpForNextLevel: 10, xpProgress: 0, levelTitle: '1',
      hp: 100, maxHp: 100, gold: 0
    };
  });
  const [recentXP, setRecentXP] = useState<XPEntry[]>([]);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [newLevel, setNewLevel] = useState<number | null>(null);

  const refreshStats = useCallback(() => {
    const player = getPlayer();
    setStats(calculatePlayerStats(player));
    setRecentXP(getRecentEntries(10));
  }, []);

  // Initialize
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Listen for XP events
  useEffect(() => {
    const unsubscribe = eventBus.on<XPEarnedPayload>(XP_EVENTS.XP_EARNED, (payload) => {
      const result = addXPEntry({
        userId: DEFAULT_USER_ID,
        amount: payload.amount,
        source: payload.source,
        sourceId: payload.sourceId,
        description: payload.description,
      });

      setStats(calculatePlayerStats(result.player));
      setRecentXP(getRecentEntries(10));

      if (result.leveledUp) {
        setIsLevelingUp(true);
        setNewLevel(result.player.level);

        // Also emit LEVEL_UP event
        eventBus.emit(XP_EVENTS.LEVEL_UP, {
          userId: result.player.uid,
          previousLevel: result.previousLevel,
          newLevel: result.player.level,
          previousAvatarStage: result.previousLevel,
          newAvatarStage: result.player.avatarStage,
          totalXP: result.player.totalXP,
        });
      }
    });

    const unsubDamage = eventBus.on<HPDamagePayload>(GAME_EVENTS.HP_DAMAGE, (payload) => {
      const p = getPlayer();
      p.hp = Math.max(0, p.hp - payload.amount);
      savePlayer(p);
      setStats(calculatePlayerStats(p));
    });

    const unsubHeal = eventBus.on<HPHealedPayload>(GAME_EVENTS.HP_HEALED, (payload) => {
      const p = getPlayer();
      p.hp = Math.min(p.maxHp, p.hp + payload.amount);
      savePlayer(p);
      setStats(calculatePlayerStats(p));
    });

    const unsubGoldEarned = eventBus.on<GoldEarnedPayload>(GAME_EVENTS.GOLD_EARNED, (payload) => {
      const p = getPlayer();
      p.gold += payload.amount;
      savePlayer(p);
      setStats(calculatePlayerStats(p));
    });

    const unsubGoldSpent = eventBus.on<GoldSpentPayload>(GAME_EVENTS.GOLD_SPENT, (payload) => {
      const p = getPlayer();
      p.gold = Math.max(0, p.gold - payload.amount);
      savePlayer(p);
      setStats(calculatePlayerStats(p));
    });

    return () => {
      unsubscribe();
      unsubDamage();
      unsubHeal();
      unsubGoldEarned();
      unsubGoldSpent();
    };
  }, []);

  const dismissLevelUp = useCallback(() => {
    setIsLevelingUp(false);
    setNewLevel(null);
  }, []);

  return { stats, recentXP, isLevelingUp, dismissLevelUp, newLevel, refreshStats };
}
