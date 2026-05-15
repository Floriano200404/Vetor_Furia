'use client';

/**
 * FloatingReward — central popup overlay that responds to game events
 * (XP earned, Gold earned/spent, HP healed/lost) with a satisfying animation.
 *
 * Mount once at the root (via Providers). Listens to the eventBus and queues
 * each event as a transient floating element near the top-center of the
 * viewport so feedback is visible regardless of which page the user is on.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Heart, Zap } from 'lucide-react';
import {
  eventBus,
  XP_EVENTS,
  GAME_EVENTS,
  type XPEarnedPayload,
  type GoldEarnedPayload,
  type GoldSpentPayload,
  type HPHealedPayload,
  type HPDamagePayload,
} from '@/shared/events';
import styles from './FloatingReward.module.css';

type RewardKind = 'xp' | 'gold-up' | 'gold-down' | 'hp-up' | 'hp-down';

interface FloatingRewardItem {
  id: number;
  kind: RewardKind;
  amount: number;
  label?: string;
}

// How long an item stays on screen (matches the CSS animation duration)
const DURATION_MS = 1800;
// Cap concurrent items so spam doesn't pile up
const MAX_ITEMS = 5;

const KIND_META: Record<RewardKind, { icon: React.ElementType; color: string; sign: string }> = {
  xp:        { icon: Zap,   color: 'var(--accent-secondary)', sign: '+' },
  'gold-up': { icon: Coins, color: '#fcd34d',                  sign: '+' },
  'gold-down': { icon: Coins, color: 'var(--accent-danger)',   sign: '-' },
  'hp-up':   { icon: Heart, color: 'var(--accent-success)',    sign: '+' },
  'hp-down': { icon: Heart, color: 'var(--accent-danger)',     sign: '-' },
};

function newId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function FloatingReward() {
  const [items, setItems] = useState<FloatingRewardItem[]>([]);

  const push = (item: Omit<FloatingRewardItem, 'id'>) => {
    setItems((prev) => {
      const next = [...prev, { ...item, id: newId() }];
      // Trim from the front so visual stack stays at MAX_ITEMS.
      return next.length > MAX_ITEMS ? next.slice(next.length - MAX_ITEMS) : next;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const offXP = eventBus.on<XPEarnedPayload>(XP_EVENTS.XP_EARNED, (p) => {
      push({ kind: 'xp', amount: p.amount, label: 'XP' });
    });
    const offGoldUp = eventBus.on<GoldEarnedPayload>(GAME_EVENTS.GOLD_EARNED, (p) => {
      push({ kind: 'gold-up', amount: p.amount, label: 'Gold' });
    });
    const offGoldDown = eventBus.on<GoldSpentPayload>(GAME_EVENTS.GOLD_SPENT, (p) => {
      push({ kind: 'gold-down', amount: p.amount, label: 'Gold' });
    });
    const offHPUp = eventBus.on<HPHealedPayload>(GAME_EVENTS.HP_HEALED, (p) => {
      push({ kind: 'hp-up', amount: p.amount, label: 'HP' });
    });
    const offHPDown = eventBus.on<HPDamagePayload>(GAME_EVENTS.HP_DAMAGE, (p) => {
      push({ kind: 'hp-down', amount: p.amount, label: 'HP' });
    });

    return () => {
      offXP();
      offGoldUp();
      offGoldDown();
      offHPUp();
      offHPDown();
    };
  }, []);

  // Auto-remove items after DURATION_MS
  useEffect(() => {
    if (items.length === 0) return;
    const oldest = items[0];
    const t = window.setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== oldest.id));
    }, DURATION_MS);
    return () => window.clearTimeout(t);
  }, [items]);

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      <AnimatePresence initial={false}>
        {items.map((item, idx) => {
          const meta = KIND_META[item.kind];
          const Icon = meta.icon;
          return (
            <motion.div
              key={item.id}
              className={styles.item}
              style={{ color: meta.color }}
              initial={{ opacity: 0, y: 30, scale: 0.7 }}
              animate={{
                opacity: 1,
                y: -idx * 8,
                scale: 1,
              }}
              exit={{ opacity: 0, y: -80, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <span className={styles.iconWrap} style={{ background: `${meta.color}25` }}>
                <Icon size={18} />
              </span>
              <span className={styles.amount}>
                {meta.sign}
                {Math.abs(item.amount).toLocaleString('pt-BR')}
              </span>
              {item.label && <span className={styles.label}>{item.label}</span>}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
