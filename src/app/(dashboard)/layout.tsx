'use client';

/**
 * Dashboard Layout — Wraps all dashboard pages with Sidebar + Header + XP Bar.
 * Also handles the LevelUp modal globally and auth guard.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/shared/components/Sidebar';
import { Header } from '@/shared/components/Header';
import { LevelUpModal, usePlayerStats } from '@/features/core-rpg';
import { useAuth } from '@/shared/providers/AuthProvider';
import styles from './dashboard.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, isFirebaseMode, displayName, logout } = useAuth();
  const { stats, isLevelingUp, dismissLevelUp, newLevel } = usePlayerStats();
  const router = useRouter();

  // Auth guard: redirect to login when Firebase is active but user is not authenticated
  useEffect(() => {
    if (!isLoading && isFirebaseMode && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isFirebaseMode, isAuthenticated, router]);

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
        <Header stats={stats} displayName={displayName} onLogout={isFirebaseMode ? logout : undefined} />
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
