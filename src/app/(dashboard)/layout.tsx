'use client';

/**
 * Dashboard Layout — Wraps all dashboard pages with Sidebar + Header + XP Bar.
 * Also handles the LevelUp modal globally and auth guard.
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/shared/components/Sidebar';
import { Header } from '@/shared/components/Header';
import { LevelUpModal, usePlayerStats } from '@/features/core-rpg';
import { runDailyCheck } from '@/features/core-rpg/services/daily-check.service';
import { useAuth } from '@/shared/providers/AuthProvider';
import { useToast } from '@/shared/components/Toast';
import { useSystem } from '@/features/system';
import styles from './dashboard.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isFirebaseMode, displayName, logout } = useAuth();
  const { stats, isLevelingUp, dismissLevelUp, newLevel } = usePlayerStats();
  const router = useRouter();
  const toast = useToast();
  const system = useSystem();
  const dailyCheckRan = useRef(false);
  const welcomedRef = useRef(false);

  // Auth guard: redirect to login when Firebase is active but user is not authenticated
  useEffect(() => {
    if (!isLoading && isFirebaseMode && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isFirebaseMode, isAuthenticated, router]);

  // Daily HP check — runs once per day on first access
  useEffect(() => {
    if (dailyCheckRan.current || isLoading) return;
    dailyCheckRan.current = true;

    // Small delay to let stats load first
    const timer = setTimeout(() => {
      const result = runDailyCheck();
      if (!result || result.type === 'no_habits') return;

      switch (result.type) {
        case 'death':
          system.notify({
            title: 'ZONA DE PENALIDADE',
            lines: [result.message],
            variant: 'penalty',
            autoCloseMs: 0, // morte fica aberta — exige reconhecimento
          });
          break;
        case 'damage':
          system.notify({
            title: 'PENALIDADE',
            lines: [result.message],
            variant: 'penalty',
          });
          break;
        case 'heal':
          system.notify({
            title: 'RECUPERAÇÃO',
            lines: [result.message],
            variant: 'reward',
          });
          break;
        case 'none':
          toast.info(result.message);
          break;
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading, toast, system]);

  // Janela do Sistema de boas-vindas — uma vez por sessão
  useEffect(() => {
    if (welcomedRef.current || isLoading) return;
    if (isFirebaseMode && !isAuthenticated) return;
    if (typeof window !== 'undefined' && sessionStorage.getItem('vetor_furia_welcomed')) return;
    welcomedRef.current = true;
    if (typeof window !== 'undefined') sessionStorage.setItem('vetor_furia_welcomed', '1');

    const name = isFirebaseMode ? displayName : stats.displayName;
    const timer = setTimeout(() => {
      system.notify({
        title: `Bem-vindo de volta, ${name}`,
        lines: [
          `Nível ${stats.level} · ${stats.avatarStage}`,
          'Suas missões de hoje aguardam, Caçador.',
        ],
        variant: 'quest',
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, isFirebaseMode, displayName, stats.level, stats.avatarStage, stats.displayName, system]);

  // Show nothing while checking auth
  if (isLoading) {
    return (
      <div className={styles.layout}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '100vh' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (isFirebaseMode && !isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Header stats={stats} displayName={isFirebaseMode ? displayName : stats.displayName} onLogout={isFirebaseMode ? logout : undefined} />
        <main className={styles.content}>
          {children}
        </main>
      </div>
      <LevelUpModal
        isOpen={isLevelingUp}
        newLevel={newLevel}
        onClose={dismissLevelUp}
      />
    </div>
  );
}
