import { useEffect } from 'react';
import { syncToGoogleSheets } from '@/lib/googleSheetsSync';

export const useGoogleSheetsSync = () => {
  useEffect(() => {
    const handleAutoSync = async () => {
      try {
        await syncToGoogleSheets(false);
        console.log('[Auto Sync] Google Sheets sync completed');
      } catch (error) {
        console.error('[Auto Sync] Failed:', error);
      }
    };

    // Sync on mount
    handleAutoSync();

    // Set up periodic sync every hour
    const intervalId = setInterval(handleAutoSync, 1000 * 60 * 60);

    return () => clearInterval(intervalId);
  }, []);
};
