import { Icon } from '@/components';
import { ErrorBanner } from '../ErrorBanner';
import styles from './PhotoSourcePicker.module.css';

export interface PhotoSourcePickerProps {
  error: string | null;
  onTakePhoto: () => void;
  onUpload: () => void;
}

/**
 * Flutter's "Select Image Source" dialog (Take Photo / Upload Image), shown on the photo
 * screen itself: browsers only open the camera or file picker straight from a tap.
 */
export function PhotoSourcePicker({ error, onTakePhoto, onUpload }: PhotoSourcePickerProps) {
  return (
    <section className={styles.picker} aria-labelledby="photo-source-title">
      <span className={styles.badge} aria-hidden="true">
        <Icon name="cameraAlt" size={32} />
      </span>
      <h2 id="photo-source-title" className={styles.title}>
        Select Image Source
      </h2>
      <p className={styles.text}>The AI finds each food in your photo and estimates the portion.</p>
      <div className={styles.sources}>
        <button type="button" className={styles.source} onClick={onTakePhoto}>
          <Icon name="cameraAlt" className={styles.cameraIcon} />
          Take Photo
        </button>
        <button type="button" className={styles.source} onClick={onUpload}>
          <Icon name="photoLibrary" className={styles.galleryIcon} />
          Upload Image
        </button>
      </div>
      {error && <ErrorBanner className={styles.error} message={error} />}
    </section>
  );
}
