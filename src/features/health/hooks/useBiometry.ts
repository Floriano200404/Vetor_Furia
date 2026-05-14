'use client';

/**
 * useBiometry — Hook for biometry tracking with XP integration.
 */

import { useState, useEffect, useCallback } from 'react';
import { eventBus, XP_EVENTS } from '@/shared/events';
import type { Biometry } from '../domain/biometry.types';
import { getBiometryRecords, addBiometry } from '../services/health.service';
import { DEFAULT_USER_ID, XP_REWARDS } from '@/lib/constants';

export function useBiometry() {
  const [records, setRecords] = useState<Biometry[]>([]);

  const refresh = useCallback(() => {
    setRecords(getBiometryRecords());
  }, []);

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(); }, [refresh]);

  const handleAddBiometry = useCallback((data: {
    weight: number;
    height: number;
    biomarkers: Record<string, number | string>;
  }) => {
    const record = addBiometry(data);

    eventBus.emit(XP_EVENTS.XP_EARNED, {
      userId: DEFAULT_USER_ID,
      amount: XP_REWARDS.BIOMETRY_LOG,
      source: 'biometry' as const,
      sourceId: record.id,
      description: `📊 Biometria registrada (${data.weight}kg)`,
      timestamp: Date.now(),
    });

    refresh();
    return record;
  }, [refresh]);

  return {
    records,
    addBiometry: handleAddBiometry,
    latest: records[0] || null,
    refresh,
  };
}
