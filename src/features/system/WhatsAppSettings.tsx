'use client';

/**
 * WhatsAppSettings — configuração das notificações no WhatsApp (CallMeBot).
 * O usuário faz o opt-in no CallMeBot, cola número + apikey e ativa.
 */

import { useState } from 'react';
import { MessageCircle, Send, Check } from 'lucide-react';
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  sendWhatsAppTest,
  type WhatsAppConfig,
} from './whatsapp';
import styles from './WhatsAppSettings.module.css';

export function WhatsAppSettings() {
  const [config, setConfig] = useState<WhatsAppConfig>(() => getWhatsAppConfig());
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<WhatsAppConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    saveWhatsAppConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = () => {
    saveWhatsAppConfig(config);
    sendWhatsAppTest(config);
  };

  const canTest = !!config.phone && !!config.apikey;

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <MessageCircle size={18} className={styles.headIcon} />
        <h3 className={styles.title}>Notificações no WhatsApp</h3>
      </header>

      <ol className={styles.steps}>
        <li>
          No WhatsApp, mande <strong>&quot;I allow callmebot to send me messages&quot;</strong> para
          o número <strong>+34 644 51 95 23</strong>.
        </li>
        <li>
          O bot responde com a sua <strong>apikey</strong>. Cole ela abaixo, junto do seu número.
        </li>
      </ol>

      <label className={styles.field}>
        <span>Seu número (com código do país)</span>
        <input
          value={config.phone}
          onChange={(e) => update({ phone: e.target.value })}
          placeholder="+5511999999999"
          inputMode="tel"
        />
      </label>

      <label className={styles.field}>
        <span>API key (CallMeBot)</span>
        <input
          value={config.apikey}
          onChange={(e) => update({ apikey: e.target.value })}
          placeholder="123456"
        />
      </label>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
        />
        <span>Ativar notificações (quest concluída e penalidade)</span>
      </label>

      <div className={styles.actions}>
        <button className={styles.save} onClick={handleSave}>
          {saved ? (
            <>
              <Check size={14} /> Salvo
            </>
          ) : (
            'Salvar'
          )}
        </button>
        <button className={styles.test} onClick={handleTest} disabled={!canTest}>
          <Send size={14} /> Enviar teste
        </button>
      </div>

      <p className={styles.note}>
        As notificações são enviadas com o app aberto. Para o lembrete diário com o app fechado,
        é preciso um agendador externo (cron) — veja o README.
      </p>
    </section>
  );
}
