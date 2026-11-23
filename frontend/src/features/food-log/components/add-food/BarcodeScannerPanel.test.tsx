import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as BarcodeModule from '@/lib/platform/barcode';
import { BarcodeScanError, type BarcodeScanErrorKind } from '@/lib/platform/barcode';
import { buildFoodResult, TEST_API } from '@/test/fixtures';
import { renderWithQuery } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { BarcodeScannerPanel } from './BarcodeScannerPanel';

const scanner = vi.hoisted(() => ({ start: vi.fn() }));
vi.mock('@/lib/platform/barcode', async (importOriginal) => ({
  ...(await importOriginal<typeof BarcodeModule>()),
  barcodeScanner: scanner,
}));

const product = buildFoodResult({
  food_name: 'Grilled Chicken Strips',
  brand_name: 'E2E Foods',
  serving_size: 85,
  calories: 165,
});

let detect: (code: string) => void = () => undefined;
const stop = vi.fn();

function cameraWorks() {
  scanner.start.mockImplementation(async (_video: HTMLVideoElement, onDetected: typeof detect) => {
    detect = onDetected;
    return { stop };
  });
}

function cameraFails(kind: BarcodeScanErrorKind) {
  scanner.start.mockRejectedValue(new BarcodeScanError(kind));
}

function lookupReturns(byCode: Record<string, unknown> = { '012345678905': product }) {
  const codes: string[] = [];
  server.use(
    http.post(`${TEST_API}/food-log/barcode`, async ({ request }) => {
      const { barcode } = (await request.json()) as { barcode: string };
      codes.push(barcode);
      const food = byCode[barcode];
      return food
        ? HttpResponse.json(food)
        : HttpResponse.json({ detail: `No food found for barcode: ${barcode}` }, { status: 404 });
    }),
  );
  return codes;
}

function renderPanel() {
  const onConfirm = vi.fn();
  const view = renderWithQuery(<BarcodeScannerPanel onConfirm={onConfirm} />);
  return { ...view, onConfirm, user: userEvent.setup() };
}

describe('BarcodeScannerPanel', () => {
  beforeEach(() => {
    stop.mockClear();
    scanner.start.mockReset();
  });

  it('looks up a scanned barcode and lets the user adjust the amount', async () => {
    cameraWorks();
    const codes = lookupReturns();
    const { onConfirm, user } = renderPanel();

    expect(await screen.findByText('Point the camera at a barcode')).toBeInTheDocument();
    act(() => detect('012345678905'));
    act(() => detect('012345678905')); // a second read of the same frame is ignored

    const card = await screen.findByRole('region', { name: 'Grilled Chicken Strips' });
    expect(codes).toEqual(['012345678905']);
    expect(stop).toHaveBeenCalled(); // camera released while the result is shown
    expect(within(card).getByText('E2E Foods')).toBeInTheDocument();
    expect(within(card).getByText('85 g')).toBeInTheDocument();
    expect(within(card).getByText('140 kcal')).toBeInTheDocument();

    await user.click(within(card).getByRole('button', { name: 'More Grilled Chicken Strips' }));
    expect(within(card).getByText('95 g')).toBeInTheDocument();
    expect(within(card).getByText('157 kcal')).toBeInTheDocument();

    await user.click(within(card).getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ foodName: 'Grilled Chicken Strips', quantity: 95 }),
    );
  });

  it('ignores camera reads that are not retail barcodes', async () => {
    cameraWorks();
    const codes = lookupReturns();
    renderPanel();
    await screen.findByText('Point the camera at a barcode');
    act(() => detect('https://example.com'));
    expect(codes).toEqual([]);
  });

  it('explains an unknown barcode and scans again on Retry', async () => {
    cameraWorks();
    lookupReturns({});
    const { user } = renderPanel();
    await screen.findByText('Point the camera at a barcode');

    act(() => detect('4006381333931'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No food found for barcode: 4006381333931',
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(scanner.start).toHaveBeenCalledTimes(1); // the camera kept running
  });

  it('can rescan after a product was found', async () => {
    cameraWorks();
    lookupReturns();
    const { user } = renderPanel();
    await screen.findByText('Point the camera at a barcode');
    act(() => detect('012345678905'));

    await user.click(await screen.findByRole('button', { name: 'Rescan' }));
    expect(await screen.findByText('Point the camera at a barcode')).toBeInTheDocument();
    expect(scanner.start).toHaveBeenCalledTimes(2);
  });

  it('offers manual entry while the camera runs, with validation', async () => {
    cameraWorks();
    const codes = lookupReturns();
    const { user } = renderPanel();

    await user.click(await screen.findByRole('button', { name: 'Enter barcode manually' }));
    const field = screen.getByRole('textbox', { name: 'Barcode number' });
    await user.type(field, '12345');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(await screen.findByText('Enter the 8 to 14 digits under the barcode.')).toBeVisible();
    expect(codes).toEqual([]);

    await user.clear(field);
    await user.type(field, '0123 4567 8905');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(await screen.findByRole('region', { name: 'Grilled Chicken Strips' })).toBeVisible();
    expect(codes).toEqual(['012345678905']);
  });

  it.each([
    ['permission-denied', 'Camera access is blocked'],
    ['no-camera', 'No camera found'],
    ['unsupported', 'Camera not available'],
    ['unknown', "Couldn't start the camera"],
  ] as const)(
    'falls back to typing the barcode when the camera fails (%s)',
    async (kind, title) => {
      cameraFails(kind);
      const codes = lookupReturns();
      const { user } = renderPanel();

      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Enter barcode manually' }),
      ).not.toBeInTheDocument();
      await user.type(screen.getByRole('textbox', { name: 'Barcode number' }), '012345678905');
      await user.click(screen.getByRole('button', { name: 'Look up' }));
      expect(await screen.findByRole('region', { name: 'Grilled Chicken Strips' })).toBeVisible();
      expect(codes).toEqual(['012345678905']);
    },
  );

  it('can try the camera again after it was blocked', async () => {
    cameraFails('permission-denied');
    const { user } = renderPanel();
    await user.click(await screen.findByRole('button', { name: 'Try camera again' }));
    expect(scanner.start).toHaveBeenCalledTimes(2);
  });

  it('releases the camera when the screen closes', async () => {
    cameraWorks();
    const { unmount } = renderPanel();
    await screen.findByText('Point the camera at a barcode');
    unmount();
    expect(stop).toHaveBeenCalled();
  });
});
