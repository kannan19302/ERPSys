import { describe, it, expect } from 'vitest';
import { applySoftDeleteScope, SOFT_DELETE_ENABLED_MODELS } from './soft-delete';

describe('SOFT_DELETE_ENABLED_MODELS', () => {
  it('includes Customer (known soft-delete model)', () => {
    expect(SOFT_DELETE_ENABLED_MODELS.has('Customer')).toBe(true);
  });

  it('excludes Tenant (no deletedAt column)', () => {
    expect(SOFT_DELETE_ENABLED_MODELS.has('Tenant')).toBe(false);
  });

  it('excludes UserRole (join table, no deletedAt)', () => {
    expect(SOFT_DELETE_ENABLED_MODELS.has('UserRole')).toBe(false);
  });
});

describe('applySoftDeleteScope', () => {
  describe('for models NOT in SOFT_DELETE_ENABLED_MODELS', () => {
    it('returns args unchanged for Tenant', () => {
      const result = applySoftDeleteScope('Tenant', 'findMany', { where: { name: 'foo' } });
      expect(result).toEqual({ where: { name: 'foo' } });
    });

    it('returns args unchanged for undefined args', () => {
      const result = applySoftDeleteScope('Tenant', 'findMany', undefined);
      expect(result).toEqual({});
    });
  });

  describe('for soft-delete enabled models', () => {
    it('injects deletedAt: null into findMany where clause', () => {
      const result = applySoftDeleteScope('Customer', 'findMany', {
        where: { email: 'a@b.com' },
      });
      expect(result.where).toEqual({ email: 'a@b.com', deletedAt: null });
    });

    it('injects deletedAt: null when args is undefined', () => {
      const result = applySoftDeleteScope('Customer', 'findMany', undefined);
      expect(result.where).toEqual({ deletedAt: null });
    });

    it('injects deletedAt: null for findUnique', () => {
      const result = applySoftDeleteScope('Customer', 'findUnique', {
        where: { id: 'abc' },
      });
      expect(result.where).toEqual({ id: 'abc', deletedAt: null });
    });

    it('injects deletedAt: null for count', () => {
      const result = applySoftDeleteScope('Invoice', 'count', { where: { status: 'PAID' } });
      expect(result.where).toEqual({ status: 'PAID', deletedAt: null });
    });

    it('injects deletedAt: null for update', () => {
      const result = applySoftDeleteScope('Invoice', 'update', {
        where: { id: 'abc' },
        data: { status: 'CANCELLED' },
      });
      expect(result.where).toEqual({ id: 'abc', deletedAt: null });
      expect(result.data).toEqual({ status: 'CANCELLED' });
    });

    it('injects deletedAt: null for delete', () => {
      const result = applySoftDeleteScope('Customer', 'delete', {
        where: { id: 'abc' },
      });
      expect(result.where).toEqual({ id: 'abc', deletedAt: null });
    });

    it('injects deletedAt: null for deleteMany', () => {
      const result = applySoftDeleteScope('Customer', 'deleteMany', {});
      expect(result.where).toEqual({ deletedAt: null });
    });

    it('does not inject deletedAt for create operations', () => {
      const result = applySoftDeleteScope('Customer', 'create', {
        data: { name: 'New' },
      });
      expect(result).toEqual({ data: { name: 'New' } });
    });

    it('preserves caller-supplied deletedAt filter (for trash views)', () => {
      const result = applySoftDeleteScope('Customer', 'findMany', {
        where: { deletedAt: { not: null } },
      });
      expect(result.where).toEqual({ deletedAt: { not: null } });
    });

    it('preserves caller-supplied deletedAt: undefined', () => {
      const result = applySoftDeleteScope('Customer', 'findMany', {
        where: { deletedAt: undefined },
      });
      expect(result.where).toEqual({ deletedAt: undefined });
    });

    it('injects deletedAt: null for findFirstOrThrow', () => {
      const result = applySoftDeleteScope('Employee', 'findFirstOrThrow', {
        where: { email: 'a@b.com' },
      });
      expect(result.where).toEqual({ email: 'a@b.com', deletedAt: null });
    });

    it('injects deletedAt: null for aggregate', () => {
      const result = applySoftDeleteScope('Invoice', 'aggregate', {
        where: { status: 'PAID' },
        _count: true,
      });
      expect(result.where).toEqual({ status: 'PAID', deletedAt: null });
    });

    it('injects deletedAt: null for groupBy', () => {
      const result = applySoftDeleteScope('Invoice', 'groupBy', {
        where: { status: 'PAID' },
        by: ['status'],
      });
      expect(result.where).toEqual({ status: 'PAID', deletedAt: null });
    });

    it('handles upsert (no injection into where)', () => {
      const result = applySoftDeleteScope('Customer', 'upsert', {
        where: { id: 'abc' },
        create: { name: 'New' },
        update: { name: 'Updated' },
      });
      expect(result).toEqual({
        where: { id: 'abc' },
        create: { name: 'New' },
        update: { name: 'Updated' },
      });
    });
  });
});
