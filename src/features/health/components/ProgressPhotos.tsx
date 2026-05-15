'use client';

/**
 * ProgressPhotos — upload + gallery + side-by-side compare of body photos.
 * All local; nothing leaves the device.
 */

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, GitCompare, Trash2, X } from 'lucide-react';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { useToast } from '@/shared/components/Toast';
import {
  addProgressPhoto,
  compressImage,
  deleteProgressPhoto,
  getProgressPhotos,
  type ProgressPhoto,
} from '../services/progress-photos.service';
import styles from './ProgressPhotos.module.css';

function fmt(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ProgressPhotos() {
  const fileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  const toast = useToast();
  const [photos, setPhotos] = useState<ProgressPhoto[]>(() =>
    typeof window === 'undefined' ? [] : getProgressPhotos(),
  );
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = () => setPhotos(getProgressPhotos());

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      const res = addProgressPhoto(dataUrl);
      if (!res.ok) {
        toast.error(res.error ?? 'Falha ao salvar.');
      } else {
        toast.success('Foto adicionada!');
        refresh();
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (p: ProgressPhoto) => {
    const ok = await confirm({
      title: 'Excluir foto?',
      message: `Foto de ${fmt(p.date)} será removida permanentemente.`,
      danger: true,
      confirmLabel: 'Excluir',
    });
    if (!ok) return;
    deleteProgressPhoto(p.id);
    setSelected((s) => s.filter((id) => id !== p.id));
    refresh();
  };

  const toggleSelect = (id: string) => {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 2) return [cur[1], id];
      return [...cur, id];
    });
  };

  const comparePair = selected
    .map((id) => photos.find((p) => p.id === id))
    .filter((p): p is ProgressPhoto => Boolean(p));

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Camera size={16} className={styles.headerIcon} />
          <div>
            <h3 className={styles.title}>Foto-progresso</h3>
            <p className={styles.subtitle}>Local e privado — nada sai do aparelho</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {photos.length >= 2 && (
            <button
              type="button"
              className={`${styles.compareBtn} ${compareMode ? styles.compareBtnActive : ''}`}
              onClick={() => {
                setCompareMode((v) => !v);
                setSelected([]);
              }}
            >
              <GitCompare size={14} /> Comparar
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <Camera size={14} /> {busy ? 'Salvando…' : 'Adicionar'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className={styles.fileInput}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </header>

      {compareMode && comparePair.length === 2 && (
        <motion.div
          className={styles.compareView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {comparePair
            .slice()
            .sort((a, b) => a.date - b.date)
            .map((p) => (
              <figure key={p.id} className={styles.compareItem}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.dataUrl} alt={`Progresso ${fmt(p.date)}`} />
                <figcaption>{fmt(p.date)}</figcaption>
              </figure>
            ))}
        </motion.div>
      )}

      {photos.length === 0 ? (
        <div className={styles.empty}>
          <Camera size={40} className={styles.emptyIcon} />
          <p>Nenhuma foto ainda. Tire uma mensalmente pra ver a transformação.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          <AnimatePresence>
            {photos.map((p) => {
              const isSelected = selected.includes(p.id);
              return (
                <motion.div
                  key={p.id}
                  className={`${styles.card} ${compareMode && isSelected ? styles.cardSelected : ''}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => compareMode && toggleSelect(p.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.dataUrl} alt={`Progresso ${fmt(p.date)}`} className={styles.thumb} />
                  <div className={styles.cardFooter}>
                    <span>{fmt(p.date)}</span>
                    {!compareMode && (
                      <button
                        type="button"
                        className={styles.delBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p);
                        }}
                        aria-label="Excluir foto"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {compareMode && isSelected && (
                    <span className={styles.selBadge}>
                      {selected.indexOf(p.id) + 1}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {compareMode && (
        <p className={styles.compareHint}>
          {comparePair.length < 2
            ? `Selecione ${2 - comparePair.length} foto(s) pra comparar`
            : 'Comparando — toque numa selecionada pra trocar'}
          {comparePair.length > 0 && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setSelected([])}
            >
              <X size={12} /> limpar
            </button>
          )}
        </p>
      )}
    </section>
  );
}
