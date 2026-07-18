import { describe, expect, it, vi } from 'vitest';
import {
  RecordNotFoundForUpdateError,
  StaleWriteError,
  updateWithVersionGuard,
  type VersionedDelegate,
} from './optimistic-locking';

const target = { entity: 'SalesOrder', id: 'so-1', tenantId: 'tenant-a', expectedVersion: 3 };

function delegateWith(updateCount: number, probeResult: { version: number } | null): VersionedDelegate<Record<string, unknown>, Record<string, unknown>> & {
  updateMany: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
} {
  return {
    updateMany: vi.fn().mockResolvedValue({ count: updateCount }),
    findFirst: vi.fn().mockResolvedValue(probeResult),
  };
}

describe('updateWithVersionGuard (Track G.2)', () => {
  it('matches on (id, tenantId, version) and increments atomically', async () => {
    const delegate = delegateWith(1, null);
    const affected = await updateWithVersionGuard(delegate, target, { status: 'CONFIRMED' });
    expect(affected).toBe(1);
    expect(delegate.updateMany).toHaveBeenCalledWith({
      where: { id: 'so-1', tenantId: 'tenant-a', version: 3 },
      data: { status: 'CONFIRMED', version: { increment: 1 } },
    });
    expect(delegate.findFirst).not.toHaveBeenCalled();
  });

  it('throws StaleWriteError with the current version when the row moved on', async () => {
    const delegate = delegateWith(0, { version: 5 });
    await expect(updateWithVersionGuard(delegate, target, { status: 'X' })).rejects.toThrow(StaleWriteError);
    await expect(updateWithVersionGuard(delegate, target, { status: 'X' })).rejects.toMatchObject({
      currentVersion: 5,
    });
  });

  it('throws RecordNotFoundForUpdateError when no row exists for the tenant', async () => {
    const delegate = delegateWith(0, null);
    await expect(updateWithVersionGuard(delegate, target, {})).rejects.toThrow(RecordNotFoundForUpdateError);
  });

  it('keeps the stale-probe tenant-scoped (foreign tenant row == not found)', async () => {
    const delegate = delegateWith(0, null);
    await expect(updateWithVersionGuard(delegate, target, {})).rejects.toThrow(RecordNotFoundForUpdateError);
    expect(delegate.findFirst).toHaveBeenCalledWith({
      where: { id: 'so-1', tenantId: 'tenant-a' },
      select: { version: true },
    });
  });

  it('rejects invalid expectedVersion and reserved data fields', async () => {
    const delegate = delegateWith(1, null);
    await expect(updateWithVersionGuard(delegate, { ...target, expectedVersion: 0 }, {})).rejects.toThrow(RangeError);
    await expect(updateWithVersionGuard(delegate, { ...target, expectedVersion: 1.5 }, {})).rejects.toThrow(RangeError);
    await expect(updateWithVersionGuard(delegate, target, { version: 9 })).rejects.toThrow(RangeError);
    await expect(updateWithVersionGuard(delegate, target, { tenantId: 'evil' })).rejects.toThrow(RangeError);
    expect(delegate.updateMany).not.toHaveBeenCalled();
  });
});
