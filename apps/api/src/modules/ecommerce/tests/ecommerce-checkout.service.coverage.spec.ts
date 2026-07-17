import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EcommerceCheckoutService } from '../ecommerce-checkout.service';
import { MockPaymentGatewayService } from '../payments/mock-payment-gateway.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      cart: { findFirst: vi.fn(), update: vi.fn() },
      organization: { findFirst: vi.fn() },
      customer: { findFirst: vi.fn(), create: vi.fn() },
      storefrontOrderPayment: { create: vi.fn() },
    },
  };
});

function fakeSalesService() {
  return {
    createConfirmedOnlineOrder: vi.fn().mockResolvedValue({
      id: 'so-1',
      orderNumber: 'ONL-123',
      status: 'CONFIRMED',
      totalAmount: 50,
    }),
  };
}

const baseCart = {
  id: 'cart-1',
  tenantId: 't1',
  sessionToken: 'sess-1',
  status: 'ACTIVE',
  currency: 'USD',
  items: [
    {
      id: 'item-1',
      quantity: 2,
      unitPriceSnapshot: 25,
      productListing: { productId: 'prod-1', displayName: 'Widget', product: { name: 'Widget' } },
    },
  ],
};

const checkoutDto = {
  sessionToken: 'sess-1',
  customerName: 'Jane Shopper',
  customerEmail: 'jane@example.com',
  shippingAddress: { street: '123 Main St', city: 'Metropolis', state: 'NY', zip: '10001', country: 'US' },
};

describe('EcommerceCheckoutService', () => {
  let salesService: ReturnType<typeof fakeSalesService>;
  let checkoutService: EcommerceCheckoutService;

  beforeEach(async () => {
    vi.clearAllMocks();
    salesService = fakeSalesService();
    checkoutService = new EcommerceCheckoutService(
      salesService as never,
      new MockPaymentGatewayService(),
    );

    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.organization).findFirst.mockResolvedValue({ id: 'org-1', tenantId: 't1' } as never);
    vi.mocked(prisma.customer).findFirst.mockResolvedValue(null);
    vi.mocked(prisma.customer).create.mockResolvedValue({ id: 'cust-1' } as never);
    vi.mocked(prisma.storefrontOrderPayment).create.mockResolvedValue({ id: 'pay-1' } as never);
    vi.mocked(prisma.cart).update.mockResolvedValue({ id: 'cart-1', status: 'CONVERTED' } as never);
  });

  it('rejects checkout for a cart that does not exist', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cart).findFirst.mockResolvedValue(null);

    await expect(checkoutService.checkout('t1', checkoutDto)).rejects.toThrow(NotFoundException);
    expect(salesService.createConfirmedOnlineOrder).not.toHaveBeenCalled();
  });

  it('rejects checkout for an empty cart — creates zero SalesOrders', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cart).findFirst.mockResolvedValue({ ...baseCart, items: [] } as never);

    await expect(checkoutService.checkout('t1', checkoutDto)).rejects.toThrow(BadRequestException);
    expect(salesService.createConfirmedOnlineOrder).not.toHaveBeenCalled();
  });

  it('rejects checkout for a cart that is not ACTIVE (already converted)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cart).findFirst.mockResolvedValue({ ...baseCart, status: 'CONVERTED' } as never);

    await expect(checkoutService.checkout('t1', checkoutDto)).rejects.toThrow(BadRequestException);
    expect(salesService.createConfirmedOnlineOrder).not.toHaveBeenCalled();
  });

  it('happy path: creates exactly one SalesOrder, one SUCCEEDED StorefrontOrderPayment, and marks the cart CONVERTED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cart).findFirst.mockResolvedValue(baseCart as never);

    const result = await checkoutService.checkout('t1', checkoutDto);

    expect(salesService.createConfirmedOnlineOrder).toHaveBeenCalledTimes(1);
    expect(salesService.createConfirmedOnlineOrder).toHaveBeenCalledWith(
      't1',
      'org-1',
      expect.objectContaining({ salesChannel: 'ONLINE', paymentStatus: 'PAID', customerId: 'cust-1' }),
      expect.any(String),
    );

    expect(prisma.storefrontOrderPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 't1', salesOrderId: 'so-1', status: 'SUCCEEDED', provider: 'mock_gateway' }),
      }),
    );

    expect(prisma.cart.update).toHaveBeenCalledWith({ where: { id: 'cart-1' }, data: { status: 'CONVERTED' } });

    expect(result).toEqual(
      expect.objectContaining({ orderId: 'so-1', orderNumber: 'ONL-123', status: 'CONFIRMED' }),
    );
  });

  it('decline path: creates zero SalesOrders, does not convert the cart, and surfaces a retry-able error', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cart).findFirst.mockResolvedValue(baseCart as never);

    await expect(
      checkoutService.checkout('t1', { ...checkoutDto, simulateDecline: true }),
    ).rejects.toThrow(BadRequestException);

    expect(salesService.createConfirmedOnlineOrder).not.toHaveBeenCalled();
    expect(prisma.storefrontOrderPayment.create).not.toHaveBeenCalled();
    expect(prisma.cart.update).not.toHaveBeenCalled();
  });

  it('finds an existing Customer by tenant+email instead of creating a duplicate', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.cart).findFirst.mockResolvedValue(baseCart as never);
    vi.mocked(prisma.customer).findFirst.mockResolvedValue({ id: 'existing-cust' } as never);

    await checkoutService.checkout('t1', checkoutDto);

    expect(prisma.customer.create).not.toHaveBeenCalled();
    expect(salesService.createConfirmedOnlineOrder).toHaveBeenCalledWith(
      't1',
      'org-1',
      expect.objectContaining({ customerId: 'existing-cust' }),
      expect.any(String),
    );
  });
});
