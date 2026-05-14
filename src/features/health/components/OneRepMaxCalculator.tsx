'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Zap } from 'lucide-react';
import { calculate1RM } from '../services/workout-analytics.service';
import styles from './OneRepMaxCalculator.module.css';

interface IntensityRow {
  pct: number;
  label: string;
  weight: number;
}

const INTENSITY_PCTS: Array<{ pct: number; label: string }> = [
  { pct: 0.95, label: '95% — 2 reps' },
  { pct: 0.9, label: '90% — 3 reps' },
  { pct: 0.85, label: '85% — 5 reps' },
  { pct: 0.8, label: '80% — 8 reps' },
  { pct: 0.75, label: '75% — 10 reps' },
  { pct: 0.7, label: '70% — 12 reps' },
];

export function OneRepMaxCalculator() {
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [result, setResult] = useState<number | null>(null);

  const isValid =
    parseFloat(weight) > 0 && parseInt(reps, 10) > 0 && parseInt(reps, 10) <= 15;

  const intensityRows: IntensityRow[] = useMemo(() => {
    if (result === null || result === 0) return [];
    return INTENSITY_PCTS.map(({ pct, label }) => ({
      pct,
      label,
      weight: Math.round(result * pct * 10) / 10,
    }));
  }, [result]);

  const handleCalculate = () => {
    if (!isValid) return;
    const oneRM = calculate1RM(parseFloat(weight), parseInt(reps, 10));
    setResult(oneRM);
  };

  const handleReset = () => {
    setWeight('');
    setReps('');
    setResult(null);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Calculator size={18} />
          <h3 className={styles.title}>Calculadora de 1RM</h3>
        </div>
        <span className={styles.formula}>Fórmula de Epley</span>
      </header>

      <p className={styles.hint}>
        Insira a carga e o número de repetições da sua melhor série para estimar
        sua repetição máxima (1RM). Funciona melhor entre 1 e 10 reps.
      </p>

      <div className={styles.inputs}>
        <label className={styles.field}>
          <span>Carga (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            placeholder="80"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        </label>

        <label className={styles.field}>
          <span>Repetições</span>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            max="15"
            placeholder="5"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        </label>
      </div>

      <div className={styles.actions}>
        <motion.button
          type="button"
          className={styles.calcBtn}
          onClick={handleCalculate}
          disabled={!isValid}
          whileHover={isValid ? { scale: 1.02 } : undefined}
          whileTap={isValid ? { scale: 0.98 } : undefined}
        >
          <Zap size={16} /> Calcular 1RM
        </motion.button>
        {result !== null && (
          <button type="button" className={styles.resetBtn} onClick={handleReset}>
            Limpar
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {result !== null && (
          <motion.div
            key={result}
            className={styles.resultBox}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className={styles.resultMain}>
              <span className={styles.resultLabel}>Seu 1RM estimado</span>
              <motion.span
                className={styles.resultValue}
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 18,
                  delay: 0.05,
                }}
              >
                {result.toFixed(1)}
                <span className={styles.resultUnit}>kg</span>
              </motion.span>
            </div>

            <div className={styles.intensityGrid}>
              <div className={styles.intensityHeader}>
                Intensidades de treino
              </div>
              {intensityRows.map((row, idx) => (
                <motion.div
                  key={row.pct}
                  className={styles.intensityRow}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.04 }}
                >
                  <span className={styles.intensityLabel}>{row.label}</span>
                  <span className={styles.intensityWeight}>{row.weight} kg</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
