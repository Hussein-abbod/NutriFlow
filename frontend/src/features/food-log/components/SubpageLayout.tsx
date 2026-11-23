import type { ReactNode } from 'react';
import { Icon } from '@/components';
import { cn } from '@/lib/utils/cn';
import { useGoBack } from '../hooks/useAddFoodFlow';
import styles from './SubpageLayout.module.css';

export interface SubpageLayoutProps {
  title: string;
  /** Where Back goes when there is no previous screen (deep link / reload). */
  fallback: string;
  /** `camera`: black screen with white app bar (barcode scanner). */
  tone?: 'default' | 'camera';
  children: ReactNode;
}

/** A Flutter Scaffold pushed over the tabs: centred AppBar title + back arrow, no bottom nav. */
export function SubpageLayout({ title, fallback, tone = 'default', children }: SubpageLayoutProps) {
  const goBack = useGoBack(fallback);
  return (
    <div className={cn(styles.screen, tone === 'camera' && styles.camera)}>
      <header className={styles.appBar}>
        <button type="button" className={styles.back} aria-label="Back" onClick={goBack}>
          <Icon name="arrowBack" />
        </button>
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.spacer} aria-hidden="true" />
      </header>
      <main className={styles.body}>{children}</main>
    </div>
  );
}
