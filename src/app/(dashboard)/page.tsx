'use client';

/**
 * Dashboard Page — Main overview with avatar, stats, and recent activity.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, Zap, Target, Calendar, BookOpen, Dumbbell, CheckSquare, Heart, Coins, ShoppingBag } from 'lucide-react';
import { usePlayerStats, XPBar, AvatarDisplay, LevelBadge, ActivityHeatmap } from '@/features/core-rpg';
import { getLedgerEntries } from '@/features/core-rpg/services/xp-ledger.service';
import type { XPEntry } from '@/features/core-rpg';
import { TodayMissions } from '@/features/missions';
import styles from './page.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
};

function getSourceIcon(source: string) {
  switch (source) {
    case 'habits': return <CheckSquare size={14} />;
    case 'workouts': return <Dumbbell size={14} />;
    case 'studies': return <BookOpen size={14} />;
    default: return <Zap size={14} />;
  }
}

function getSourceColor(source: string) {
  switch (source) {
    case 'habits': return 'var(--accent-success)';
    case 'workouts': return 'var(--accent-warning)';
    case 'studies': return 'var(--accent-secondary)';
    default: return 'var(--accent-primary)';
  }
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'agora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
  return `${Math.floor(seconds / 86400)}d atrás`;
}

export default function DashboardPage() {
  const { stats, recentXP } = usePlayerStats();
  const allEntries = useMemo(() => getLedgerEntries(), []);

  const quickStats = [
    {
      icon: <Flame size={20} />,
      label: 'XP Total',
      value: stats.totalXP.toLocaleString('pt-BR'),
      color: 'var(--accent-primary)',
    },
    {
      icon: <TrendingUp size={20} />,
      label: 'Nível',
      value: stats.level.toString(),
      color: 'var(--accent-secondary)',
    },
    {
      icon: <Target size={20} />,
      label: 'Estágio',
      value: stats.avatarStage,
      color: 'var(--accent-success)',
    },
    {
      icon: <Calendar size={20} />,
      label: 'Próximo Nível',
      value: `${(stats.xpForNextLevel - stats.totalXP).toLocaleString('pt-BR')} XP`,
      color: 'var(--accent-warning)',
    },
    {
      icon: <Heart size={20} />,
      label: 'HP',
      value: `${stats.hp}/${stats.maxHp}`,
      color: '#ef4444',
    },
    {
      icon: <Coins size={20} />,
      label: 'Ouro',
      value: stats.gold.toLocaleString('pt-BR'),
      color: '#f59e0b',
    },
  ];

  return (
    <motion.div
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section — Avatar + XP */}
      <motion.section className={styles.hero} variants={itemVariants}>
        <div className={styles.heroAvatar}>
          <AvatarDisplay
            sprite={stats.avatarSprite}
            stageName={stats.avatarStage}
            level={stats.level}
            size="lg"
          />
          <LevelBadge level={stats.level} size="lg" />
        </div>
        <div className={styles.heroInfo}>
          <h1 className={styles.heroTitle}>
            <span className="gradient-text">Vetor Fúria</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Sua jornada de evolução pessoal. Cada ação conta.
          </p>
          <div className={styles.heroXP}>
            <XPBar
              progress={stats.xpProgress}
              level={stats.level}
              currentXP={stats.totalXP - stats.xpForCurrentLevel}
              nextLevelXP={stats.xpForNextLevel - stats.xpForCurrentLevel}
            />
          </div>
        </div>
      </motion.section>

      {/* Today's Missions — pending habits + suggestions */}
      <motion.section variants={itemVariants}>
        <TodayMissions />
      </motion.section>

      {/* Quick Stats Grid */}
      <motion.section className={styles.statsGrid} variants={itemVariants}>
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={styles.statCard}
            variants={itemVariants}
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className={styles.statIcon} style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* Recent Activity */}
      <motion.section className={styles.activitySection} variants={itemVariants}>
        <h3 className={styles.sectionTitle}>
          <Zap size={18} className={styles.sectionIcon} />
          Atividade Recente
        </h3>
        <div className={styles.activityList}>
          {recentXP.length === 0 ? (
            <div className={styles.emptyState}>
              <Flame size={32} className={styles.emptyIcon} />
              <p className={styles.emptyText}>
                Nenhuma atividade ainda. Complete hábitos, treinos ou estudos para ganhar XP!
              </p>
            </div>
          ) : (
            recentXP.map((entry: XPEntry, i: number) => (
              <motion.div
                key={entry.id}
                className={styles.activityItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div
                  className={styles.activityIcon}
                  style={{ background: getSourceColor(entry.source) }}
                >
                  {getSourceIcon(entry.source)}
                </div>
                <div className={styles.activityInfo}>
                  <span className={styles.activityDesc}>{entry.description}</span>
                  <span className={styles.activityTime}>{formatTimeAgo(entry.createdAt)}</span>
                </div>
                <span className={styles.activityXP}>+{entry.amount} XP</span>
              </motion.div>
            ))
          )}
        </div>
      </motion.section>

      {/* Activity Heatmap */}
      <motion.section variants={itemVariants}>
        <ActivityHeatmap entries={allEntries} />
      </motion.section>

      {/* Module Quick Access */}
      <motion.section className={styles.modulesSection} variants={itemVariants}>
        <h3 className={styles.sectionTitle}>Módulos</h3>
        <div className={styles.modulesGrid}>
          {[
            { icon: <CheckSquare size={28} />, title: 'Hábitos', desc: 'Checklist diário com streaks', href: '/habits', color: 'var(--accent-success)' },
            { icon: <Dumbbell size={28} />, title: 'Treinos', desc: 'Tracking de musculação', href: '/workouts', color: 'var(--accent-warning)' },
            { icon: <BookOpen size={28} />, title: 'Estudos', desc: 'Timer de foco + notas', href: '/studies', color: 'var(--accent-secondary)' },
            { icon: <ShoppingBag size={28} />, title: 'Loja', desc: 'Gaste ouro com recompensas', href: '/store', color: '#f59e0b' },
          ].map((mod) => (
            <motion.a
              key={mod.title}
              href={mod.href}
              className={styles.moduleCard}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={styles.moduleIcon} style={{ color: mod.color }}>
                {mod.icon}
              </div>
              <h4 className={styles.moduleTitle}>{mod.title}</h4>
              <p className={styles.moduleDesc}>{mod.desc}</p>
            </motion.a>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}
