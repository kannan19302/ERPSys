import { getPendingTransactions, markTransactionSynced, markSyncFailed } from './db';
import { apiPost } from '../api';

let syncInProgress = false;

export async function syncOfflineTransactions(): Promise<{ synced: number; failed: number }> {
  if (syncInProgress) return { synced: 0, failed: 0 };
  syncInProgress = true;

  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingTransactions();

    for (const txn of pending) {
      if (txn.syncAttempts >= 5) continue;

      try {
        const endpoint =
          txn.type === 'ORDER' ? '/pos/orders' :
          txn.type === 'PAYMENT' ? '/pos/payments' :
          '/pos/returns';

        await apiPost(endpoint, txn.data);
        await markTransactionSynced(txn.id);
        synced++;
      } catch (err: any) {
        await markSyncFailed(txn.id, err.message || 'Sync failed');
        failed++;
      }
    }
  } finally {
    syncInProgress = false;
  }

  return { synced, failed };
}

export function setupAutoSync(intervalMs = 30_000) {
  const trySync = async () => {
    if (navigator.onLine) {
      await syncOfflineTransactions();
    }
  };

  window.addEventListener('online', trySync);

  const interval = setInterval(trySync, intervalMs);

  return () => {
    window.removeEventListener('online', trySync);
    clearInterval(interval);
  };
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}
