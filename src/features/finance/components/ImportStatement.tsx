'use client';

/**
 * ImportStatement — modal to import a bank statement (OFX/CSV/PDF) with a
 * mandatory review step. Nothing is saved until the user confirms.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileUp, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/shared/components/Toast';
import { categoriesFor } from '../domain/categories';
import { formatBRL, type ParsedTx } from '../domain/finance.types';
import {
  detectFormat,
  parseStatement,
  flagDuplicates,
} from '../services/import.service';
import type { ImportedRow } from '../services/finance.service';
import styles from './ImportStatement.module.css';

interface ImportStatementProps {
  existingHashes: Set<string>;
  onImport: (rows: ImportedRow[], source: string) => number;
  onClose: () => void;
}

type Phase = 'upload' | 'parsing' | 'review';

export function ImportStatement({ existingHashes, onImport, onClose }: ImportStatementProps) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>('upload');
  const [rows, setRows] = useState<ParsedTx[]>([]);
  const [bank, setBank] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const fmt = detectFormat(file);
    if (!fmt) {
      toast.error('Formato não suportado. Use OFX, CSV ou PDF.');
      return;
    }
    setFileName(file.name);
    setPhase('parsing');
    try {
      const parsed = await parseStatement(file, fmt);
      if (parsed.length === 0) {
        toast.error(
          fmt === 'pdf'
            ? 'Nenhuma transação lida. O PDF pode ser uma imagem (escaneado) — tente OFX/CSV.'
            : 'Nenhuma transação reconhecida no arquivo.',
        );
        setPhase('upload');
        return;
      }
      setRows(flagDuplicates(parsed, existingHashes));
      setPhase('review');
    } catch (err) {
      toast.error(`Falha ao ler o arquivo: ${(err as Error).message}`);
      setPhase('upload');
    }
  };

  const patch = (rowId: string, p: Partial<ParsedTx>) =>
    setRows((rs) => rs.map((r) => (r.rowId === rowId ? { ...r, ...p } : r)));

  const selected = rows.filter((r) => r.include);
  const selectedTotal = selected.reduce(
    (acc, r) => acc + (r.kind === 'receita' ? r.amount : -r.amount),
    0,
  );

  const confirm = () => {
    if (selected.length === 0) return;
    const payload: ImportedRow[] = selected.map((r) => ({
      kind: r.kind,
      amount: r.amount,
      categoryId: r.categoryId,
      description: r.description,
      date: r.date,
      importHash: r.importHash,
    }));
    const n = onImport(payload, bank);
    toast.success(`${n} transação(ões) importada(s)${bank ? ` de ${bank}` : ''}`);
    onClose();
  };

  return (
    <motion.div
      className={styles.backdrop}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <header className={styles.header}>
          <h3><FileUp size={18} /> Importar extrato</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        {phase === 'upload' && (
          <div className={styles.uploadBody}>
            <label className={styles.dropzone}>
              <Upload size={28} />
              <span className={styles.dzTitle}>Escolher arquivo</span>
              <span className={styles.dzHint}>
                OFX ou CSV (recomendado) · PDF com texto (best-effort)
              </span>
              <input
                type="file"
                accept=".ofx,.csv,.txt,.pdf"
                onChange={handleFile}
                className={styles.fileInput}
              />
            </label>
            <p className={styles.tip}>
              💡 No app do banco procure por &ldquo;exportar extrato&rdquo; →
              OFX ou CSV. PDF só funciona se o texto for selecionável (não
              escaneado).
            </p>
          </div>
        )}

        {phase === 'parsing' && (
          <div className={styles.parsing}>
            <Loader2 size={28} className={styles.spin} />
            <span>Lendo {fileName}…</span>
          </div>
        )}

        {phase === 'review' && (
          <>
            <div className={styles.reviewTop}>
              <label className={styles.bankField}>
                <span>Banco / origem</span>
                <input
                  placeholder="Ex: Nubank"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  autoFocus
                />
              </label>
              <div className={styles.reviewSummary}>
                <strong>{selected.length}</strong> de {rows.length} selecionadas
                <span className={selectedTotal >= 0 ? styles.pos : styles.neg}>
                  {' '}({formatBRL(selectedTotal)})
                </span>
              </div>
            </div>

            <div className={styles.rows}>
              {rows.map((r) => {
                const cats = categoriesFor(r.kind);
                return (
                  <div
                    key={r.rowId}
                    className={`${styles.row} ${!r.include ? styles.rowOff : ''} ${r.dup ? styles.rowDup : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={r.include}
                      onChange={(e) => patch(r.rowId, { include: e.target.checked })}
                      aria-label="Incluir transação"
                    />
                    <span className={styles.rowDate}>
                      {new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <input
                      className={styles.rowDesc}
                      value={r.description}
                      onChange={(e) => patch(r.rowId, { description: e.target.value })}
                    />
                    <select
                      className={styles.rowCat}
                      value={r.categoryId}
                      onChange={(e) => patch(r.rowId, { categoryId: e.target.value })}
                    >
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                      ))}
                    </select>
                    <span
                      className={`${styles.rowAmount} ${r.kind === 'receita' ? styles.pos : styles.neg}`}
                    >
                      {r.kind === 'receita' ? '+' : '−'} {formatBRL(r.amount)}
                    </span>
                    {r.dup && <span className={styles.dupTag} title="Já existe">dup</span>}
                  </div>
                );
              })}
            </div>

            <footer className={styles.footer}>
              <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button
                className="btn btn-success"
                onClick={confirm}
                disabled={selected.length === 0}
              >
                Importar {selected.length} transação(ões)
              </button>
            </footer>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
