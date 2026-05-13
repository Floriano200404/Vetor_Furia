'use client';

/**
 * RestTimer — Cronômetro de descanso entre séries.
 * Componente flutuante com countdown circular SVG.
 * Usa Web Audio API para beep de notificação (sem dependências externas).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SkipForward, Timer } from 'lucide-react';
import styles from './RestTimer.module.css';

interface RestTimerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDuration?: number; // seconds
}

const DURATION_OPTIONS = [60, 90, 120, 180];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);

    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.6);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.6);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.1);
    osc2.start(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 1.1);

    // Cleanup
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Web Audio not available, fail silently
  }
}

function tryVibrate() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // Vibration API not available
  }
}

export function RestTimer({ isOpen, onClose, defaultDuration = 90 }: RestTimerProps) {
  const [totalDuration, setTotalDuration] = useState(defaultDuration);
  const [remaining, setRemaining] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setRemaining(totalDuration);
      setIsRunning(true);
      setIsDone(false);
    } else {
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isOpen, totalDuration]);

  // Countdown logic
  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsDone(true);
            playBeep();
            tryVibrate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remaining]);

  const handleChangeDuration = useCallback((dur: number) => {
    setTotalDuration(dur);
    setRemaining(dur);
    setIsRunning(true);
    setIsDone(false);
  }, []);

  const handleSkip = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onClose();
  }, [onClose]);

  // SVG circle calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? remaining / totalDuration : 0;
  const strokeDashoffset = circumference * (1 - progress);

  // Color phase
  const getPhaseClass = () => {
    if (remaining <= 5) return styles.progressDanger;
    if (remaining <= 15) return styles.progressWarning;
    return styles.progressNormal;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className={`${styles.container} ${isDone ? styles.timerDone : ''}`}>
            <button className={styles.closeBtn} onClick={handleSkip} aria-label="Fechar timer">
              <X size={14} />
            </button>

            <span className={styles.timerLabel}>
              <Timer size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Descanso
            </span>

            {/* Circular SVG Timer */}
            <div className={styles.circleWrap}>
              <svg className={styles.circleSvg} viewBox="0 0 140 140">
                <circle className={styles.trackCircle} cx="70" cy="70" r={radius} />
                <circle
                  className={`${styles.progressCircle} ${getPhaseClass()}`}
                  cx="70"
                  cy="70"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className={styles.timeDisplay}>
                <span className={styles.timeText}>{formatTime(remaining)}</span>
                <span className={styles.timeSubtext}>{isDone ? '✅ Pronto!' : 'restante'}</span>
              </div>
            </div>

            {/* Duration Selector */}
            <div className={styles.durationRow}>
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  className={`${styles.durationBtn} ${totalDuration === d ? styles.durationBtnActive : ''}`}
                  onClick={() => handleChangeDuration(d)}
                >
                  {d < 60 ? `${d}s` : `${d / 60}min`}{d === 90 ? '½' : ''}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className={styles.actionRow}>
              <button className={styles.skipBtn} onClick={handleSkip}>
                <SkipForward size={14} />
                {isDone ? 'Fechar' : 'Pular'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
