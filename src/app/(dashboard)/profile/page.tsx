'use client';

/**
 * Profile Page — Detailed player profile with XP history, stats, and avatar.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Calendar, TrendingUp, Flame, Dumbbell, BookOpen, CheckSquare, User, Edit3, Save } from 'lucide-react';
import { usePlayerStats, AvatarDisplay, LevelBadge } from '@/features/core-rpg';
import { useAuth } from '@/shared/providers/AuthProvider';
import { getPlayer, savePlayer, getLedgerEntries } from '@/features/core-rpg/services/xp-ledger.service';
import type { XPEntry } from '@/features/core-rpg';
import styles from './profile.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const SOURCE_ICONS: Record<string, { icon: typeof Zap; color: string; label: string }> = {
  habits: { icon: CheckSquare, color: 'var(--accent-success)', label: 'Hábitos' },
  workouts: { icon: Dumbbell, color: 'var(--accent-warning)', label: 'Treinos' },
  studies: { icon: BookOpen, color: 'var(--accent-secondary)', label: 'Estudos' },
  biometry: { icon: TrendingUp, color: 'var(--accent-primary)', label: 'Biometria' },
  bonus: { icon: Trophy, color: '#f59e0b', label: 'Bônus' },
};

export default function ProfilePage() {
  const { stats, recentXP } = usePlayerStats();
  const { displayName: authName, isFirebaseMode } = useAuth();
  const allEntries = useMemo(() => getLedgerEntries(), []);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 15;

  // Stats aggregation
  const totalEntries = allEntries.length;
  const xpBySource = useMemo(() => {
    const map: Record<string, number> = {};
    allEntries.forEach((e) => {
      map[e.source] = (map[e.source] || 0) + e.amount;
    });
    return map;
  }, [allEntries]);

  const uniqueDays = useMemo(() => {
    const days = new Set(allEntries.map((e) => new Date(e.createdAt).toISOString().split('T')[0]));
    return days.size;
  }, [allEntries]);

  // XP chart data (last 14 days)
  const chartData = useMemo(() => {
    const days: { date: string; xp: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayXP = allEntries
        .filter((e) => new Date(e.createdAt).toISOString().split('T')[0] === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
      days.push({ date: dateStr, xp: dayXP });
    }
    return days;
  }, [allEntries]);

  const maxChartXP = Math.max(...chartData.map((d) => d.xp), 1);

  // Paginated ledger
  const paginatedEntries = allEntries.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(allEntries.length / PAGE_SIZE);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      const player = getPlayer();
      player.displayName = nameInput.trim();
      savePlayer(player);
      setEditingName(false);
    }
  };

  return (
    <motion.div className={styles.page} variants={containerVariants} initial="hidden" animate="visible">
      {/* Hero Section */}
      <motion.div className={styles.hero} variants={itemVariants}>
        <div className={styles.avatarSection}>
          <AvatarDisplay
            sprite={stats.avatarSprite}
            stageName={stats.avatarStage}
            level={stats.level}
            size="lg"
          />
          <LevelBadge level={stats.level} size="lg" />
        </div>
        <div className={styles.heroInfo}>
          <div className={styles.nameRow}>
            {editingName ? (
              <div className={styles.nameEdit}>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Seu nome"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleSaveName}>
                  <Save size={14} />
                </button>
              </div>
            ) : (
              <h1 className={styles.heroName}>
                {authName || 'Guerreiro'}
                <button className={styles.editBtn} onClick={() => { setNameInput(authName || ''); setEditingName(true); }}>
                  <Edit3 size={14} />
                </button>
              </h1>
            )}
          </div>
          <p className={styles.heroStage}>{stats.avatarStage} · Nível {stats.level}</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <Zap size={16} style={{ color: 'var(--accent-secondary)' }} />
              <span>{stats.totalXP.toLocaleString('pt-BR')} XP</span>
            </div>
            <div className={styles.heroStat}>
              <Calendar size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>{uniqueDays} dias ativos</span>
            </div>
            <div className={styles.heroStat}>
              <Flame size={16} style={{ color: 'var(--accent-warning)' }} />
              <span>{totalEntries} ações</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* XP Distribution */}
      <motion.div className={styles.section} variants={itemVariants}>
        <h3 className={styles.sectionTitle}>Distribuição de XP</h3>
        <div className={styles.distributionGrid}>
          {Object.entries(SOURCE_ICONS).map(([key, config]) => {
            const xp = xpBySource[key] || 0;
            const Icon = config.icon;
            const pct = stats.totalXP > 0 ? ((xp / stats.totalXP) * 100).toFixed(0) : '0';
            return (
              <div key={key} className={styles.distCard}>
                <div className={styles.distIcon} style={{ background: `${config.color}15`, color: config.color }}>
                  <Icon size={20} />
                </div>
                <div className={styles.distInfo}>
                  <span className={styles.distLabel}>{config.label}</span>
                  <span className={styles.distValue}>{xp.toLocaleString('pt-BR')} XP</span>
                </div>
                <span className={styles.distPct}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* XP Chart (last 14 days) */}
      <motion.div className={styles.section} variants={itemVariants}>
        <h3 className={styles.sectionTitle}>
          <TrendingUp size={16} /> Evolução (últimos 14 dias)
        </h3>
        <div className={styles.chart}>
          {chartData.map((day) => (
            <div key={day.date} className={styles.chartBar}>
              <motion.div
                className={styles.chartFill}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((day.xp / maxChartXP) * 100, 2)}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.1 }}
              />
              <span className={styles.chartLabel}>
                {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit' })}
              </span>
              {day.xp > 0 && <span className={styles.chartTooltip}>+{day.xp}</span>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* XP Ledger History */}
      <motion.div className={styles.section} variants={itemVariants}>
        <h3 className={styles.sectionTitle}>
          <Zap size={16} /> Histórico Completo ({allEntries.length} registros)
        </h3>
        <div className={styles.ledger}>
          {paginatedEntries.map((entry: XPEntry) => {
            const config = SOURCE_ICONS[entry.source] || SOURCE_ICONS.bonus;
            const Icon = config.icon;
            return (
              <div key={entry.id} className={styles.ledgerRow}>
                <div className={styles.ledgerIcon} style={{ color: config.color }}>
                  <Icon size={14} />
                </div>
                <span className={styles.ledgerDesc}>{entry.description}</span>
                <span className={styles.ledgerXP}>+{entry.amount}</span>
                <span className={styles.ledgerDate}>
                  {new Date(entry.createdAt).toLocaleDateString('pt-BR')} {new Date(entry.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(currentPage - 1)}>← Anterior</button>
            <span>{currentPage + 1} / {totalPages}</span>
            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(currentPage + 1)}>Próximo →</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
