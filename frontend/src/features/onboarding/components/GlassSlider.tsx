import { forwardRef, type CSSProperties, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './GlassSlider.module.css';

export interface GlassSliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'min' | 'max'
> {
  value: number;
  min: number;
  max: number;
}

/** White Material slider on gradients (SliderThemeData: white track, 20% inactive, height 6). */
export const GlassSlider = forwardRef<HTMLInputElement, GlassSliderProps>(function GlassSlider(
  { value, min, max, className, ...inputProps },
  ref,
) {
  const filled = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      ref={ref}
      type="range"
      className={cn(styles.slider, className)}
      min={min}
      max={max}
      value={value}
      style={{ '--slider-fill': `${filled}%` } as CSSProperties}
      {...inputProps}
    />
  );
});
