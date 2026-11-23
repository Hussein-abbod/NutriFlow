import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImageRequestDto } from '@/types/api';
import { buildFoodResult, TEST_API } from '@/test/fixtures';
import { renderWithQuery } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { ImageCapturePanel } from './ImageCapturePanel';

const image = vi.hoisted(() => ({ compressImage: vi.fn(), blobToBase64: vi.fn() }));
vi.mock('@/lib/image/compressImage', () => image);

const chicken = buildFoodResult({
  food_name: 'Chicken breast, roasted',
  serving_size: 150,
  calories: 165,
});
const broccoli = buildFoodResult({ food_name: 'Broccoli, cooked', serving_size: 80, calories: 35 });

const photo = (type = 'image/jpeg', size = 2048) =>
  new File([new Uint8Array(size)], 'meal.jpg', { type });

function identifyReturns(response: () => Response | Promise<Response>) {
  const requests: ImageRequestDto[] = [];
  server.use(
    http.post(`${TEST_API}/food-log/image`, async ({ request }) => {
      requests.push((await request.json()) as ImageRequestDto);
      await delay(30);
      return response();
    }),
  );
  return requests;
}

function renderPanel() {
  const onReview = vi.fn();
  renderWithQuery(<ImageCapturePanel meal="dinner" onReview={onReview} />);
  return { onReview, user: userEvent.setup({ applyAccept: false }) };
}

async function pickPhoto(user: ReturnType<typeof userEvent.setup>, file = photo()) {
  await user.upload(screen.getByTestId('gallery-input'), file);
}

describe('ImageCapturePanel', () => {
  beforeEach(() => {
    image.compressImage.mockResolvedValue(new Blob(['small'], { type: 'image/jpeg' }));
    image.blobToBase64.mockResolvedValue('c21hbGw=');
  });

  it('offers the camera and the gallery', async () => {
    const { user } = renderPanel();
    expect(screen.getByRole('heading', { name: 'Select Image Source' })).toBeInTheDocument();
    const camera = screen.getByTestId('camera-input');
    expect(camera).toHaveAttribute('capture', 'environment');
    expect(camera).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');

    const click = vi.spyOn(camera, 'click');
    await user.click(screen.getByRole('button', { name: 'Take Photo' }));
    expect(click).toHaveBeenCalled();
  });

  it.each([
    [photo('image/gif'), 'Choose a JPEG, PNG or WebP image.'],
    [photo('image/jpeg', 20 * 1024 * 1024 + 1), 'This photo is too large (max 20 MB).'],
  ])('rejects files it cannot upload', async (file, message) => {
    const { user } = renderPanel();
    await pickPhoto(user, file);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByRole('img', { name: 'Your meal' })).not.toBeInTheDocument();
  });

  it('previews, compresses, uploads and lists the foods found', async () => {
    const requests = identifyReturns(() => HttpResponse.json([chicken, broccoli]));
    const { user, onReview } = renderPanel();

    await pickPhoto(user);
    expect(screen.getByRole('img', { name: 'Your meal' })).toHaveAttribute(
      'src',
      expect.stringMatching(/^blob:/),
    );

    await user.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(await screen.findByText('Analyzing with AI...')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Identified Foods' })).toBeInTheDocument();
    expect(image.compressImage).toHaveBeenCalledWith(expect.any(File), {
      maxDimension: 1024,
      quality: 0.8,
    });
    expect(requests).toEqual([{ image_base64: 'c21hbGw=', meal_type: 'dinner' }]);

    const chickenCard = screen.getByText('Chicken breast, roasted').closest('li') as HTMLElement;
    expect(within(chickenCard).getByText('248 kcal')).toBeInTheDocument();
    await user.click(
      within(chickenCard).getByRole('button', { name: 'Less Chicken breast, roasted' }),
    );
    expect(within(chickenCard).getByText('140 g')).toBeInTheDocument();
    expect(within(chickenCard).getByText('231 kcal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Broccoli, cooked' }));
    await user.click(screen.getByRole('button', { name: 'Review & Confirm' }));
    const [items] = onReview.mock.calls[0] as [{ foodName: string; quantity: number }[]];
    expect(items).toEqual([
      expect.objectContaining({ foodName: 'Chicken breast, roasted', quantity: 140 }),
    ]);
  });

  it('shows the analysis error and retries', async () => {
    let calls = 0;
    identifyReturns(() => {
      calls += 1;
      return calls === 1
        ? HttpResponse.json(
            { detail: 'Could not identify food items in the image.' },
            { status: 422 },
          )
        : HttpResponse.json([chicken]);
    });
    const { user } = renderPanel();
    await pickPhoto(user);
    await user.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not identify food items in the image.',
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'Identified Foods' })).toBeInTheDocument();
  });

  it('reports a photo that cannot be read on the device', async () => {
    const requests = identifyReturns(() => HttpResponse.json([chicken]));
    image.compressImage.mockRejectedValue(new Error('decode failed'));
    const { user } = renderPanel();
    await pickPhoto(user);
    await user.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't read this photo. Try another one.",
    );
    expect(requests).toEqual([]);
  });

  it('retakes with the same source', async () => {
    const { user } = renderPanel();
    await pickPhoto(user);
    const click = vi.spyOn(screen.getByTestId('gallery-input'), 'click');
    await user.click(screen.getByRole('button', { name: 'Retake' }));
    expect(click).toHaveBeenCalled();
  });
});
