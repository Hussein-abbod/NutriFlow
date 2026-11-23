export interface CompressOptions {
  /** Longest side of the result in px (smaller images are not enlarged). */
  maxDimension: number;
  /** JPEG quality 0–1. */
  quality: number;
}

/**
 * Re-encode a photo as a JPEG no larger than `maxDimension` on its longest side
 * (Flutter `pickImage(maxWidth: 1024, imageQuality: 80)`). Re-encoding also drops the
 * photo's metadata (EXIF, including GPS location) before it leaves the device.
 */
export async function compressImage(file: Blob, options: CompressOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, options.maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available.');
    // JPEG has no transparency: paint PNG/WebP see-through areas white, not black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
        'image/jpeg',
        options.quality,
      );
    });
  } finally {
    bitmap.close();
  }
}

/** Base64 of a blob, without the `data:…;base64,` prefix. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the image.'));
    reader.readAsDataURL(blob);
  });
}
