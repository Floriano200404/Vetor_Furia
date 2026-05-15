'use client';

/**
 * BossBattleCard — daily challenge with opt-in stakes.
 * On mount: reconciles any missed accepted battle (HP penalty) and settles
 * a win if the objective is already met.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Check } from 'lucide-react';
import { eventBus, XP_EVENTS, GAME_EVENTS } from '@/shared/events';
import { useToast } from '@/shared/components/Toast';
import { DEFAULT_USER_ID } from '@/lib/constants';
import {
  getTodaysBoss,
  getBossState,
  acceptBoss,
  evaluateBossProgress,
  settleToday,
  reconcilePastLoss,
  markWon,
  type BossState,
} from '../services/boss-battle.service';
import styles from './BossBattleCard.module.css';

export function BossBattleCard() {
  const toast = useToast();
  const [boss] = useState(() => getTodaysBoss());
  const [state, setState] = useState<BossState>('idle');
  const [progress, setProgress] = useState({ current: 0, done: false });

  useEffect(() => {
    // 1) Penalize any missed accepted battle from previous days.
    const penalty = reconcilePastLoss();
    if (penalty > 0) {
      eventBus.emit(GAME_EVENTS.HP_DAMAGE, {
        userId: DEFAULT_USER_ID,
        amount: penalty,
        reason: 'Boss Battle não cumprida',
        sourceId: 'boss-battle',
      });
      toast.error(`Boss Battle perdida! -${penalty} HP`);
    }

    // 2) Settle today's win if already met.
    const result = settleToday(boss);
    const curState = getBossState();
    const prog = evaluateBossProgress(boss);

    if (result === 'won' && curState !== 'won') {
      eventBus.emit(XP_EVENTS.XP_EARNED, {
        userId: DEFAULT_USER_ID,
        amount: boss.xpReward,
        source: 'bonus' as const,
        sourceId: 'boss-battle',
        description: `${boss.icon} Boss derrotado: ${boss.title}`,
        timestamp: Date.now(),
      });
      eventBus.emit(GAME_EVENTS.GOLD_EARNED, {
        userId: DEFAULT_USER_ID,
        amount: boss.goldReward,
        source: `Boss Battle: ${boss.title}`,
      });
      toast.success(`Boss derrotado! +${boss.xpReward} XP, +${boss.goldReward} ⛁`);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getBossState());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(prog);
  }, [boss, toast]);

  const handleAccept = () => {
    acceptBoss();
    setState('accepted');
    toast.info('Desafio aceito! Cumpra até o fim do dia ou perca HP.');
  };

  const handleClaim = () => {
    markWon();
    eventBus.emit(XP_EVENTS.XP_EARNED, {
      userId: DEFAULT_USER_ID,
      amount: boss.xpReward,
      source: 'bonus' as const,
      sourceId: 'boss-battle',
      description: `${boss.icon} Boss derrotado: ${boss.title}`,
      timestamp: Date.now(),
    });
    eventBus.emit(GAME_EVENTS.GOLD_EARNED, {
      userId: DEFAULT_USER_ID,
      amount: boss.goldReward,
      source: `Boss Battle: ${boss.title}`,
    });
    setState('won');
    toast.success(`Boss derrotado! +${boss.xpReward} XP, +${boss.goldReward} ⛁`);
  };

  const pct = boss.target > 0 ? Math.min(100, (progress.current / boss.target) * 100) : 0;

  return (
    <section className={`${styles.wrapper} ${state === 'won' ? styles.won : ''}`}>
      <div className={styles.glow} aria-hidden="true" />
      <header className={styles.header}>
        <span className={styles.icon}>{boss.icon}</span>
        <div className={styles.headerText}>
          <span className={styles.kicker}>
            <Swords size={12} /> Boss Battle do Dia
          </span>
          <h3 className={styles.title}>{boss.title}</h3>
        </div>
      </header>

      <p className={styles.desc}>{boss.description}</p>

      <div className={styles.progressBar}>
        <motion.div
          className={styles.progressFill}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className={styles.progressLabel}>
        {progress.current.toLocaleString('pt-BR')} / {boss.target.toLocaleString('pt-BR')}
      </span>

      <div className={styles.rewards}>
        <span>🎁 +{boss.xpReward} XP</span>
        <span>⛁ +{boss.goldReward}</span>
        <span className={styles.penalty}>💀 -{boss.hpPenalty} HP se falhar</span>
      </div>

      <div className={styles.actions}>
        {state === 'won' ? (
          <div className={styles.wonBanner}>
            <Check size={16} /> Boss derrotado!
          </div>
        ) : state === 'lost' ? (
          <div className={styles.lostBanner}>Falhou desta vez. Amanhã tem outro.</div>
        ) : state === 'accepted' ? (
          progress.done ? (
            <button className="btn btn-success" onClick={handleClaim}>
              Reivindicar vitória
            </button>
          ) : (
            <span className={styles.acceptedTag}>⚔️ Desafio aceito — em andamento</span>
          )
        ) : (
          <button className="btn btn-primary" onClick={handleAccept}>
            <Swords size={14} /> Aceitar desafio
          </button>
        )}
      </div>
    </section>
  );
}
