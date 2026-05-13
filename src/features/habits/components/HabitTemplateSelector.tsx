'use client';

/**
 * HabitTemplateSelector — Modal-style selector for pre-built habit templates.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { HABIT_TEMPLATES, TEMPLATE_CATEGORIES } from '../domain/habit-templates';
import type { HabitTemplate } from '../domain/habit-templates';
import styles from './HabitTemplateSelector.module.css';

interface HabitTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: HabitTemplate) => void;
}

export function HabitTemplateSelector({ isOpen, onClose, onSelect }: HabitTemplateSelectorProps) {
  const categories = Object.entries(TEMPLATE_CATEGORIES) as [keyof typeof TEMPLATE_CATEGORIES, typeof TEMPLATE_CATEGORIES[keyof typeof TEMPLATE_CATEGORIES]][];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <h3 className={styles.title}>Adicionar Hábito</h3>
              <button className={`btn btn-ghost btn-icon ${styles.closeBtn}`} onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.content}>
              {categories.map(([key, cat]) => {
                const templates = HABIT_TEMPLATES.filter((t) => t.category === key);
                return (
                  <div key={key} className={styles.category}>
                    <h4 className={styles.categoryTitle} style={{ color: cat.color }}>
                      {cat.label}
                    </h4>
                    <div className={styles.templateGrid}>
                      {templates.map((template) => (
                        <motion.button
                          key={template.title}
                          className={styles.templateCard}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onSelect(template);
                            onClose();
                          }}
                        >
                          <span className={styles.templateIcon}>{template.icon}</span>
                          <span className={styles.templateTitle}>{template.title}</span>
                          <span className={styles.templateXP}>+{template.xpReward} XP</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
