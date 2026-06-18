/**
 * User Scope — isola os dados locais por conta.
 *
 * Todo o app guarda dados no localStorage com o prefixo `vetor_furia_`.
 * Como essas chaves eram globais, qualquer conta lia os dados de qualquer
 * outra no mesmo navegador (conta nova já aparecia com nível 6, etc.).
 *
 * Este "porteiro" guarda qual conta é a dona dos dados atuais. Quando uma
 * conta diferente loga, ele limpa a gaveta antes do app abrir — então a
 * conta nova começa do zero e cada conta vê só os próprios dados.
 *
 * Observação: ao trocar de conta, os dados locais da anterior são apagados.
 * A sincronização com a nuvem (próximo passo) é quem traz os dados de volta
 * ao logar de novo, inclusive em outro dispositivo.
 */

const ACTIVE_UID_KEY = 'vetor_furia_active_uid';
const APP_PREFIX = 'vetor_furia_';

/**
 * Garante que o localStorage pertence ao usuário informado.
 * Se a conta mudou (ou é o primeiro login), limpa os dados do app.
 */
export function ensureUserScope(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;

  const active = localStorage.getItem(ACTIVE_UID_KEY);
  if (active === userId) return; // mesma conta — mantém os dados

  // Conta diferente (ou primeira vez): limpa todas as chaves do app.
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(APP_PREFIX) && key !== ACTIVE_UID_KEY) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  localStorage.setItem(ACTIVE_UID_KEY, userId);
}
