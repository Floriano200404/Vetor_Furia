/**
 * Progress Photos — monthly body photos stored LOCALLY as compressed data
 * URLs. Never uploaded anywhere (privacy by design).
 *
 * localStorage has a ~5MB quota; we downscale to max 720px and JPEG q0.6
 * (~50-120KB each) so a couple dozen photos still fit. We surface a clear
 * error if the quota is exceeded rather than silently losing data.
 */

export interface ProgressPhoto {
  id: string;
  date: number;
  dataUrl: string;
  note?: string;
}

const STORAGE_KEY = 'vetor_furia_progress_photos';
const MAX_DIMENSION = 720;
const JPEG_QUALITY = 0.6;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getProgressPhotos(): ProgressPhoto[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressPhoto[]).sort((a, b) => b.date - a.date) : [];
  } catch {
    return [];
  }
}

/**
 * Downscale + compress an image File into a JPEG data URL.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas não suportado.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface SavePhotoResult {
  ok: boolean;
  photo?: ProgressPhoto;
  error?: string;
}

export function addProgressPhoto(dataUrl: string, note?: string): SavePhotoResult {
  const photos = getProgressPhotos();
  const photo: ProgressPhoto = {
    id: generateId(),
    date: Date.now(),
    dataUrl,
    note: note?.trim() || undefined,
  };
  const next = [photo, ...photos];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { ok: true, photo };
  } catch {
    return {
      ok: false,
      error:
        'Armazenamento cheio. Exclua fotos antigas ou faça um backup antes de continuar.',
    };
  }
}

export function deleteProgressPhoto(id: string): void {
  const next = getProgressPhotos().filter((p) => p.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}
