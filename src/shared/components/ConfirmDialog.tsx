'use client';

/**
 * ConfirmDialog — imperative confirmation modal.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: 'Excluir treino?',
 *     message: 'Esta ação não pode ser desfeita.',
 *     danger: true,
 *   });
 *   if (!ok) return;
 *
 * The imperative API avoids prop-drilling open/onConfirm/onCancel at every callsite
 * and reads linearly inside event handlers.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in red and uses a warning icon. */
  danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) {
    // Fallback so callsites outside the provider don't crash — they get a
    // native confirm() instead. Useful in tests or storybook.
    return (opts) => Promise.resolve(window.confirm(`${opts.title}\n\n${opts.message}`));
  }
  return fn;
}

interface InternalState extends ConfirmOptions {
  open: boolean;
}

const DEFAULT_STATE: InternalState = {
  open: false,
  title: '',
  message: '',
};

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InternalState>(DEFAULT_STATE);
  // Holds the resolve() of the currently open promise so we can settle it
  // from anywhere (close button, backdrop click, confirm/cancel).
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ ...opts, open: true });
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state.open && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => settle(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <motion.div
              className={`${styles.dialog} ${state.danger ? styles.dialogDanger : ''}`}
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => settle(false)}
                aria-label="Fechar"
              >
                <X size={16} />
              </button>

              <div className={styles.iconWrap}>
                <AlertTriangle size={28} />
              </div>

              <h3 id="confirm-title" className={styles.title}>
                {state.title}
              </h3>
              <p className={styles.message}>{state.message}</p>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`btn btn-secondary ${styles.actionBtn}`}
                  onClick={() => settle(false)}
                  autoFocus
                >
                  {state.cancelLabel ?? 'Cancelar'}
                </button>
                <button
                  type="button"
                  className={`btn ${state.danger ? styles.btnDanger : 'btn-primary'} ${styles.actionBtn}`}
                  onClick={() => settle(true)}
                >
                  {state.confirmLabel ?? 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
