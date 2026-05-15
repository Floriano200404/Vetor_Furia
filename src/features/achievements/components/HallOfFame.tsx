'use client';

/**
 * HallOfFame — grid of achievements, unlocked highlighted, locked dimmed
 * with progress bars. Claims Gold for newly-unlocked ones on mount.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Trophy } from 'lucide-react';
import { eventBus, GAME_EVENTS } from '@/shared/events';
import { useToast } from '@/shared/components/Toast';
import { DEFAULT_USER_ID } from '@/lib/constants';
import {
  getAchievementStatuses,
  claimNewlyUnlocked,
} from '../services/achievements.service';
import { TIER_META } from '../domain/achievements';
import styles from './HallOfFame.module.css';

export function HallOfFame() {
  const toast = useToast();
  const [statuses] = useState(() =>
    typeof window === 'undefined' ? [] : getAchievementStatuses(),
  );

  // Claim newly-unlocked achievements once on mount and reward Gold.
  useEffect(() => {
    const newly = claimNewlyUnlocked();
    if (newly.length === 0) return;
    for (const a of newly) {
      eventBus.emit(GAME_EVENTS.GOLD_EARNED, {
        userId: DEFAULT_USER_ID,
        amount: a.def.goldReward,
        source: `Conquista: ${a.def.title}`,
      });
    }
    toast.success(
      newly.length === 1
        ? `Conquista desbloqueada: ${newly[0].def.title}! +${newly[0].def.goldReward} ⛁`
        : `${newly.length} conquistas desbloqueadas!`,
    );
  }, [toast]);

  const { unlocked, locked } = useMemo(() => {
    const u = statuses.filter((s) => s.unlocked);
    const l = statuses.filter((s) => !s.unlocked).sort((a, b) => b.progress - a.progress);
    return { unlocked: u, locked: l };
  }, [statuses]);

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <Trophy size={18} className={styles.headerIcon} />
        <div>
          <h3 className={styles.title}>Hall da Fama</h3>
          <p className={styles.subtitle}>
            {unlocked.length}/{statuses.length} conquistas desbloqueadas
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        {[...unlocked, ...locked].map((s) => {
          const tier = TIER_META[s.def.tier];
          return (
            <motion.div
              key={s.def.id}
              className={`${styles.card} ${s.unlocked ? styles.cardUnlocked : styles.cardLocked}`}
              style={s.unlocked ? { borderColor: tier.color } : undefined}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div
                className={styles.cardIcon}
                style={{ background: s.unlocked ? `${tier.color}22` : undefined }}
              >
                {s.unlocked ? (
                  <span className={styles.emoji}>{s.def.icon}</span>
                ) : (
                  <Lock size={18} className={styles.lockIcon} />
                )}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTitleRow}>
                  <span className={styles.cardTitle}>{s.def.title}</span>
                  <span
                    className={styles.tierBadge}
                    style={{ color: tier.color, borderColor: `${tier.color}66` }}
                  >
                    {tier.label}
                  </span>
                </div>
                <p className={styles.cardDesc}>{s.def.description}</p>

                {!s.unlocked && (
                  <div className={styles.progressWrap}>
                    <div className={styles.progressBar}>
                      <motion.div
                        className={styles.progressFill}
                        style={{ background: tier.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.progress * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className={styles.progressLabel}>
                      {s.current.toLocaleString('pt-BR')}/{s.target.toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}

                {s.unlocked && (
                  <span className={styles.rewardLabel} style={{ color: tier.color }}>
                    +{s.def.goldReward} ⛁ recebido
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
