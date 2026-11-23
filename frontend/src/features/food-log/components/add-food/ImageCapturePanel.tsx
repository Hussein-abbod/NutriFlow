import { useRef, type ChangeEvent } from 'react';
import { Button, Icon } from '@/components';
import type { MealType } from '@/types/api';
import { useImageCapture } from '../../hooks/useImageCapture';
import type { FoodItem } from '../../model/foodItem';
import { IMAGE_LIMITS } from '../../schemas/limits';
import { ErrorBanner } from '../ErrorBanner';
import { AnalyzingOverlay } from './AnalyzingOverlay';
import { IdentifiedFoodsList } from './IdentifiedFoodsList';
import { PhotoSourcePicker } from './PhotoSourcePicker';
import styles from './ImageCapturePanel.module.css';

const ACCEPT = IMAGE_LIMITS.acceptedTypes.join(',');

export interface ImageCapturePanelProps {
  meal: MealType;
  onReview: (items: FoodItem[]) => void;
}

/** add_food_sheet.dart `CameraFoodScreen`: pick a photo, preview, analyze, adjust portions. */
export function ImageCapturePanel({ meal, onReview }: ImageCapturePanelProps) {
  const capture = useImageCapture(meal);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const lastInput = useRef<HTMLInputElement | null>(null);

  const open = (input: HTMLInputElement | null) => {
    lastInput.current = input;
    input?.click();
  };
  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    capture.selectFile(event.target.files?.[0]);
    event.target.value = ''; // so the same photo can be picked again
  };
  const busy = capture.stage !== 'idle';

  return (
    <div className={styles.panel}>
      {/* `capture` opens the rear camera on phones; desktops fall back to a file picker. */}
      <input
        ref={cameraInput}
        type="file"
        accept={ACCEPT}
        capture="environment"
        hidden
        data-testid="camera-input"
        onChange={onFileChosen}
      />
      <input
        ref={galleryInput}
        type="file"
        accept={ACCEPT}
        hidden
        data-testid="gallery-input"
        onChange={onFileChosen}
      />

      {!capture.photo && (
        <PhotoSourcePicker
          error={capture.fileError}
          onTakePhoto={() => open(cameraInput.current)}
          onUpload={() => open(galleryInput.current)}
        />
      )}

      {capture.photo && capture.items.length === 0 && (
        <>
          <div className={styles.preview}>
            <img src={capture.photo.previewUrl} alt="Your meal" className={styles.image} />
            {capture.stage !== 'idle' && <AnalyzingOverlay stage={capture.stage} />}
          </div>
          {!busy && (capture.fileError ?? capture.analyzeError) && (
            <ErrorBanner
              message={capture.fileError ?? capture.analyzeError ?? ''}
              onRetry={capture.analyzeError ? () => void capture.analyze() : undefined}
            />
          )}
          {!busy && (
            <div className={styles.actions}>
              <Button
                variant="outlined"
                leadingIcon={<Icon name="refresh" size={20} />}
                onClick={() => open(lastInput.current ?? galleryInput.current)}
              >
                Retake
              </Button>
              <Button
                variant="gradient"
                leadingIcon={<Icon name="autoAwesome" size={20} />}
                onClick={() => void capture.analyze()}
              >
                Analyze
              </Button>
            </div>
          )}
        </>
      )}

      {capture.items.length > 0 && (
        <>
          <h2 className={styles.heading}>Identified Foods</h2>
          <IdentifiedFoodsList
            items={capture.items}
            onQuantityChange={capture.updateQuantity}
            onRemove={capture.removeItem}
            onReview={() => onReview(capture.items)}
          />
        </>
      )}
    </div>
  );
}
