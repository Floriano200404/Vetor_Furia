'use client';

/**
 * NotificationSettings — small panel for the user to grant/revoke the
 * browser's notification permission. Used inside the Profile page.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/shared/components/Toast';
import {
  dispatchReminder,
  getPermissionState,
  requestNotificationPermission,
  type NotificationPermissionState,
} from '../services/notifications.service';
import type { Habit } from '../domain/habit.types';
import { DEFAULT_USER_ID } from '@/lib/constants';
import styles from './NotificationSettings.module.css';

const DEMO_HABIT: Habit = {
  id: 'demo',
  userId: DEFAULT_USER_ID,
  title: 'Tudo certo!',
  icon: '🔔',
  xpReward: 0,
  isTemplate: false,
  order: 0,
  createdAt: Date.now(),
  trackingType: 'binary',
  schedule: { type: 'daily' },
  reminderTimes: [],
};

export function NotificationSettings() {
  const toast = useToast();
  // Lazy initializer reads permission once at first client render.
  // The function form is required so SSR doesn't try to touch `Notification`.
  const [state, setState] = useState<NotificationPermissionState>(() => {
    if (typeof window === 'undefined') return 'default';
    return getPermissionState();
  });

  const handleRequest = async () => {
    const next = await requestNotificationPermission();
    setState(next);
    if (next === 'granted') {
      toast.success('Permissão concedida! Você receberá lembretes.');
    } else if (next === 'denied') {
      toast.error('Permissão negada. Habilite manualmente nas configurações do navegador.');
    }
  };

  const handleTest = () => {
    const fired = dispatchReminder(DEMO_HABIT, new Date().toTimeString().slice(0, 5));
    if (fired) {
      toast.info('Notificação de teste enviada — confira o canto da tela.');
    } else {
      toast.error('Não foi possível enviar. Verifique a permissão.');
    }
  };

  return (
    <motion.section className={styles.wrapper}>
      <header className={styles.header}>
        {state === 'granted' ? (
          <Bell size={18} className={styles.iconGranted} />
        ) : state === 'denied' ? (
          <BellOff size={18} className={styles.iconDenied} />
        ) : (
          <Bell size={18} className={styles.iconDefault} />
        )}
        <div>
          <h3 className={styles.title}>Lembretes de hábitos</h3>
          <p className={styles.subtitle}>
            Receba notificações nos horários configurados em cada hábito.
            Funciona com o app aberto ou instalado como PWA.
          </p>
        </div>
      </header>

      <div className={styles.statusBox}>
        {state === 'unsupported' && (
          <div className={`${styles.status} ${styles.statusDenied}`}>
            <ShieldAlert size={14} /> Seu navegador não suporta notificações.
          </div>
        )}
        {state === 'default' && (
          <div className={`${styles.status} ${styles.statusDefault}`}>
            <Bell size={14} /> Permissão não solicitada ainda.
          </div>
        )}
        {state === 'granted' && (
          <div className={`${styles.status} ${styles.statusGranted}`}>
            <CheckCircle2 size={14} /> Permissão concedida.
          </div>
        )}
        {state === 'denied' && (
          <div className={`${styles.status} ${styles.statusDenied}`}>
            <BellOff size={14} /> Permissão negada. Reative nas configurações do navegador.
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {(state === 'default' || state === 'denied') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRequest}
          >
            <Bell size={14} /> Permitir notificações
          </button>
        )}
        {state === 'granted' && (
          <button type="button" className="btn btn-secondary" onClick={handleTest}>
            <Bell size={14} /> Enviar teste
          </button>
        )}
      </div>

      <p className={styles.hint}>
        💡 Mesmo sem permissão, os lembretes aparecem como toasts dentro do app.
        Notificações no celular bloqueado dependem de Push API (próxima onda).
      </p>
    </motion.section>
  );
}
