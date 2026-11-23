import { afterEach, describe, expect, it, vi } from 'vitest';
import { blobToBase64, compressImage } from './compressImage';

describe('blobToBase64', () => {
  it('returns the base64 payload without the data URL prefix', async () => {
    const blob = new Blob(['hello'], { type: 'image/jpeg' });
    expect(await blobToBase64(blob)).toBe(btoa('hello'));
  });
});

describe('compressImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubCanvas() {
    const drawImage = vi.fn();
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 4000, height: 3000, close })),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(),
      drawImage,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D);
    const encoded: string[] = [];
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
    ) {
      encoded.push(`${this.width}x${this.height}`);
      callback(new Blob(['jpeg'], { type: 'image/jpeg' }));
    });
    return { drawImage, close, toBlob, encoded };
  }

  it('scales the longest side down to the limit and re-encodes as JPEG', async () => {
    const { drawImage, close, toBlob, encoded } = stubCanvas();
    const result = await compressImage(new Blob(['raw']), { maxDimension: 1024, quality: 0.8 });

    expect(result.type).toBe('image/jpeg');
    expect(encoded).toEqual(['1024x768']);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 768);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8);
    expect(close).toHaveBeenCalled();
  });

  it('fails cleanly when the image cannot be encoded', async () => {
    const { toBlob } = stubCanvas();
    toBlob.mockImplementation((callback) => callback(null));
    await expect(
      compressImage(new Blob(['raw']), { maxDimension: 1024, quality: 0.8 }),
    ).rejects.toThrow('Could not encode the image.');
  });
});
