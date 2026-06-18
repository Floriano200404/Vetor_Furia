/**
 * Cloud Sync — sincroniza os dados locais (localStorage) com o Firestore,
 * por usuário, para o progresso seguir entre dispositivos.
 *
 * Modelo: o localStorage é a cópia de trabalho (leitura rápida e síncrona);
 * o Firestore é o backup por usuário em `users/{uid}/app_state/{chave}`.
 *
 * - pullFromCloud: ao logar, traz os dados da nuvem pro localStorage.
 * - startCloudAutoSync: passa a salvar as mudanças do localStorage na nuvem
 *   (debounced) — sem precisar alterar cada serviço do app.
 *
 * Valores muito grandes (ex.: fotos em base64) não sobem — ficam só no
 * dispositivo, respeitando o limite de ~1MB por documento do Firestore.
 */

import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const APP_PREFIX = 'vetor_furia_';
const ACTIVE_UID_KEY = 'vetor_furia_active_uid';
const MAX_VALUE_BYTES = 900_000;
const PUSH_DEBOUNCE_MS = 2500;

// setItem nativo, capturado antes de qualquer monkeypatch, para o pull
// gravar sem disparar um novo push.
const nativeSetItem: (key: string, value: string) => void =
  typeof window !== 'undefined'
    ? localStorage.setItem.bind(localStorage)
    : () => {};

function appStateCollection(userId: string) {
  return collection(db!, 'users', userId, 'app_state');
}

function isSyncableKey(key: string | null): key is string {
  return !!key && key.startsWith(APP_PREFIX) && key !== ACTIVE_UID_KEY;
}

/** Traz os dados do usuário da nuvem para o localStorage. */
export async function pullFromCloud(userId: string): Promise<void> {
  if (!db || typeof window === 'undefined' || !userId) return;
  try {
    const snapshot = await getDocs(appStateCollection(userId));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as { key?: string; value?: string };
      if (data.key && typeof data.value === 'string') {
        nativeSetItem(data.key, data.value);
      }
    });
  } catch (error) {
    console.warn('[cloud-sync] pull falhou (seguindo com dados locais):', error);
  }
}

/** Salva o estado atual do localStorage na nuvem. */
export async function pushToCloud(userId: string): Promise<void> {
  if (!db || typeof window === 'undefined' || !userId) return;
  try {
    const batch = writeBatch(db);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!isSyncableKey(key)) continue;
      const value = localStorage.getItem(key);
      if (value == null || value.length > MAX_VALUE_BYTES) continue;
      batch.set(doc(appStateCollection(userId), key), { key, value });
    }
    await batch.commit();
  } catch (error) {
    console.warn('[cloud-sync] push falhou:', error);
  }
}

// --- Auto-sync: empurra mudanças do localStorage pra nuvem (debounced) ---

let activeUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let patched = false;

function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    if (activeUserId) void pushToCloud(activeUserId);
  }, PUSH_DEBOUNCE_MS);
}

/** Começa a sincronizar automaticamente as mudanças do usuário pra nuvem. */
export function startCloudAutoSync(userId: string): void {
  if (typeof window === 'undefined' || !db) return;
  activeUserId = userId;
  if (patched) return;
  patched = true;

  // Intercepta as gravações do app pra agendar o envio à nuvem.
  localStorage.setItem = (key: string, value: string) => {
    nativeSetItem(key, value);
    if (isSyncableKey(key)) schedulePush();
  };

  // Garante o envio ao ocultar/fechar a aba.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && activeUserId) {
      void pushToCloud(activeUserId);
    }
  });
}

/** Para a sincronização (no logout). */
export function stopCloudAutoSync(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  activeUserId = null;
}
