import { AsyncLocalStorage } from 'async_hooks';

export interface TenantSession {
  tenantId: string;
  userId: string;
}

export const tenantLocalStorage = new AsyncLocalStorage<TenantSession>();

/**
 * Gets the current request-scoped tenant session.
 */
export function getTenantSession(): TenantSession | undefined {
  return tenantLocalStorage.getStore();
}

/**
 * Executes a function within the context of a request-scoped tenant session.
 */
export function runWithTenantSession<T>(
  session: TenantSession,
  fn: () => T | Promise<T>,
): Promise<T> {
  // Always returns a promise even if the function is synchronous
  return new Promise<T>((resolve, reject) => {
    tenantLocalStorage.run(session, async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}
