import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceController } from '../finance.controller';
import { FinanceService } from '../finance.service';
import { CreateInvoiceInput, CreatePaymentInput } from '@unerp/shared';

describe('FinanceController', () => {
  let controller: FinanceController;
  let service: FinanceService;

  beforeEach(() => {
    service = {
      getInvoices: vi.fn().mockResolvedValue([]),
      createInvoice: vi.fn().mockResolvedValue({ id: 'inv-1' }),
      createPayment: vi.fn().mockResolvedValue({ id: 'pay-1' }),
    } as any;
    
    controller = new FinanceController(service);
  });

  describe('getInvoices', () => {
    it('should call financeService.getInvoices with tenantId', async () => {
      const req: any = { user: { tenantId: 'tenant-1' } };
      await controller.getInvoices(req);
      expect(service.getInvoices).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('createInvoice', () => {
    it('should call financeService.createInvoice with correct params', async () => {
      const req: any = { user: { tenantId: 'tenant-1', orgId: 'org-1', userId: 'user-1' } };
      const dto: CreateInvoiceInput = {} as any;
      await controller.createInvoice(req, dto);
      expect(service.createInvoice).toHaveBeenCalledWith('tenant-1', 'org-1', dto, 'user-1');
    });

    it('should use default orgId and system user if not provided in req', async () => {
      const req: any = { user: { tenantId: 'tenant-1' } };
      const dto: CreateInvoiceInput = {} as any;
      await controller.createInvoice(req, dto);
      expect(service.createInvoice).toHaveBeenCalledWith('tenant-1', 'org-system-default', dto, 'system');
    });
  });

  describe('createPayment', () => {
    it('should call financeService.createPayment with correct params', async () => {
      const req: any = { user: { tenantId: 'tenant-1', userId: 'user-1' } };
      const dto: CreatePaymentInput = {} as any;
      await controller.createPayment(req, dto);
      expect(service.createPayment).toHaveBeenCalledWith('tenant-1', dto, 'user-1');
    });

    it('should fallback to system user if not provided in req', async () => {
      const req: any = { user: { tenantId: 'tenant-1' } };
      const dto: CreatePaymentInput = {} as any;
      await controller.createPayment(req, dto);
      expect(service.createPayment).toHaveBeenCalledWith('tenant-1', dto, 'system');
    });
  });
});
