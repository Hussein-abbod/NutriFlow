import { useState } from 'react';
import { Button, Icon, showSnackbar } from '@/components';
import { needsManualInstall, promptInstall, usePwaStore } from '@/lib/platform/pwa';
import styles from './InstallAppRow.module.css';

/**
 * Install NutriFlow on the home screen: the browser's own dialog where it offers one
 * (Chrome, Edge, Android), instructions on iPhone / iPad, nothing once installed.
 */
export function InstallAppRow() {
  const canPrompt = usePwaStore((state) => state.installPrompt !== null);
  const [manual] = useState(needsManualInstall);
  if (!canPrompt && !manual) return null;

  const install = async () => {
    if (await promptInstall()) showSnackbar('NutriFlow was added to your home screen');
  };

  return (
    <div className={styles.row}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name="fileDownload" size={20} />
      </span>
      <div className={styles.text}>
        <p className={styles.label}>Install the app</p>
        <p className={styles.description}>
          {canPrompt
            ? 'Open NutriFlow from your home screen, full screen and faster.'
            : 'In Safari, tap Share, then “Add to Home Screen”.'}
        </p>
      </div>
      {canPrompt && (
        <Button variant="outlined" onClick={() => void install()}>
          Install
        </Button>
      )}
    </div>
  );
}
