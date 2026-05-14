/**
 * Backup Service — exports/imports the entire app state from localStorage.
 *
 * Format: a single JSON object keyed by localStorage key. Carries a `schema`
 * version + `exportedAt` timestamp so future formats can be migrated.
 *
 * IMPORTANT: this is best-effort. localStorage is the source of truth for the
 * UI; Firestore (when authenticated) is a separate sync layer. Importing
 * restores localStorage only — the user should re-trigger any cloud sync
 * after import if needed.
 */

export const BACKUP_SCHEMA_VERSION = 1;

/**
 * Every persisted key the app owns. Kept centralized so a new feature can't
 * silently break backups by introducing a new key without updating this list.
 */
export const BACKUP_KEYS = [
  'vetor_furia_player',
  'vetor_furia_xp_ledger',
  'vetor_furia_habits',
  'vetor_furia_habit_logs',
  'vetor_furia_last_daily_check',
  'vetor_furia_workouts',
  'vetor_furia_biometry',
  'vetor_furia_study_sessions',
  'vetor_furia_rewards',
  'vetor_furia_store_rewards',
  'vetor_furia_redemptions',
] as const;

export type BackupKey = (typeof BACKUP_KEYS)[number];

export interface BackupPayload {
  schema: number;
  app: 'vetor_furia';
  exportedAt: number;
  /** Map of localStorage key → already-parsed JSON value (or null if key missing). */
  data: Partial<Record<BackupKey, unknown>>;
}

/**
 * Builds the in-memory snapshot of all known keys.
 * Keys with malformed JSON are skipped (logged), not exported as broken.
 */
export function buildBackup(): BackupPayload {
  const data: Partial<Record<BackupKey, unknown>> = {};

  if (typeof window !== 'undefined') {
    for (const key of BACKUP_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try {
        data[key] = JSON.parse(raw);
      } catch {
        console.warn(`[backup] Skipping malformed JSON at "${key}"`);
      }
    }
  }

  return {
    schema: BACKUP_SCHEMA_VERSION,
    app: 'vetor_furia',
    exportedAt: Date.now(),
    data,
  };
}

/**
 * Triggers a browser download of the backup.
 * Filename: `vetor-furia-backup-YYYY-MM-DD.json`.
 */
export function downloadBackup(): void {
  const payload = buildBackup();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `vetor-furia-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  ok: boolean;
  restoredKeys: BackupKey[];
  unknownKeys: string[];
  error?: string;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validates and applies a backup file to localStorage.
 *
 * Strategy: write each known key atomically. If a key fails, we still try
 * the others (partial restore is better than nothing) and report which
 * succeeded. Unknown keys in the file are ignored but reported.
 *
 * Caller is expected to reload the page after a successful import so all
 * hooks re-hydrate from the new state.
 */
export function applyBackup(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      ok: false,
      restoredKeys: [],
      unknownKeys: [],
      error: `JSON inválido: ${(e as Error).message}`,
    };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, restoredKeys: [], unknownKeys: [], error: 'Estrutura inválida (não é um objeto).' };
  }

  if (parsed.app !== 'vetor_furia') {
    return {
      ok: false,
      restoredKeys: [],
      unknownKeys: [],
      error: 'Este arquivo não parece ser um backup do Vetor Fúria.',
    };
  }

  if (typeof parsed.schema !== 'number' || parsed.schema > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      restoredKeys: [],
      unknownKeys: [],
      error: `Versão de schema não suportada (${String(parsed.schema)}).`,
    };
  }

  const data = parsed.data;
  if (!isPlainObject(data)) {
    return { ok: false, restoredKeys: [], unknownKeys: [], error: 'Backup sem campo "data" válido.' };
  }

  const knownKeys = new Set<string>(BACKUP_KEYS);
  const restoredKeys: BackupKey[] = [];
  const unknownKeys: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (!knownKeys.has(key)) {
      unknownKeys.push(key);
      continue;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      restoredKeys.push(key as BackupKey);
    } catch (e) {
      console.error(`[backup] Failed to restore "${key}":`, e);
    }
  }

  return { ok: true, restoredKeys, unknownKeys };
}

/**
 * Wipes all backup-known keys from localStorage.
 * Exposed for the "reset all data" path if/when we add one. Not wired by default.
 */
export function clearAllAppData(): void {
  if (typeof window === 'undefined') return;
  for (const key of BACKUP_KEYS) {
    localStorage.removeItem(key);
  }
}
