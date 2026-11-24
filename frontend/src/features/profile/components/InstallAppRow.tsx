import { useState } from 'react';
import { Button, showSnackbar } from '@/components';
import { needsManualInstall, promptInstall, usePwaStore } from '@/lib/platform/pwa';
import { SettingRow } from './SettingRow';

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
    <SettingRow
      icon="fileDownload"
      label="Install the app"
      description={
        canPrompt
          ? 'Open NutriFlow from your home screen, full screen and faster.'
          : 'In Safari, tap Share, then “Add to Home Screen”.'
      }
    >
      {canPrompt && (
        <Button variant="outlined" onClick={() => void install()}>
          Install
        </Button>
      )}
    </SettingRow>
  );
}
