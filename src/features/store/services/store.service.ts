/**
 * Store Service — manages custom rewards and purchases.
 */

import type { Reward } from '../domain/store.types';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { createAdapter } from '@/lib/storage';
import { eventBus, GAME_EVENTS } from '@/shared/events';
import { getPlayer } from '@/features/core-rpg/services/xp-ledger.service';

const STORAGE_KEY = 'vetor_furia_store_rewards';

function genId() { return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; }

function readLocal(): Reward[] {
  if (typeof window === 'undefined') return [];
  const s = localStorage.getItem(STORAGE_KEY);
  return s ? JSON.parse(s) : [];
}

function writeLocal(rewards: Reward[]): void {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
}

// Default templates
const DEFAULT_REWARDS: Reward[] = [
  { id: '1', userId: DEFAULT_USER_ID, title: '1 Hora de Jogo', description: 'Jogar sem culpa no PC ou Console.', cost: 50, icon: 'Gamepad2', createdAt: 0 },
  { id: '2', userId: DEFAULT_USER_ID, title: 'Assistir Filme/Série', description: 'Um episódio ou um filme na TV.', cost: 30, icon: 'Tv', createdAt: 0 },
  { id: '3', userId: DEFAULT_USER_ID, title: 'Comida Especial', description: 'Pedir um lanche ou doce especial.', cost: 100, icon: 'Pizza', createdAt: 0 },
];

export function getRewards(): Reward[] {
  const local = readLocal();
  if (local.length === 0) {
    writeLocal(DEFAULT_REWARDS);
    return DEFAULT_REWARDS;
  }
  return local;
}

export function addReward(data: { title: string; description: string; cost: number; icon: string }): Reward {
  const rewards = getRewards();
  const reward: Reward = {
    ...data,
    id: genId(),
    userId: DEFAULT_USER_ID,
    createdAt: Date.now(),
  };
  rewards.push(reward);
  writeLocal(rewards);
  createAdapter<Reward>('store_rewards', DEFAULT_USER_ID).add(reward).catch(console.error);
  return reward;
}

export function deleteReward(id: string): void {
  const rewards = getRewards().filter(r => r.id !== id);
  writeLocal(rewards);
  createAdapter<Reward>('store_rewards', DEFAULT_USER_ID).delete(id).catch(console.error);
}

/**
 * Attempts to purchase a reward. 
 * Checks player gold synchronously. If sufficient, emits event.
 */
export function purchaseReward(reward: Reward): boolean {
  const player = getPlayer();
  if (player.gold >= reward.cost) {
    eventBus.emit(GAME_EVENTS.GOLD_SPENT, {
      userId: DEFAULT_USER_ID,
      amount: reward.cost,
      item: reward.title,
    });
    return true;
  }
  return false;
}
