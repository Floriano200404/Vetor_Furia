/**
 * Statement Import — parse OFX / CSV / PDF into ParsedTx rows.
 *
 * Reliability order: OFX (best) > CSV (good) > PDF (best-effort, text only).
 * Nothing is auto-saved — the UI shows a review screen first.
 */

import type { ParsedTx, StatementFormat, TxKind } from '../domain/finance.types';

// --- Auto categorization (keyword heuristics, pt-BR) ---

const KEYWORD_CATEGORY: Array<[RegExp, string]> = [
  [/ifood|rappi|restaurante|lanch|pizza|burger|padaria|mercado|supermerc|hortifruti|açai|acai/i, 'alimentacao'],
  [/uber|99|99app|cabify|posto|combust|gasolina|alcool|metro|metrô|onibus|ônibus|bilhete|estacion/i, 'transporte'],
  [/aluguel|condominio|condomínio|imobiliaria|imobiliária/i, 'moradia'],
  [/netflix|spotify|prime|disney|hbo|max|youtube|assinatura|claro|vivo|tim|oi |internet|energia|luz|agua|água|enel|sabesp/i, 'contas'],
  [/farmacia|farmácia|drogaria|droga raia|drogasil|academia|gym|smartfit|hospital|clinica|clínica|dentista|médic|medic|exame|laborat/i, 'saude'],
  [/curso|udemy|alura|faculdade|escola|livraria|livro|amazon kindle/i, 'educacao'],
  [/cinema|netshoes|steam|playstation|xbox|game|show|ingresso|bar |boteco|cervej/i, 'lazer'],
  [/shopping|loja|magazine|americanas|mercadolivre|mercado livre|shopee|aliexpress|renner|riachuelo|zara/i, 'compras'],
  [/salario|salário|pagamento|provento|holerite|folha/i, 'salario'],
  [/freela|freelance|projeto|consultoria/i, 'freela'],
  [/rendiment|dividendo|juros|cdb|tesouro|investiment|cashback/i, 'investimentos'],
];

export function guessCategory(description: string, kind: TxKind): string {
  for (const [re, cat] of KEYWORD_CATEGORY) {
    if (re.test(description)) {
      // Only return income categories for income, expense for expense.
      const isIncomeCat = ['salario', 'freela', 'investimentos', 'presente'].includes(cat);
      if (kind === 'receita' && isIncomeCat) return cat;
      if (kind === 'despesa' && !isIncomeCat) return cat;
    }
  }
  return kind === 'receita' ? 'outros_rec' : 'outros_desp';
}

// --- Dedupe hash ---

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 40);
}

export function computeHash(date: number, amount: number, description: string): string {
  const day = new Date(date).toISOString().slice(0, 10);
  return `${day}|${Math.round(amount * 100)}|${normalize(description)}`;
}

// --- Value / date helpers ---

/** Parse "1.234,56" or "1234.56" or "-99,90" → number. */
function parseAmount(raw: string): number | null {
  let s = raw.trim().replace(/[R$\s]/g, '');
  if (s === '') return null;
  const neg = /^-/.test(s) || /\(.*\)/.test(s);
  s = s.replace(/[()-]/g, '');
  // If both separators, the last one is the decimal separator.
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.')
      ? s.replace(/\./g, '').replace(',', '.')
      : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return neg ? -Math.abs(n) : n;
}

/** Parse common BR/ISO date strings → timestamp (noon, local). */
function parseDate(raw: string): number | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})/); // ISO / OFX YYYYMMDD
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], 12).getTime();
  m = s.match(/^(\d{2})[/\-.](\d{2})[/\-.](\d{2,4})/); // dd/mm/yyyy
  if (m) {
    const yr = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return new Date(yr, +m[2] - 1, +m[1], 12).getTime();
  }
  return null;
}

