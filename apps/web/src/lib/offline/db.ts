const DB_NAME = 'unerp-pos-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pos_transactions';

interface OfflineTransaction {
  id: string;
  type: 'ORDER' | 'PAYMENT' | 'RETURN';
  data: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
  syncAttempts: number;
  lastSyncError?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineTransaction(txn: Omit<OfflineTransaction, 'synced' | 'syncAttempts'>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put({ ...txn, synced: false, syncAttempts: 0 });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingTransactions(): Promise<OfflineTransaction[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.objectStore(STORE_NAME).index('synced');
  const request = index.getAll(IDBKeyRange.only(false));
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as OfflineTransaction[]);
    request.onerror = () => reject(request.error);
  });
}

export async function markTransactionSynced(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const getReq = store.get(id);
  getReq.onsuccess = () => {
    if (getReq.result) {
      store.put({ ...getReq.result, synced: true });
    }
  };
}

export async function markSyncFailed(id: string, error: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const getReq = store.get(id);
  getReq.onsuccess = () => {
    if (getReq.result) {
      store.put({ ...getReq.result, syncAttempts: (getReq.result.syncAttempts || 0) + 1, lastSyncError: error });
    }
  };
}

export async function getOfflineTransactionCount(): Promise<number> {
  const pending = await getPendingTransactions();
  return pending.length;
}

export async function clearSyncedTransactions(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('synced');
  const request = index.openCursor(IDBKeyRange.only(true));
  request.onsuccess = () => {
    const cursor = request.result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };
}
