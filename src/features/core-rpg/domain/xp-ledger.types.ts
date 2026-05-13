/**
 * XP Ledger Domain Types — transactional history
 */

import type { XPSource } from '@/shared/events/xp-events';

export interface XPEntry {
  id: string;
  userId: string;
  amount: number;
  source: XPSource;
  sourceId: string;
  description: string;
  createdAt: number;
}