function makeRow(date: number, amount: number, description: string): ParsedTx {
  const kind: TxKind = amount >= 0 ? 'receita' : 'despesa';
  const abs = Math.abs(amount);
  return {
    rowId: `${date}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    amount: Math.round(abs * 100) / 100,
    date,
    description: description.trim() || '(sem descrição)',
    categoryId: guessCategory(description, kind),
    importHash: computeHash(date, abs, description),
    dup: false,
    include: true,
  };
}

// --- OFX ---

export function parseOFX(text: string): ParsedTx[] {
  const rows: ParsedTx[] = [];
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  for (const b of blocks) {
    const get = (tag: string) => {
      const m = b.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i'));
      return m ? m[1].trim() : '';
    };
    const dt = parseDate(get('DTPOSTED'));
    const amt = parseAmount(get('TRNAMT'));
    const desc = get('MEMO') || get('NAME') || get('TRNTYPE');
    if (dt !== null && amt !== null && amt !== 0) rows.push(makeRow(dt, amt, desc));
  }
  return rows;
}

// --- CSV ---

/** Split a CSV line respecting double-quoted fields ("a,b" stays one field). */
function splitCSVLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (c === sep && !q) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** lowercase + strip accents, for header matching. */
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const GENERIC_DESC = /^(debito de cartao|transf (enviada|recebida) pix|pix( em andamento)?|compra|pagamento|debito|credito)\s*$/i;

/**
 * Header-aware CSV parser. Finds the real header row (banks prepend account
 * info), maps columns by name, and handles separate Entrada/Saída columns
 * (C6, Inter…) as well as a single signed value column (Nubank…).
 * Falls back to a positional heuristic when no header is recognized.
 */
export function parseCSV(text: string): ParsedTx[] {
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r\n|\r|\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];

  // Locate the header line within the first ~15 rows.
  let hi = -1;
  let sep = ',';
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const L = norm(lines[i]);
    if (/data|dt/.test(L) && /(descri|histor|lancamento|memo|valor|entrada|saida|debito|credito)/.test(L)) {
      hi = i;
      sep = (lines[i].match(/;/g)?.length ?? 0) >= (lines[i].match(/,/g)?.length ?? 0) ? ';' : ',';
      break;
    }
  }

  if (hi >= 0) {
    const hdr = splitCSVLine(lines[hi], sep).map(norm);
    const find = (...keys: string[]) =>
      hdr.findIndex((h) => keys.some((k) => h.includes(k)));

    const iDate = find('data lancamento', 'data', 'dt');
    const iEntrada = find('entrada', 'credito', 'credit');
    const iSaida = find('saida', 'debito', 'debit');
    const iValor = find('valor', 'montante', 'amount');
    // Candidate text columns for the description (pick the most informative).
    const textIdx = hdr
      .map((h, idx) => ({ h, idx }))
      .filter(({ h }) => /(descri|histor|memo|lancamento|titulo|estabelec)/.test(h))
      .map(({ idx }) => idx);

    const rows: ParsedTx[] = [];
    for (let r = hi + 1; r < lines.length; r++) {
      const c = splitCSVLine(lines[r], sep);
      if (c.length < 2) continue;

      const date = iDate >= 0 ? parseDate(c[iDate] ?? '') : null;
      if (date === null) continue;

      let amount: number | null = null;
      if (iEntrada >= 0 && iSaida >= 0) {
        const e = parseAmount(c[iEntrada] ?? '') ?? 0;
        const s = parseAmount(c[iSaida] ?? '') ?? 0;
        amount = e - s;
      } else if (iValor >= 0) {
        amount = parseAmount(c[iValor] ?? '');
      }
      if (amount === null || amount === 0) continue;

      // Description = the longest non-generic text field (handles both
      // "DEBITO DE CARTAO | PAGUE MENOS" and "Pix p/ Fulano | TRANSF PIX").
      const candidates = (textIdx.length ? textIdx : c.map((_, i) => i))
        .map((i) => (c[i] ?? '').trim())
        .filter((v) => v && !GENERIC_DESC.test(v) && parseDate(v) === null && parseAmount(v) === null);
      const desc =
        candidates.sort((a, b) => b.length - a.length)[0] ??
        (c[textIdx[0]] ?? '').trim();

      rows.push(makeRow(date, amount, desc));
    }
    if (rows.length > 0) return rows;
  }

  // Fallback: positional heuristic (no recognizable header).
  const sep2 = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: ParsedTx[] = [];
  for (const line of lines) {
    const cols = splitCSVLine(line, sep2);
    if (cols.length < 2) continue;
    let date: number | null = null;
    let amount: number | null = null;
    const textCols: string[] = [];
    for (const col of cols) {
      if (date === null && parseDate(col) !== null) { date = parseDate(col); continue; }
      const a = parseAmount(col);
      if (amount === null && a !== null && /[,.\d]/.test(col) && /[,.-]/.test(col)) {
        amount = a;
        continue;
      }
      textCols.push(col);
    }
    if (date !== null && amount !== null && amount !== 0) {
      rows.push(makeRow(date, amount, textCols.join(' ').trim()));
    }
  }
  return rows;
}

// --- PDF (best-effort, text only) ---

export async function parsePDF(file: File): Promise<ParsedTx[]> {
  const pdfjs = await import('pdfjs-dist');
  // Worker resolved as an asset URL by the bundler.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  let fullText = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Group items into lines by their y position.
    const byLine = new Map<number, string[]>();
    for (const it of content.items) {
      // @ts-expect-error pdfjs TextItem shape
      const str: string = it.str ?? '';
      // @ts-expect-error pdfjs transform matrix
      const y = Math.round((it.transform?.[5] ?? 0));
      if (!byLine.has(y)) byLine.set(y, []);
      byLine.get(y)!.push(str);
    }
    const lines = Array.from(byLine.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) => parts.join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    fullText += lines.join('\n') + '\n';
  }

  const rows: ParsedTx[] = [];
  for (const line of fullText.split('\n')) {
    const dMatch = line.match(/(\d{2}[/\-.]\d{2}[/\-.]\d{2,4})|(\d{4}-\d{2}-\d{2})/);
    const aMatch = line.match(/-?\(?\s*R?\$?\s*\d{1,3}(?:[.\s]\d{3})*[,.]\d{2}\)?-?/);
    if (!dMatch || !aMatch) continue;
    const date = parseDate(dMatch[0]);
    const amount = parseAmount(aMatch[0]);
    if (date === null || amount === null || amount === 0) continue;
    const desc = line
      .replace(dMatch[0], '')
      .replace(aMatch[0], '')
      .replace(/\s+/g, ' ')
      .trim();
    rows.push(makeRow(date, amount, desc));
  }
  return rows;
}

// --- Dispatch + dedupe ---

export function detectFormat(file: File): StatementFormat | null {
  const n = file.name.toLowerCase();
  if (n.endsWith('.ofx')) return 'ofx';
  if (n.endsWith('.csv') || n.endsWith('.txt')) return 'csv';
  if (n.endsWith('.pdf')) return 'pdf';
  return null;
}

export async function parseStatement(
  file: File,
  format: StatementFormat,
): Promise<ParsedTx[]> {
  if (format === 'pdf') return parsePDF(file);
  const text = (await file.text()).replace(/^﻿/, '');
  return format === 'ofx' ? parseOFX(text) : parseCSV(text);
}

/**
 * Flag rows whose hash already exists (in storage OR earlier in the batch).
 * Duplicates default to NOT included.
 */
export function flagDuplicates(rows: ParsedTx[], existingHashes: Set<string>): ParsedTx[] {
  const seen = new Set(existingHashes);
  return rows.map((r) => {
    const dup = seen.has(r.importHash);
    seen.add(r.importHash);
    return { ...r, dup, include: !dup };
  });
}
