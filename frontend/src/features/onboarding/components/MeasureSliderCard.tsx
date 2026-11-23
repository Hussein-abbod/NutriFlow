import type { ChangeEvent, Ref } from 'react';
import { GlassCard } from '@/components';
import { parseNumber } from '@/lib/forms/numberField';
import { GlassSlider } from './GlassSlider';
import { MeasureField } from './MeasureField';
import styles from './OnboardingCard.module.css';

export interface MeasureSliderCardProps {
  id: string;
  name: string;
  label: string;
  unit: string;
  sliderRange: { min: number; max: number };
  /** Raw text of the field; the slider follows it while it is inside the slider range. */
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputRef: Ref<HTMLInputElement>;
  error?: string;
}

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(max, Math.max(min, value));

/** Height / weight card of step_basic_info.dart: value readout, slider and exact text input. */
export function MeasureSliderCard({
  id,
  name,
  label,
  unit,
  sliderRange,
  value,
  onChange,
  onBlur,
  inputRef,
  error,
}: MeasureSliderCardProps) {
  const parsed = parseNumber(value);
  const isNumber = Number.isFinite(parsed);
  const sliderValue = clamp(isNumber ? parsed : sliderRange.min, sliderRange);

  const onSlide = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(Number(event.target.value).toFixed(1));

  return (
    <GlassCard padding={20} opacity={0.1} blurAmount={12} tone="onGradient">
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <span className={styles.readout} aria-hidden="true">
          {isNumber ? `${parsed.toFixed(1)} ${unit}` : `– ${unit}`}
        </span>
      </div>
      <GlassSlider
        className={styles.slider}
        min={sliderRange.min}
        max={sliderRange.max}
        step={0.1}
        value={sliderValue}
        onChange={onSlide}
        onBlur={onBlur}
        aria-label={`${label} slider`}
        aria-valuetext={`${sliderValue.toFixed(1)} ${unit}`}
      />
      <MeasureField
        ref={inputRef}
        id={id}
        name={name}
        suffix={unit}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        error={error}
      />
    </GlassCard>
  );
}
