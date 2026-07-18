import { describe, it, expect, vi } from 'vitest';
import { NumberingService, type DocumentSequenceRow, type NumberingTx } from './numbering.service';

function makeSeq(overrides: Partial<DocumentSequenceRow> = {}): DocumentSequenceRow {
  return {
    id: 'seq-1',
    tenantId: 'tenant-1',
    series: 'INV',
    organizationId: null,
    prefix: 'INV-',
    suffix: '',
    padding: 5,
    nextNumber: 42,
    resetFrequency: null,
    resetPeriod: null,
    format: '{prefix}{number}{suffix}',
    version: 1,
    ...overrides,
  };
}

function makeTx(seq: DocumentSequenceRow): { tx: NumberingTx; updates: any[] } {
  const updates: any[] = [];
  const tx: NumberingTx = {
    documentSequence: {
      findUnique: vi.fn().mockResolvedValue(seq),
      update: vi.fn().mockImplementation((args) => {
        updates.push(args);
        return Promise.resolve({ ...seq, ...args.data });
      }),
    },
  };
  return { tx, updates };
}

describe('NumberingService', () => {
  const svc = new NumberingService();

  // ── formatNumber ──

  describe('formatNumber', () => {
    it('formats with default template', () => {
      const result = svc.formatNumber(makeSeq(), 42);
      expect(result).toBe('INV-00042');
    });

    it('respects padding value', () => {
      const seq = makeSeq({ padding: 3 });
      expect(svc.formatNumber(seq, 5)).toBe('INV-005');
    });

    it('handles custom format with all placeholders', () => {
      const seq = makeSeq({ format: '{prefix}[{number}]{suffix}', suffix: 'X' });
      expect(svc.formatNumber(seq, 1)).toBe('INV-[00001]X');
    });

    it('handles empty prefix and suffix', () => {
      const seq = makeSeq({ prefix: '', suffix: '', format: '{number}' });
      expect(svc.formatNumber(seq, 7)).toBe('00007');
    });

    it('handles numbers larger than padding width', () => {
      const seq = makeSeq({ padding: 3 });
      expect(svc.formatNumber(seq, 9999)).toBe('INV-9999');
    });
  });

  // ── getNextNumber ──

  describe('getNextNumber', () => {
    it('increments nextNumber and returns formatted result', async () => {
      const { tx, updates } = makeTx(makeSeq());
      const result = await svc.getNextNumber(tx, 'tenant-1', 'INV');

      expect(result).toEqual({
        series: 'INV',
        number: 'INV-00042',
        sequence: 42,
      });
      expect(updates).toHaveLength(1);
      expect(updates[0].data.nextNumber).toBe(43);
    });

    it('throws when sequence is not found', async () => {
      const tx: NumberingTx = {
        documentSequence: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
      };
      await expect(svc.getNextNumber(tx, 'tenant-1', 'UNKNOWN')).rejects.toThrow(
        'DocumentSequence not found',
      );
    });

    it('passes organizationId to the lookup', async () => {
      const findUnique = vi.fn().mockResolvedValue(makeSeq());
      const tx: NumberingTx = {
        documentSequence: {
          findUnique,
          update: vi.fn(),
        },
      };
      await svc.getNextNumber(tx, 'tenant-1', 'INV', { organizationId: 'org-1' });
      expect(findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_series_organizationId: {
            tenantId: 'tenant-1',
            series: 'INV',
            organizationId: 'org-1',
          },
        },
      });
    });
  });

  // ── Auto-reset logic ──

  describe('auto-reset (YEARLY)', () => {
    it('resets to 1 and updates resetPeriod when period changes', async () => {
      const seq = makeSeq({
        resetFrequency: 'YEARLY',
        resetPeriod: '2025',
        nextNumber: 99,
      });
      const { tx, updates } = makeTx(seq);
      // Use a fixed date in 2026
      const now = new Date('2026-06-15T12:00:00Z');
      const result = await svc.getNextNumber(tx, 'tenant-1', 'INV', { now });

      expect(result.sequence).toBe(1);
      expect(result.number).toBe('INV-00001');
      expect(updates[0].data.nextNumber).toBe(100);
      expect(updates[0].data.resetPeriod).toBe('2026');
    });

    it('does not reset when period matches', async () => {
      const seq = makeSeq({
        resetFrequency: 'YEARLY',
        resetPeriod: '2026',
        nextNumber: 50,
      });
      const { tx, updates } = makeTx(seq);
      const now = new Date('2026-06-15T12:00:00Z');
      const result = await svc.getNextNumber(tx, 'tenant-1', 'INV', { now });

      expect(result.sequence).toBe(50);
      expect(result.number).toBe('INV-00050');
      expect(updates[0].data.nextNumber).toBe(51);
      expect(updates[0].data.resetPeriod).toBeUndefined();
    });
  });

  describe('auto-reset (MONTHLY)', () => {
    it('resets to 1 when month changes', async () => {
      const seq = makeSeq({
        resetFrequency: 'MONTHLY',
        resetPeriod: '2026-06',
        nextNumber: 10,
      });
      const { tx, updates } = makeTx(seq);
      const now = new Date('2026-07-01T00:00:00Z');
      const result = await svc.getNextNumber(tx, 'tenant-1', 'INV', { now });

      expect(result.sequence).toBe(1);
      expect(updates[0].data.nextNumber).toBe(11);
      expect(updates[0].data.resetPeriod).toBe('2026-07');
    });

    it('does not reset within same month', async () => {
      const seq = makeSeq({
        resetFrequency: 'MONTHLY',
        resetPeriod: '2026-07',
        nextNumber: 5,
      });
      const { tx } = makeTx(seq);
      const now = new Date('2026-07-18T12:00:00Z');
      const result = await svc.getNextNumber(tx, 'tenant-1', 'INV', { now });

      expect(result.sequence).toBe(5);
    });
  });

  // ── peekNextNumber ──

  describe('peekNextNumber', () => {
    it('returns formatted number without incrementing', async () => {
      const { tx, updates } = makeTx(makeSeq());
      const result = await svc.peekNextNumber(tx, 'tenant-1', 'INV');

      expect(result).toEqual({
        series: 'INV',
        number: 'INV-00042',
        sequence: 42,
      });
      expect(updates).toHaveLength(0);
    });
  });

  // ── resetSequence ──

  describe('resetSequence', () => {
    it('updates nextNumber to the given value', async () => {
      const { tx, updates } = makeTx(makeSeq());
      await svc.resetSequence(tx, 'tenant-1', 'INV', 1);

      expect(updates).toHaveLength(1);
      expect(updates[0].data.nextNumber).toBe(1);
    });

    it('throws when sequence does not exist', async () => {
      const tx: NumberingTx = {
        documentSequence: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
      };
      await expect(svc.resetSequence(tx, 'tenant-1', 'INV', 1)).rejects.toThrow(
        'DocumentSequence not found',
      );
    });
  });
});
