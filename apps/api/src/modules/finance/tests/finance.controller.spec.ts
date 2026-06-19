import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceController } from '../finance.controller';
import { FinanceService } from '../finance.service';

describe('FinanceController', () => {
  let controller: FinanceController;
  let service: FinanceService;

  beforeEach(() => {
    service = { getInvoices: vi.fn(), createInvoice: vi.fn(), createPayment: vi.fn() } as unknown as FinanceService;
    
    controller = new FinanceController(service);
  });

  describe('getInvoices', () => {
    it('should call financeService.getInvoices with tenantId', async () => {
      const req: unknown = { user: { tenantId: 'tenant-1' } };
      await controller.getInvoices(req as never);
      expect(service.getInvoices).toHaveBeenCalledWith('tenant-1', expect.any(Object));
    });
  });

  describe('createInvoice', () => {
    it('should call financeService.createInvoice with correct params', async () => {
      const req: unknown = { user: { tenantId: 'tenant-1', orgId: 'org-1', userId: 'user-1' } };
      const dto = {} as never;
      await controller.createInvoice(req as never, dto as never);
      expect(service.createInvoice).toHaveBeenCalledWith('tenant-1', 'org-1', dto, 'user-1');
    });

    it('should use default orgId and system user if not provided in req', async () => {
      const req: unknown = { user: { tenantId: 'tenant-1' } };
      const dto = {} as never;
      await controller.createInvoice(req as never, dto as never);
      expect(service.createInvoice).toHaveBeenCalledWith('tenant-1', 'org-system-default', dto, 'system');
    });
  });

  describe('createPayment', () => {
    it('should call financeService.createPayment with correct params', async () => {
      const req: unknown = { user: { tenantId: 'tenant-1', userId: 'user-1' } };
      const dto = {} as never;
      await controller.createPayment(req as never, dto as never);
      expect(service.createPayment).toHaveBeenCalledWith('tenant-1', dto, 'user-1');
    });

    it('should fallback to system user if not provided in req', async () => {
      const req: unknown = { user: { tenantId: 'tenant-1' } };
      const dto = {} as never;
      await controller.createPayment(req as never, dto as never);
      expect(service.createPayment).toHaveBeenCalledWith('tenant-1', dto, 'system');
    });
  });
});
