'use client';

/**
 * AbilityPoints — alocação de pontos de habilidade (estilo Solo Leveling).
 *
 * Mostra os 5 atributos com o valor TOTAL = nível derivado (do que você faz)
 * + bônus (pontos alocados ao subir de nível). Quando há pontos disponíveis,
 * permite distribuí-los nos atributos.
 */

import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { ATTRIBUTES, buildBreakdown, type AttributeKey } from '../domain/attributes';
import type { XPSource } from '@/shared/events';
import { getPlayer, getLedgerEntries, spendAbilityPoint } from '../services/xp-ledger.service';
import styles from './AbilityPoints.module.css';

export function AbilityPoints() {
  const [player, setPlayer] = useState(() => getPlayer());

  // Níveis derivados de cada atributo, a partir do histórico de XP.
  const breakdown = useMemo(() => {
    const xpBySource: Record<XPSource, number> = {
      habits: 0, workouts: 0, cardio: 0, studies: 0, biometry: 0, bonus: 0,
    };
    for (const entry of getLedgerEntries()) {
      xpBySource[entry.source] = (xpBySource[entry.source] ?? 0) + entry.amount;
    }
    return buildBreakdown(xpBySource);
  }, []);

  const points = player.abilityPoints ?? 0;
  const bonus = player.attributeBonus ?? {};

  const allocate = useCallback((key: AttributeKey) => {
    const updated = spendAbilityPoint(key);
    setPlayer({ ...updated, attributeBonus: { ...updated.attributeBonus } });
  }, []);

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <span className={styles.label}>⟦ ATRIBUTOS ⟧</span>
        <span className={`${styles.points} ${points > 0 ? styles.pointsAvail : ''}`}>
          {points} {points === 1 ? 'ponto' : 'pontos'}
        </span>
      </header>

      {points > 0 && (
        <p className={styles.hint}>
          Você subiu de nível, Caçador. Distribua seus pontos de habilidade.
        </p>
      )}

      <ul className={styles.list}>
        {ATTRIBUTES.map((attr) => {
          const derived = breakdown.find((b) => b.key === attr.key)?.level ?? 1;
          const extra = bonus[attr.key] ?? 0;
          return (
            <li key={attr.key} className={styles.row}>
              <span className={styles.icon} style={{ color: attr.color }}>{attr.icon}</span>
              <span className={styles.name}>{attr.label}</span>
              <span className={styles.value}>
                {derived + extra}
                {extra > 0 && <span className={styles.bonus}> (+{extra})</span>}
              </span>
              <button
                className={styles.plus}
                onClick={() => allocate(attr.key)}
                disabled={points <= 0}
                aria-label={`Adicionar ponto em ${attr.label}`}
              >
                <Plus size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
