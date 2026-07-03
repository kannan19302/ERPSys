import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { SalesService, CreateOnlineOrderInput } from '../sales/sales.service';
import { MockPaymentGatewayService } from './payments/mock-payment-gateway.service';
import { CheckoutDto } from './dto/ecommerce.dto';
import { AppLogger } from '../../common/services/logger.service';

/** Sentinel `createdBy`/`User` id for guest storefront checkouts — there is no
 * internal UniERP user to attribute the order to. See the comment on
 * `SalesService.createConfirmedOnlineOrder` in sales.service.ts. */
const STOREFRONT_GUEST_CREATED_BY = 'storefront-guest';

/**
 * Checkout/payment orchestration for the storefront's public
 * `POST store/:tenantSlug/checkout` route. See
 * .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Flow C.
 *
 * Deliberately does NOT write to `SalesOrder`/`SalesOrderItem` directly —
 * that write path belongs to the Sales module (`SalesService`), consistent
 * with "no cross-module Prisma reach-through for models this module doesn't
 * own." This service only owns `Cart`/`CartItem`/`StorefrontOrderPayment`,
 * and reads/creates `Customer` directly (an established, existing pattern —
 * `sales.service.ts` itself reads/writes `Customer` via plain Prisma calls,
 * since `Customer` is a shared core entity, not a CRM-module implementation
 * detail hidden behind a service boundary).
 */
@Injectable()
export class EcommerceCheckoutService {
  private readonly logger = new AppLogger();

  constructor(
    private readonly salesService: SalesService,
    private readonly paymentGateway: MockPaymentGatewayService,
  ) {
    this.logger.setContext('EcommerceCheckoutService');
  }

  async checkout(tenantId: string, dto: CheckoutDto) {
    const cart = await prisma.cart.findFirst({
      where: { tenantId, sessionToken: dto.sessionToken },
      include: { items: { include: { productListing: { include: { product: true } } } } },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    if (cart.status !== 'ACTIVE') {
      throw new BadRequestException(`Cart is ${cart.status.toLowerCase()} and cannot be checked out`);
    }
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const org = await prisma.organization.findFirst({ where: { tenantId } });
    if (!org) throw new BadRequestException('No Organization found for this Tenant.');

    const customer = await this.findOrCreateGuestCustomer(tenantId, org.id, dto);

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity, 0);

    const orderNumber = `ONL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1. Create the payment intent up front against the cart subtotal.
    const intent = await this.paymentGateway.createIntent(subtotal, cart.currency, {
      tenantId,
      cartId: cart.id,
      sessionToken: cart.sessionToken,
    });

    // 2. "Confirm" the mock intent — this is the only step that can decline.
    const confirmed = await this.paymentGateway.confirmIntent(intent.id, dto.simulateDecline ?? false);

    if (confirmed.status !== 'succeeded') {
      // No SalesOrder is created on decline (Flow C's decline path,
      // .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Section 5). There is no
      // SalesOrder yet to attach a StorefrontOrderPayment to, so the failed
      // attempt is logged rather than persisted as an orphaned payment row —
      // StorefrontOrderPayment.salesOrderId is a required FK.
      this.logger.warn(`[MOCK PAYMENT GATEWAY] checkout declined tenantId=${tenantId} cartId=${cart.id}`);
      throw new BadRequestException('Payment was declined. Please try again.');
    }

    // 3. Payment succeeded — now create the real SalesOrder via the Sales
    // module's own service (never a direct prisma.salesOrder.create here).
    const onlineOrderInput: CreateOnlineOrderInput = {
      customerId: customer.id,
      orderNumber,
      salesChannel: 'ONLINE',
      paymentStatus: 'PAID',
      notes: dto.notes,
      shippingAddress: dto.shippingAddress,
      lineItems: cart.items.map((item) => ({
        productId: item.productListing.productId,
        description: item.productListing.displayName || item.productListing.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPriceSnapshot),
        taxRate: 0,
      })),
    };

    const salesOrder = await this.salesService.createConfirmedOnlineOrder(
      tenantId,
      org.id,
      onlineOrderInput,
      STOREFRONT_GUEST_CREATED_BY,
    );

    // 4. Record the StorefrontOrderPayment ledger row.
    await prisma.storefrontOrderPayment.create({
      data: {
        tenantId,
        salesOrderId: salesOrder.id,
        provider: 'mock_gateway',
        providerIntentId: intent.id,
        status: 'SUCCEEDED',
        amount: subtotal,
        currency: cart.currency,
        rawResponse: confirmed as unknown as object,
      },
    });

    // 5. Mark the cart CONVERTED so it can't be checked out again.
    await prisma.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } });

    // NOTE: `sales.order.confirmed` is emitted by
    // `SalesService.createConfirmedOnlineOrder` itself (step 3) — this method
    // deliberately does not re-emit it, to avoid Finance/automation listeners
    // double-processing the same order.

    return {
      orderId: salesOrder.id,
      orderNumber: salesOrder.orderNumber,
      status: salesOrder.status,
      totalAmount: Number(salesOrder.totalAmount),
      currency: cart.currency,
    };
  }

  private async findOrCreateGuestCustomer(tenantId: string, orgId: string, dto: CheckoutDto) {
    const existing = await prisma.customer.findFirst({
      where: { tenantId, orgId, email: dto.customerEmail },
    });
    if (existing) return existing;

    return prisma.customer.create({
      data: {
        tenantId,
        orgId,
        type: 'INDIVIDUAL',
        name: dto.customerName,
        email: dto.customerEmail,
        phone: dto.customerPhone || null,
        shippingAddress: dto.shippingAddress,
        status: 'ACTIVE',
      },
    });
  }
}
