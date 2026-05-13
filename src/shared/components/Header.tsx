'use client';

/**
 * Header — Top bar with XP progress, player info, and auth controls.
 */

import { XPBar, HPBar, GoldDisplay, AvatarDisplay } from '@/features/core-rpg';
import type { PlayerStats } from '@/features/core-rpg';
import { LogOut } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  stats: PlayerStats;
  displayName?: string;
  onLogout?: () => void;
}

export function Header({ stats, displayName, onLogout }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <HPBar hp={stats.hp} maxHp={stats.maxHp} />
      </div>

      <div className={styles.center}>
        <XPBar
          progress={stats.xpProgress}
          level={stats.level}
          currentXP={stats.totalXP - stats.xpForCurrentLevel}
          nextLevelXP={stats.xpForNextLevel - stats.xpForCurrentLevel}
          compact
        />
      </div>

      <div className={styles.right}>
        <GoldDisplay gold={stats.gold} />
        
        <div className={styles.xpTotal}>
          <span className={styles.xpValue}>{stats.totalXP.toLocaleString('pt-BR')}</span>
          <span className={styles.xpLabel}>XP Total</span>
        </div>
        <AvatarDisplay
          sprite={stats.avatarSprite}
          stageName={stats.avatarStage}
          level={stats.level}
          size="sm"
        />
        {onLogout && (
          <button
            className={styles.logoutBtn}
            onClick={onLogout}
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
