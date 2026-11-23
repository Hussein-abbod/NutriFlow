import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/api';
import { blobToBase64, compressImage } from '@/lib/image/compressImage';
import type { MealType } from '@/types/api';
import { useIdentifyImage } from '../api/useFoodLogQueries';
import { withPortion, type FoodItem } from '../model/foodItem';
import { imageFileSchema } from '../schemas/foodLogSchemas';
import { IMAGE_LIMITS } from '../schemas/limits';

/** `preparing`: resizing + encoding on the device; `analyzing`: waiting for the AI. */
export type CaptureStage = 'idle' | 'preparing' | 'analyzing';

interface Photo {
  file: File;
  previewUrl: string;
}

const UNREADABLE_PHOTO = "We couldn't read this photo. Try another one.";

/** CameraFoodScreen state: the chosen photo, its upload and the foods the AI found. */
export function useImageCapture(meal: MealType) {
  const identify = useIdentifyImage();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);

  // Free the preview's memory when the photo changes or the screen closes.
  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  /** A file from the camera / gallery input (undefined when the picker was cancelled). */
  const selectFile = (file: File | undefined) => {
    if (!file) return;
    const checked = imageFileSchema.safeParse(file);
    if (!checked.success) {
      setFileError(checked.error.issues[0]?.message ?? UNREADABLE_PHOTO);
      return;
    }
    setFileError(null);
    identify.reset();
    setItems([]);
    setPhoto({ file, previewUrl: URL.createObjectURL(file) });
  };

  const analyze = async () => {
    if (!photo || preparing || identify.isPending) return;
    setFileError(null);
    identify.reset();
    setPreparing(true);
    let imageBase64: string;
    try {
      const compressed = await compressImage(photo.file, {
        maxDimension: IMAGE_LIMITS.maxDimension,
        quality: IMAGE_LIMITS.jpegQuality,
      });
      if (compressed.size > IMAGE_LIMITS.maxUploadBytes) throw new Error('Image too large');
      imageBase64 = await blobToBase64(compressed);
    } catch {
      setFileError(UNREADABLE_PHOTO);
      return;
    } finally {
      setPreparing(false);
    }
    identify.mutate({ imageBase64, meal }, { onSuccess: setItems });
  };

  const stage: CaptureStage = preparing ? 'preparing' : identify.isPending ? 'analyzing' : 'idle';

  return {
    photo,
    stage,
    items,
    fileError,
    analyzeError: identify.isError ? getErrorMessage(identify.error) : null,
    selectFile,
    analyze,
    updateQuantity: (key: string, quantity: number) =>
      setItems((current) =>
        current.map((item) => (item.key === key ? withPortion(item, quantity) : item)),
      ),
    removeItem: (key: string) => setItems((current) => current.filter((item) => item.key !== key)),
  };
}
