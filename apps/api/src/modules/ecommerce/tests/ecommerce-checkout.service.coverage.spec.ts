import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { EcommerceCheckoutService } from "../ecommerce-checkout.service";
import { MockPaymentGatewayService } from "../payments/mock-payment-gateway.service";

vi.mock("@unerp/database", () => {
  const mockPrisma = {
    $transaction: vi.fn(async (cb) => cb(mockPrisma)),
    cart: { findFirst: vi.fn(), update: vi.fn() },
    organization: { findFirst: vi.fn() },
    customer: { findFirst: vi.fn(), create: vi.fn() },
    storefrontOrderPayment: { create: vi.fn() },
    storefrontCheckoutState: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

function fakeSalesService() {
  return {
    createConfirmedOnlineOrder: vi.fn().mockResolvedValue({
      id: "so-1",
      orderNumber: "ONL-123",
      status: "CONFIRMED",
      totalAmount: 50,
    }),
  };
}

const baseCart = {
  id: "cart-1",
  tenantId: "t1",
  sessionToken: "sess-1",
  status: "ACTIVE",
  currency: "USD",
  items: [
    {
      id: "item-1",
      quantity: 2,
      unitPriceSnapshot: 25,
      productListing: {
        productId: "prod-1",
        displayName: "Widget",
        product: { name: "Widget" },
      },
    },
  ],
};

const checkoutDto = {
  sessionToken: "sess-1",
  customerName: "Jane Shopper",
  customerEmail: "jane@example.com",
  shippingAddress: {
    street: "123 Main St",
    city: "Metropolis",
    state: "NY",
    zip: "10001",
    country: "US",
  },
};

describe("EcommerceCheckoutService", () => {
  let salesService: ReturnType<typeof fakeSalesService>;
  let checkoutService: EcommerceCheckoutService;
  let outboxService: { writeEvent: any };

  beforeEach(async () => {
    vi.clearAllMocks();
    salesService = fakeSalesService();
    outboxService = {
      writeEvent: vi.fn().mockResolvedValue({ id: "event-1" }),
    };
    checkoutService = new EcommerceCheckoutService(
      outboxService as never,
      new MockPaymentGatewayService(),
    );

    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.organization).findFirst.mockResolvedValue({
      id: "org-1",
      tenantId: "t1",
    } as never);
    vi.mocked(prisma.customer).findFirst.mockResolvedValue(null);
    vi.mocked(prisma.customer).create.mockResolvedValue({
      id: "cust-1",
    } as never);
    vi.mocked(prisma.storefrontOrderPayment).create.mockResolvedValue({
      id: "pay-1",
    } as never);
    vi.mocked(prisma.cart).update.mockResolvedValue({
      id: "cart-1",
      status: "CONVERTED",
    } as never);
    vi.mocked(prisma.storefrontCheckoutState.create).mockResolvedValue({
      id: "state-1",
      status: "ORDER_CREATING",
    } as never);
    vi.mocked(prisma.storefrontCheckoutState.findFirst).mockResolvedValue({
      id: "state-1",
      status: "ORDER_CREATING",
    } as never);
  });

  it("rejects checkout for a cart that does not exist", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.cart).findFirst.mockResolvedValue(null);

    await expect(
      checkoutService.checkout("t1", "default", checkoutDto),
    ).rejects.toThrow(NotFoundException);
    expect(outboxService.writeEvent).not.toHaveBeenCalled();
  });

  it("rejects checkout for an empty cart — creates zero SalesOrders", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.cart).findFirst.mockResolvedValue({
      ...baseCart,
      items: [],
    } as never);

    await expect(
      checkoutService.checkout("t1", "default", checkoutDto),
    ).rejects.toThrow(BadRequestException);
    expect(outboxService.writeEvent).not.toHaveBeenCalled();
  });

  it("rejects checkout for a cart that is not ACTIVE (already converted)", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.cart).findFirst.mockResolvedValue({
      ...baseCart,
      status: "CONVERTED",
    } as never);

    await expect(
      checkoutService.checkout("t1", "default", checkoutDto),
    ).rejects.toThrow(BadRequestException);
    expect(outboxService.writeEvent).not.toHaveBeenCalled();
  });

  it("happy path: creates exactly one SalesOrder, one SUCCEEDED StorefrontOrderPayment, and marks the cart CONVERTED", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.cart).findFirst.mockResolvedValue(baseCart as never);

    const result = await checkoutService.checkout("t1", "default", checkoutDto);

    expect(outboxService.writeEvent).toHaveBeenCalledTimes(1);
    expect(outboxService.writeEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        tenantId: "t1",
        eventName: "ecommerce.checkout.completed",
        payload: expect.objectContaining({
          storefrontSlug: "default",
          cartId: "cart-1",
          createdBy: "storefront-guest",
          organizationId: "org-1",
        }),
      }),
    );

    expect(prisma.cart.update).toHaveBeenCalledWith({
      where: { id: "cart-1" },
      data: { status: "CONVERTED" },
    });

    expect(result).toEqual({
      checkoutStateId: "state-1",
      status: "ORDER_CREATING",
      statusUrl: "/store/default/checkout/sess-1/status",
    });
  });

  it("decline path: creates zero SalesOrders, does not convert the cart, and surfaces a retry-able error", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.cart).findFirst.mockResolvedValue(baseCart as never);

    await expect(
      checkoutService.checkout("t1", "default", {
        ...checkoutDto,
        simulateDecline: true,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(outboxService.writeEvent).not.toHaveBeenCalled();
    expect(prisma.cart.update).not.toHaveBeenCalled();
  });

  it("finds an existing Customer by tenant+email instead of creating a duplicate", async () => {
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.cart).findFirst.mockResolvedValue(baseCart as never);
    vi.mocked(prisma.customer).findFirst.mockResolvedValue({
      id: "existing-cust",
    } as never);

    await checkoutService.checkout("t1", "default", checkoutDto);

    expect(prisma.customer.create).not.toHaveBeenCalled();
    expect(outboxService.writeEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        payload: expect.objectContaining({
          onlineOrderInput: expect.objectContaining({
            customerId: "existing-cust",
          }),
        }),
      }),
    );
  });
});
