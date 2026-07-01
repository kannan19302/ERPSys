import { describe, it, expect } from 'vitest';
import { applyTenantScope, MODELS_WITHOUT_TENANT } from './tenant-scope';

describe('applyTenantScope', () => {
  const TENANT_A = 'tenant-a';

  describe('read operations (findMany, findFirst, findUnique, count, aggregate, groupBy)', () => {
    it.each(['findMany', 'findFirst', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow', 'count', 'aggregate', 'groupBy'])(
      'injects tenantId into where for %s even when args is undefined',
      (operation) => {
        // Regression test: a call like `prisma.invoice.findMany()` passes no
        // args at all. The original implementation mutated a throwaway `{}`
        // and returned the untouched `undefined` args, silently skipping
        // tenant scoping entirely.
        const result = applyTenantScope('Invoice', operation, undefined, TENANT_A);
        expect(result.where).toEqual({ tenantId: TENANT_A });
      },
    );

    it('merges tenantId into an existing where clause without dropping other filters', () => {
      const result = applyTenantScope('Invoice', 'findMany', { where: { status: 'PAID' } }, TENANT_A);
      expect(result.where).toEqual({ status: 'PAID', tenantId: TENANT_A });
    });

    it('overrides a caller-supplied tenantId with the session tenantId (prevents spoofing)', () => {
      const result = applyTenantScope(
        'Invoice',
        'findMany',
        { where: { tenantId: 'attacker-tenant', status: 'PAID' } },
        TENANT_A,
      );
      expect(result.where).toEqual({ status: 'PAID', tenantId: TENANT_A });
    });

    it('does not mutate the original args object', () => {
      const original = { where: { status: 'PAID' } };
      applyTenantScope('Invoice', 'findMany', original, TENANT_A);
      expect(original).toEqual({ where: { status: 'PAID' } });
    });
  });

  describe('where-based mutations (update, updateMany, delete, deleteMany)', () => {
    it.each(['update', 'updateMany', 'delete', 'deleteMany'])(
      'scopes %s to the current tenant even with no where clause',
      (operation) => {
        const result = applyTenantScope('Invoice', operation, { data: { status: 'VOID' } }, TENANT_A);
        expect(result.where).toEqual({ tenantId: TENANT_A });
      },
    );

    it('cannot be tricked into deleting another tenant\'s row by id alone', () => {
      const result = applyTenantScope('Invoice', 'delete', { where: { id: 'inv-123' } }, TENANT_A);
      expect(result.where).toEqual({ id: 'inv-123', tenantId: TENANT_A });
    });
  });

  describe('create / createMany / upsert', () => {
    it('stamps tenantId onto create data, overriding any caller-supplied value', () => {
      const result = applyTenantScope('Invoice', 'create', { data: { tenantId: 'attacker-tenant', total: 100 } }, TENANT_A);
      expect(result.data).toEqual({ tenantId: TENANT_A, total: 100 });
    });

    it('stamps tenantId onto every row for createMany with an array payload', () => {
      const result = applyTenantScope(
        'Invoice',
        'createMany',
        { data: [{ total: 100 }, { total: 200, tenantId: 'attacker-tenant' }] },
        TENANT_A,
      );
      expect(result.data).toEqual([
        { total: 100, tenantId: TENANT_A },
        { total: 200, tenantId: TENANT_A },
      ]);
    });

    it('stamps tenantId onto a single-object createMany payload', () => {
      const result = applyTenantScope('Invoice', 'createMany', { data: { total: 100 } }, TENANT_A);
      expect(result.data).toEqual({ total: 100, tenantId: TENANT_A });
    });

    it('scopes upsert create, update, and where clauses together', () => {
      const result = applyTenantScope(
        'Invoice',
        'upsert',
        { where: { id: 'inv-1' }, create: { total: 100 }, update: { total: 200 } },
        TENANT_A,
      );
      expect(result.where).toEqual({ id: 'inv-1', tenantId: TENANT_A });
      expect(result.create).toEqual({ total: 100, tenantId: TENANT_A });
      expect(result.update).toEqual({ total: 200, tenantId: TENANT_A });
    });
  });

  describe('MODELS_WITHOUT_TENANT allow-list', () => {
    it('exempts platform-level, tenant-agnostic models', () => {
      expect(MODELS_WITHOUT_TENANT.has('Tenant')).toBe(true);
      expect(MODELS_WITHOUT_TENANT.has('SaaSPlan')).toBe(true);
      expect(MODELS_WITHOUT_TENANT.has('LanguageOverride')).toBe(true);
    });

    it('does not exempt ordinary tenant-scoped models', () => {
      expect(MODELS_WITHOUT_TENANT.has('Invoice')).toBe(false);
      expect(MODELS_WITHOUT_TENANT.has('User')).toBe(false);
    });
  });
});
