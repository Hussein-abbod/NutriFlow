import { iconPaths, type IconName } from './icons';

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Accessible label. Omit for decorative icons (hidden from screen readers). */
  label?: string;
}

export function Icon({ name, size = 24, className, label }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}
