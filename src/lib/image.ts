export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1600;

/** Valida tipo e tamanho; retorna mensagem de erro ou null. */
export function validateImage(file: { type: string; size: number }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato inválido. Use JPG, PNG, WEBP ou GIF.';
  }
  if (file.size > MAX_IMAGE_BYTES) return 'A imagem deve ter no máximo 5 MB.';
  return null;
}

/** Calcula dimensões mantendo a proporção dentro do limite máximo. */
export function fitWithin(width: number, height: number, max = MAX_DIMENSION) {
  if (width <= max && height <= max) return { width, height };
  const ratio = Math.min(max / width, max / height);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

/**
 * Reduz fotos grandes (ex.: câmera do celular) para no máximo 1600px em JPEG,
 * economizando armazenamento e banda. GIFs e imagens pequenas seguem intactos.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif' || file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
