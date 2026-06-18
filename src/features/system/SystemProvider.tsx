'use client';

/**
 * SystemProvider — "O Sistema" (estética Solo Leveling).
 *
 * Exibe janelas translúcidas do Sistema para momentos marcantes:
 * quest diária, level up, recompensa e penalidade. Toca um "PING!"
 * ao aparecer (via WebAudio, sem arquivo externo).
 *
 * Uso: const system = useSystem(); system.notify({ title, lines, variant }).
 */

import {
  useState,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SystemWindow.module.css';

export type SystemVariant = 'default' | 'quest' | 'levelup' | 'reward' | 'penalty';

export interface SystemMessageInput {
  title: string;
  lines: string[];
  variant?: SystemVariant;
  /** ms até fechar sozinho; 0 = só fecha no clique. Padrão 5500. */
  autoCloseMs?: number;
}

interface SystemMessage extends SystemMessageInput {
  id: number;
}

interface SystemContextType {
  notify: (msg: SystemMessageInput) => void;
}

const SystemContext = createContext<SystemContextType | null>(null);

export function useSystem(): SystemContextType {
  const ctx = useContext(SystemContext);
  if (!ctx) return { notify: () => {} };
  return ctx;
}

/** "PING!" do Sistema — beep curto e ascendente via WebAudio. */
function playPing(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1480, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
    osc.start();
    osc.stop(ctx.currentTime + 0.34);
  } catch {
    // som é opcional — ignora falhas (ex.: autoplay bloqueado)
  }
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SystemMessage[]>([]);

  const notify = useCallback((msg: SystemMessageInput) => {
    const id = Date.now() + Math.random();
    setQueue((prev) => [...prev, { id, ...msg }]);
    playPing();
    const ttl = msg.autoCloseMs ?? 5500;
    if (ttl > 0) {
      setTimeout(() => setQueue((prev) => prev.filter((m) => m.id !== id)), ttl);
    }
  }, []);

  const dismiss = useCallback((id: number) => {
    setQueue((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const current = queue[0];

  return (
    <SystemContext.Provider value={{ notify }}>
      {children}
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismiss(current.id)}
          >
            <motion.div
              className={`${styles.window} ${styles[current.variant ?? 'default']}`}
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-live="assertive"
            >
              <div className={styles.scanline} />
              <header className={styles.header}>⟦ SISTEMA ⟧</header>
              <h3 className={styles.title}>{current.title}</h3>
              <div className={styles.body}>
                {current.lines.map((line, i) => (
                  <p key={i} className={styles.line}>
                    {line}
                  </p>
                ))}
              </div>
              <button className={styles.dismiss} onClick={() => dismiss(current.id)}>
                Toque para fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SystemContext.Provider>
  );
}
