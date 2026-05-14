'use client';

/**
 * DataBackupSection — UI for exporting/importing app data as JSON.
 *
 * Lives in shared/ because it's not feature-specific — it operates on the
 * full localStorage snapshot via the backup service.
 */

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, ShieldCheck, AlertCircle } from 'lucide-react';
import { useConfirm } from './ConfirmDialog';
import { useToast } from './Toast';
import {
  applyBackup,
  downloadBackup,
  type ImportResult,
} from '@/lib/backup/backup.service';
import styles from './DataBackupSection.module.css';

export function DataBackupSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  const toast = useToast();
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);

  const handleExport = () => {
    try {
      downloadBackup();
      toast.success('Backup baixado.');
    } catch (e) {
      toast.error(`Falha ao exportar: ${(e as Error).message}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be picked again later.
    e.target.value = '';
    if (!file) return;

    const ok = await confirm({
      title: 'Importar backup?',
      message:
        'Os dados atuais serão SUBSTITUÍDOS pelos dados do arquivo. Esta ação não pode ser desfeita. Exporte o estado atual antes se quiser preservá-lo.',
      danger: true,
      confirmLabel: 'Substituir tudo',
    });
    if (!ok) return;

    let text: string;
    try {
      text = await file.text();
    } catch (err) {
      toast.error(`Não consegui ler o arquivo: ${(err as Error).message}`);
      return;
    }

    const result = applyBackup(text);
    setLastImport(result);

    if (!result.ok) {
      toast.error(result.error ?? 'Falha ao importar.');
      return;
    }

    toast.success(
      `Backup restaurado (${result.restoredKeys.length} chaves). Recarregando…`,
    );
    // Force a reload so every hook re-reads localStorage. Without this, in-memory
    // state would mask the new data until the user navigates.
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <motion.section className={styles.wrapper}>
      <header className={styles.header}>
        <ShieldCheck size={18} className={styles.headerIcon} />
        <div>
          <h3 className={styles.title}>Dados</h3>
          <p className={styles.subtitle}>
            Exporte um backup completo do seu progresso ou restaure a partir de
            um arquivo `.json`.
          </p>
        </div>
      </header>

      <div className={styles.actions}>
        <button
          type="button"
          className={`btn btn-primary ${styles.btn}`}
          onClick={handleExport}
        >
          <Download size={16} /> Exportar backup
        </button>
        <button
          type="button"
          className={`btn btn-secondary ${styles.btn}`}
          onClick={handleImportClick}
        >
          <Upload size={16} /> Importar backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChosen}
          className={styles.fileInput}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {lastImport && lastImport.ok && lastImport.unknownKeys.length > 0 && (
        <div className={styles.warning}>
          <AlertCircle size={14} />
          <span>
            Backup importado, mas {lastImport.unknownKeys.length} chave(s)
            desconhecida(s) foram ignoradas:{' '}
            <code>{lastImport.unknownKeys.join(', ')}</code>
          </span>
        </div>
      )}

      <p className={styles.hint}>
        💡 Faça backup periódico. Limpar o cache do navegador apaga seu
        progresso local — o backup é a única proteção garantida.
      </p>
    </motion.section>
  );
}
