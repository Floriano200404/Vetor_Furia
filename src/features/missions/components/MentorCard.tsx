'use client';

/**
 * MentorCard — shows up to 3 coaching insights. Renders nothing if there's
 * nothing worth saying (avoids an empty box on the Dashboard).
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { getInsights } from '../services/mentor.service';
import styles from './MentorCard.module.css';

export function MentorCard() {
  const [insights] = useState(() =>
    typeof window === 'undefined' ? [] : getInsights(3),
  );

  if (insights.length === 0) return null;

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <Brain size={16} className={styles.headerIcon} />
        <h3 className={styles.title}>Mentor</h3>
      </header>

      <ul className={styles.list}>
        {insights.map((ins, idx) => (
          <motion.li
            key={ins.id}
            className={`${styles.item} ${styles[ins.tone]}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <span className={styles.itemIcon}>{ins.icon}</span>
            <span className={styles.itemText}>{ins.text}</span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
