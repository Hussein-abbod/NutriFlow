import { afterEach, describe, expect, it, vi } from 'vitest';
import { BarcodeScanError } from './types';
import { toBarcodeScanError, webBarcodeScanner } from './webBarcodeScanner';

const domError = (name: string) => Object.assign(new Error(name), { name });

describe('toBarcodeScanError', () => {
  it.each([
    ['NotAllowedError', 'permission-denied'],
    ['SecurityError', 'permission-denied'],
    ['NotFoundError', 'no-camera'],
    ['OverconstrainedError', 'no-camera'],
    ['NotReadableError', 'no-camera'],
    ['NotSupportedError', 'no-camera'],
    ['TypeError', 'unknown'],
  ])('maps %s to %s', (name, kind) => {
    expect(toBarcodeScanError(domError(name)).kind).toBe(kind);
  });

  it('keeps scan errors and handles non-errors', () => {
    const error = new BarcodeScanError('unsupported');
    expect(toBarcodeScanError(error)).toBe(error);
    expect(toBarcodeScanError('boom').kind).toBe('unknown');
  });
});

describe('webBarcodeScanner', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is unsupported without the camera API (e.g. a plain-HTTP page)', async () => {
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: undefined });
    await expect(
      webBarcodeScanner.start(document.createElement('video'), vi.fn()),
    ).rejects.toMatchObject({ kind: 'unsupported' });
  });
});
