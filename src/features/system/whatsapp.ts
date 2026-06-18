/**
 * WhatsApp (CallMeBot) — notificações pessoais no WhatsApp.
 *
 * Usa o CallMeBot (grátis, pessoal): após o opt-in único, manda mensagens
 * pro seu próprio número via uma chamada HTTP simples.
 *
 * Como o endpoint não envia cabeçalhos CORS, usamos `fetch` com
 * `mode: 'no-cors'` — dispara a requisição (resposta opaca). Pra
 * notificações "dispare e esqueça" isso basta.
 *
 * Observação: isto envia quando o app está ABERTO. Lembretes agendados
 * (app fechado) exigem um cron externo chamando a mesma URL — ver README.
 */

const CONFIG_KEY = 'vetor_furia_whatsapp_config';

export interface WhatsAppConfig {
  phone: string;   // com código do país, ex.: +5511999999999
  apikey: string;  // fornecida pelo CallMeBot no opt-in
  enabled: boolean;
}

const EMPTY: WhatsAppConfig = { phone: '', apikey: '', enabled: false };

export function getWhatsAppConfig(): WhatsAppConfig {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function saveWhatsAppConfig(config: WhatsAppConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function isWhatsAppEnabled(): boolean {
  const c = getWhatsAppConfig();
  return c.enabled && !!c.phone && !!c.apikey;
}

/** Dispara uma mensagem no WhatsApp (fire-and-forget). */
export function sendWhatsApp(text: string): void {
  if (typeof window === 'undefined') return;
  const { phone, apikey, enabled } = getWhatsAppConfig();
  if (!enabled || !phone || !apikey) return;

  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(text)}` +
    `&apikey=${encodeURIComponent(apikey)}`;

  try {
    void fetch(url, { mode: 'no-cors' }).catch(() => {});
  } catch {
    // ignore — notificação é best-effort
  }
}

/** Envia um teste com a config informada (sem precisar salvar antes). */
export function sendWhatsAppTest(config: WhatsAppConfig): void {
  if (typeof window === 'undefined' || !config.phone || !config.apikey) return;
  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(config.phone)}` +
    `&text=${encodeURIComponent('⚔️ Vetor Fúria conectado! O Sistema agora te avisa por aqui.')}` +
    `&apikey=${encodeURIComponent(config.apikey)}`;
  try {
    void fetch(url, { mode: 'no-cors' }).catch(() => {});
  } catch {
    // ignore
  }
}
