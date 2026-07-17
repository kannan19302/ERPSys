import { describe, it, expect } from 'vitest';
import { hasPermission, parsePermission } from './index';
describe('hasPermission — permission matrix', () => {
    describe('exact match', () => {
        it('grants when the user has the exact permission', () => {
            expect(hasPermission(['finance.invoice.create'], 'finance.invoice.create')).toBe(true);
        });
        it('denies by default when the user has no matching permission', () => {
            expect(hasPermission(['finance.invoice.read'], 'finance.invoice.create')).toBe(false);
        });
        it('denies when the user has zero permissions', () => {
            expect(hasPermission([], 'finance.invoice.create')).toBe(false);
        });
        it('denies a permission from a completely different module', () => {
            expect(hasPermission(['hr.employee.read'], 'finance.invoice.read')).toBe(false);
        });
    });
    describe('module wildcard ("module.*")', () => {
        it('grants any resource/action under the wildcarded module', () => {
            expect(hasPermission(['finance.*'], 'finance.invoice.create')).toBe(true);
            expect(hasPermission(['finance.*'], 'finance.payment.delete')).toBe(true);
        });
        it('does not grant a permission in a different module', () => {
            expect(hasPermission(['finance.*'], 'hr.employee.read')).toBe(false);
        });
        it('does not leak across a same-prefix module boundary (regression)', () => {
            // "finance.*" must not match "financial.report.read" just because the
            // string happens to start with "financ". This was a real bug: the
            // original implementation used a bare `startsWith(prefix)` with no "."
            // boundary check.
            expect(hasPermission(['finance.*'], 'financial.report.read')).toBe(false);
        });
    });
    describe('resource wildcard ("module.resource.*")', () => {
        it('grants any action on the wildcarded resource', () => {
            expect(hasPermission(['finance.invoice.*'], 'finance.invoice.create')).toBe(true);
            expect(hasPermission(['finance.invoice.*'], 'finance.invoice.void')).toBe(true);
        });
        it('does not grant a different resource under the same module', () => {
            expect(hasPermission(['finance.invoice.*'], 'finance.payment.create')).toBe(false);
        });
        it('does not leak across a same-prefix resource boundary (regression)', () => {
            // "finance.invoice.*" must not match "finance.invoiceapproval.create"
            // just because the resource name shares a prefix.
            expect(hasPermission(['finance.invoice.*'], 'finance.invoiceapproval.create')).toBe(false);
        });
        it('grants the bare resource permission equal to the prefix itself', () => {
            expect(hasPermission(['finance.invoice.*'], 'finance.invoice')).toBe(true);
        });
    });
    describe('super-admin wildcard ("*")', () => {
        it('grants any permission at all', () => {
            expect(hasPermission(['*'], 'finance.invoice.create')).toBe(true);
            expect(hasPermission(['*'], 'admin.role.delete')).toBe(true);
            expect(hasPermission(['*'], 'anything.at.all')).toBe(true);
        });
    });
    describe('multiple granted permissions (role composition)', () => {
        it('grants if any one of several roles/permissions matches', () => {
            const granted = ['hr.employee.read', 'finance.invoice.*', 'crm.lead.create'];
            expect(hasPermission(granted, 'finance.invoice.void')).toBe(true);
            expect(hasPermission(granted, 'crm.lead.create')).toBe(true);
            expect(hasPermission(granted, 'crm.lead.delete')).toBe(false);
        });
    });
    describe('malformed / edge-case permission strings', () => {
        it('does not throw on an empty required permission', () => {
            expect(() => hasPermission(['finance.*'], '')).not.toThrow();
        });
        it('treats a plain string without wildcard as an exact-match-only permission', () => {
            expect(hasPermission(['finance.invoice.create'], 'finance.invoice.creat')).toBe(false);
            expect(hasPermission(['finance.invoice.create'], 'finance.invoice.createx')).toBe(false);
        });
    });
});
describe('parsePermission', () => {
    it('splits a well-formed permission into module/resource/action', () => {
        expect(parsePermission('finance.invoice.create')).toEqual({
            module: 'finance',
            resource: 'invoice',
            action: 'create',
        });
    });
    it('throws on a malformed permission string (wrong segment count)', () => {
        expect(() => parsePermission('finance.invoice')).toThrow();
        expect(() => parsePermission('finance.invoice.create.extra')).toThrow();
        expect(() => parsePermission('finance')).toThrow();
    });
});
//# sourceMappingURL=permission-matrix.test.js.map