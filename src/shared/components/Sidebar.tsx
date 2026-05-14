'use client';

/**
 * Sidebar — Main navigation sidebar with module links.
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Dumbbell,
  BookOpen,
  User,
  Flame,
  Store,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/habits', label: 'Hábitos', icon: CheckSquare },
  { href: '/workouts', label: 'Treinos', icon: Dumbbell },
  { href: '/studies', label: 'Estudos', icon: BookOpen },
  { href: '/store', label: 'Loja', icon: Store },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Flame className={styles.logoIcon} />
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>Vetor</span>
          <span className={styles.logoAccent}>Fúria</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              {isActive && (
                <motion.div
                  className={styles.activeIndicator}
                  layoutId="sidebar-active"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <Icon size={20} className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.version}>v1.1</div>
      </div>
    </aside>
  );
}
