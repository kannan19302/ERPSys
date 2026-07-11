import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerPortalService } from '../customer-portal.service';
import { CrmPortalPaymentGatewayService } from '../crm-portal-payment-gateway.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    customer: { findFirst: vi.fn() },
    customerPortalUser: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    invoice: { findFirst: vi.fn(), update: vi.fn() },
    payment: { create: vi.fn() },
    portalPaymentIntent: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@unerp/auth', () => ({
  hashPassword: vi.fn(), comparePassword: vi.fn(), signToken: vi.fn(),
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const CUSTOMER = 'cust-1';

describe('CustomerPortalService — online invoice payment collection', () => {
  let service: CustomerPortalService;
  let gateway: CrmPortalPaymentGatewayService;

  beforeEach(() => {
    vi.clearAllMocks();
    gateway = new CrmPortalPaymentGatewayService();
    service = new CustomerPortalService(gateway);
  });

  it('initiates a payment intent for an outstanding invoice', async () => {
    (prisma.invoice.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'inv1', tenantId: TENANT, customerId: CUSTOMER, status: 'SENT', currency: 'USD', totalAmount: 100, paidAmount: 0,
    });
    (prisma.portalPaymentIntent.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'intent1', ...data }));

    const result = await service.initiateInvoicePayment(TENANT, CUSTOMER, 'user1', 'inv1', { amount: 50 });
    expect(result.status).toBe('REQUIRES_CONFIRMATION');
    expect(prisma.portalPaymentIntent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ invoiceId: 'inv1', customerId: CUSTOMER, amount: 50, provider: 'mock_gateway' }),
    }));
  });

  it('rejects initiating payment for an already-paid invoice', async () => {
    (prisma.invoice.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'inv1', status: 'PAID', totalAmount: 100, paidAmount: 100 });
    await expect(service.initiateInvoicePayment(TENANT, CUSTOMER, 'user1', 'inv1', { amount: 10 })).rejects.toThrow('already paid');
  });

  it('rejects a payment amount exceeding the outstanding balance', async () => {
    (prisma.invoice.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'inv1', status: 'SENT', currency: 'USD', totalAmount: 100, paidAmount: 40 });
    await expect(service.initiateInvoicePayment(TENANT, CUSTOMER, 'user1', 'inv1', { amount: 90 })).rejects.toThrow('exceeds outstanding balance');
  });

  it('confirms a payment, records a Payment row, and marks the invoice PAID when fully paid', async () => {
    (prisma.portalPaymentIntent.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'intent1', tenantId: TENANT, customerId: CUSTOMER, invoiceId: 'inv1', amount: 100, currency: 'USD',
      gatewayIntentId: 'mock_pi_x', status: 'REQUIRES_CONFIRMATION',
    });
    (prisma.invoice.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'inv1', tenantId: TENANT, totalAmount: 100, paidAmount: 0, status: 'SENT', paidAt: null,
    });
    (prisma.payment.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'pay1' });
    (prisma.invoice.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.portalPaymentIntent.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'intent1', status: 'SUCCEEDED' });

    const result = await service.confirmInvoicePayment(TENANT, CUSTOMER, 'intent1', { simulateDecline: false });

    expect(prisma.payment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ invoiceId: 'inv1', amount: 100, method: 'ONLINE_PORTAL' }),
    }));
    expect(prisma.invoice.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'inv1' },
      data: expect.objectContaining({ status: 'PAID' }),
    }));
    expect(result.status).toBe('SUCCEEDED');
  });

  it('marks the intent FAILED and throws when the mock gateway simulates a decline', async () => {
    (prisma.portalPaymentIntent.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'intent1', tenantId: TENANT, customerId: CUSTOMER, invoiceId: 'inv1', amount: 50, currency: 'USD',
      gatewayIntentId: 'mock_pi_x', status: 'REQUIRES_CONFIRMATION',
    });
    (prisma.portalPaymentIntent.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await expect(service.confirmInvoicePayment(TENANT, CUSTOMER, 'intent1', { simulateDecline: true })).rejects.toThrow('declined');
    expect(prisma.portalPaymentIntent.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'intent1' }, data: { status: 'FAILED' },
    }));
  });

  it('rejects confirming a payment intent that is not in REQUIRES_CONFIRMATION status', async () => {
    (prisma.portalPaymentIntent.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'intent1', status: 'SUCCEEDED' });
    await expect(service.confirmInvoicePayment(TENANT, CUSTOMER, 'intent1', { simulateDecline: false })).rejects.toThrow('already SUCCEEDED');
  });
});
