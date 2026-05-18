'use client';

/**
 * Login Page — Firebase Auth (Google + Email/Password).
 * Shown when Firebase is configured and the user is not authenticated.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/providers/AuthProvider';
import styles from './login.module.css';

export default function LoginPage() {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    error,
    clearError,
  } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const busy = submitting || googleLoading;
  const passwordTooShort = password.length > 0 && password.length < 6;
  const canSubmit = email.trim() !== '' && password.length >= 6 && !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch {
      // error is surfaced via the auth context
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      // handled by context
    } finally {
      setGoogleLoading(false);
    }
  };

  const toggleMode = () => {
    clearError();
    setIsRegister((v) => !v);
  };

  // Hide any stale auth error as soon as the user edits the form again.
  const onField = (setter: (v: string) => void) => (v: string) => {
    if (error) clearError();
    setter(v);
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className={styles.logo}>
          <Flame className={styles.logoIcon} />
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Vetor</span>
            <span className={styles.logoAccent}>Fúria</span>
          </div>
        </div>

        <p className={styles.subtitle}>
          {isRegister
            ? 'Crie sua conta e comece sua jornada'
            : 'Entre para continuar sua evolução'}
        </p>

        <motion.button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={busy}
          whileHover={busy ? undefined : { scale: 1.02 }}
          whileTap={busy ? undefined : { scale: 0.98 }}
          aria-label="Entrar com Google"
        >
          {googleLoading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
              style={{ display: 'inline-flex' }}
            >
              <Loader2 size={18} />
            </motion.span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          )}
          {googleLoading ? 'Conectando…' : 'Entrar com Google'}
        </motion.button>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <Mail size={16} className={styles.fieldIcon} aria-hidden="true" />
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => onField(setEmail)(e.target.value)}
              required
              disabled={busy}
            />
          </div>
          <div className={styles.field}>
            <Lock size={16} className={styles.fieldIcon} aria-hidden="true" />
            <input
              type="password"
              placeholder="Senha"
              aria-label="Senha"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => onField(setPassword)(e.target.value)}
              required
              minLength={6}
              disabled={busy}
            />
          </div>

          {passwordTooShort && (
            <p className={styles.hint}>A senha precisa de pelo menos 6 caracteres.</p>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <motion.button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.02 } : undefined}
            whileTap={canSubmit ? { scale: 0.98 } : undefined}
          >
            {submitting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                style={{ display: 'inline-flex' }}
              >
                <Loader2 size={18} />
              </motion.span>
            ) : (
              <LogIn size={18} />
            )}
            {submitting
              ? (isRegister ? 'Criando…' : 'Entrando…')
              : (isRegister ? 'Criar Conta' : 'Entrar')}
          </motion.button>
        </form>

        <button
          type="button"
          className={styles.toggleBtn}
          onClick={toggleMode}
          disabled={busy}
        >
          {isRegister ? 'Já tem uma conta? Entrar' : 'Não tem conta? Criar uma'}
        </button>
      </motion.div>
    </div>
  );
}
