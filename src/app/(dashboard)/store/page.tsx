'use client';

/**
 * Store Page — Reward store to spend gold.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, Trash2, ShoppingCart, Gamepad2, Tv, Pizza, Coffee, Music, Gift } from 'lucide-react';
import { usePlayerStats } from '@/features/core-rpg';
import { getRewards, addReward, deleteReward, purchaseReward } from '@/features/store/services/store.service';
import type { Reward } from '@/features/store/domain/store.types';
import styles from './store.module.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const ICON_MAP: Record<string, React.ReactNode> = {
  Gamepad2: <Gamepad2 size={24} />,
  Tv: <Tv size={24} />,
  Pizza: <Pizza size={24} />,
  Coffee: <Coffee size={24} />,
  Music: <Music size={24} />,
  Gift: <Gift size={24} />,
};

export default function StorePage() {
  const { stats } = usePlayerStats();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCost, setNewCost] = useState(50);
  const [newIcon, setNewIcon] = useState('Gift');

  useEffect(() => {
    setRewards(getRewards());
  }, []);

  const handleAdd = () => {
    if (!newTitle.trim() || newCost <= 0) return;
    const r = addReward({ title: newTitle, description: newDesc, cost: newCost, icon: newIcon });
    setRewards(prev => [...prev, r]);
    setIsAdding(false);
    setNewTitle(''); setNewDesc(''); setNewCost(50);
  };

  const handleDelete = (id: string) => {
    deleteReward(id);
    setRewards(prev => prev.filter(r => r.id !== id));
  };

  const handlePurchase = (reward: Reward) => {
    if (purchaseReward(reward)) {
      // Optional: Show a success toast or animation here
      alert(`Você resgatou: ${reward.title}! Aproveite.`);
    } else {
      alert('Ouro insuficiente!');
    }
  };

  return (
    <motion.div className={styles.page} variants={containerVariants} initial="hidden" animate="visible">
      <motion.div className={styles.header} variants={itemVariants}>
        <div>
          <h1 className={styles.title}>Loja de Recompensas</h1>
          <p className={styles.subtitle}>Gaste seu Ouro com recompensas reais.</p>
        </div>
        <div className={styles.goldBalance}>
          <Coins size={20} />
          <span>{stats.gold.toLocaleString('pt-BR')} Gold</span>
        </div>
      </motion.div>

      <motion.div className={styles.grid} variants={itemVariants}>
        {rewards.map(reward => {
          const canAfford = stats.gold >= reward.cost;
          return (
            <motion.div key={reward.id} className={`${styles.card} ${!canAfford ? styles.cardDisabled : ''}`} whileHover={{ scale: 1.02 }}>
              <button className={styles.delBtn} onClick={() => handleDelete(reward.id)}>
                <Trash2 size={14} />
              </button>
              <div className={styles.cardIcon}>{ICON_MAP[reward.icon] || <Gift size={24} />}</div>
              <h3 className={styles.cardTitle}>{reward.title}</h3>
              <p className={styles.cardDesc}>{reward.description}</p>
              <button 
                className={`${styles.purchaseBtn} ${canAfford ? styles.canAfford : styles.cannotAfford}`}
                onClick={() => handlePurchase(reward)}
                disabled={!canAfford}
              >
                <ShoppingCart size={16} />
                <span>{reward.cost}g</span>
              </button>
            </motion.div>
          );
        })}

        {/* Add New Reward Card */}
        {!isAdding ? (
          <motion.div className={styles.addCard} onClick={() => setIsAdding(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Plus size={32} />
            <span>Nova Recompensa</span>
          </motion.div>
        ) : (
          <div className={styles.formCard}>
            <input placeholder="Título" value={newTitle} onChange={e => setNewTitle(e.target.value)} className={styles.input} autoFocus />
            <input placeholder="Descrição (opcional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} className={styles.input} />
            <div className={styles.row}>
              <input type="number" min="1" value={newCost} onChange={e => setNewCost(parseInt(e.target.value) || 0)} className={styles.input} />
              <select value={newIcon} onChange={e => setNewIcon(e.target.value)} className={styles.select}>
                {Object.keys(ICON_MAP).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className={styles.formActions}>
              <button className="btn btn-ghost" onClick={() => setIsAdding(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd}>Salvar</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
