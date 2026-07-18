/**
 * Optimistic-locking convention (Foundation Roadmap Track G.2).
 *
 * Every mutable business aggregate carries `version Int @default(1)`.
 * Updates go through `updateWithVersionGuard`, which performs a single
 * conditional write: rows are matched on `(id, tenantId, version)` and the
 * version is incremented atomically. A concurrent writer that committed first
 * changes `version`, so the stale writer matches 0 rows and receives
 * `StaleWriteError` — surfaced by the API's global filter as HTTP 409 with
 * the contract code `STALE_WRITE` (see @unerp/shared ERROR_CODES).
 *
 * Existing aggregates gain their `version` columns in the post-Track-A
 * migration window; new entities get them from the scaffolder immediately.
 */

export class StaleWriteError extends Error {
  readonly currentVersion: number;

  constructor(entity: string, id: string, expectedVersion: number, currentVersion: number) {
    super(
      `${entity} ${id} was modified by another user (expected version ${expectedVersion}, current ${currentVersion}). Reload and retry.`,
    );
    this.name = 'StaleWriteError';
    this.currentVersion = currentVersion;
  }
}

export class RecordNotFoundForUpdateError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} not found`);
    this.name = 'RecordNotFoundForUpdateError';
  }
}

/** Minimal Prisma-delegate surface the guard needs (keeps the helper generic). */
export interface VersionedDelegate<Where, Data> {
  updateMany(args: { where: Where; data: Data }): Promise<{ count: number }>;
  findFirst(args: {
    where: Record<string, unknown>;
    select: { version: true };
  }): Promise<{ version: number } | null>;
}

export interface VersionGuardTarget {
  /** Entity name for error messages, e.g. "SalesOrder". */
  entity: string;
  id: string;
  tenantId: string;
  expectedVersion: number;
}

/**
 * Conditionally update a versioned aggregate.
 *
 * @returns the number of affected rows (always 1 on success)
 * @throws StaleWriteError when the row exists but the version moved on
 * @throws RecordNotFoundForUpdateError when no such row exists for the tenant
 */
export async function updateWithVersionGuard<Data extends Record<string, unknown>>(
  delegate: VersionedDelegate<Record<string, unknown>, Record<string, unknown>>,
  target: VersionGuardTarget,
  data: Data,
): Promise<number> {
  if (!Number.isInteger(target.expectedVersion) || target.expectedVersion < 1) {
    throw new RangeError(`expectedVersion must be a positive integer, got ${target.expectedVersion}`);
  }
  if ('version' in data || 'tenantId' in data || 'id' in data) {
    throw new RangeError('data must not set id/tenantId/version — the guard owns those fields');
  }

  const { count } = await delegate.updateMany({
    where: { id: target.id, tenantId: target.tenantId, version: target.expectedVersion },
    data: { ...data, version: { increment: 1 } },
  });
  if (count > 0) return count;

  // Distinguish stale vs missing — probe stays tenant-scoped so a foreign
  // tenant's row is indistinguishable from a missing one (no existence leak).
  const current = await delegate.findFirst({
    where: { id: target.id, tenantId: target.tenantId },
    select: { version: true },
  });
  if (current) {
    throw new StaleWriteError(target.entity, target.id, target.expectedVersion, current.version);
  }
  throw new RecordNotFoundForUpdateError(target.entity, target.id);
}
