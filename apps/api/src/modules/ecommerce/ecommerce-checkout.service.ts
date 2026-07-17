import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '@unerp/database';
import * as crypto from 'crypto';
import { SalesService, CreateOnlineOrderInput } from '../sales/sales.service';
import { PaymentGatewayAdapter } from './payments/payment-gateway.interface';
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
 */
@Injectable()
export class EcommerceCheckoutService {
  private readonly logger = new AppLogger();

  constructor(
    private readonly salesService: SalesService,
    @Inject('PAYMENT_GATEWAY') private readonly paymentGateway: PaymentGatewayAdapter,
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
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone || '',
      shippingStreet: dto.shippingAddress.street,
      shippingCity: dto.shippingAddress.city,
      shippingState: dto.shippingAddress.state,
      shippingZip: dto.shippingAddress.zip,
      shippingCountry: dto.shippingAddress.country,
      notes: dto.notes || '',
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
        provider: this.paymentGateway.constructor.name === 'StripePaymentGatewayService' ? 'stripe' : 'mock_gateway',
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

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<any> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
      this.logger.warn('Stripe webhook signature verification skipped: STRIPE_WEBHOOK_SECRET is not configured.');
    } else {
      const verified = this.verifyStripeSignature(rawBody, signature, webhookSecret);
      if (!verified) {
        this.logger.error('Stripe webhook signature verification failed.');
        throw new BadRequestException('Invalid webhook signature.');
      }
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    this.logger.log(`Received Stripe Webhook event: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      return this.completePaymentFromIntent(paymentIntent);
    }

    return { received: true };
  }

  private verifyStripeSignature(rawBody: Buffer, signature: string, secret: string): boolean {
    try {
      const parts = signature.split(',');
      const tPart = parts.find((p) => p.startsWith('t='));
      const v1Part = parts.find((p) => p.startsWith('v1='));
      if (!tPart || !v1Part) return false;
      const t = tPart.split('=')[1];
      const v1 = v1Part.split('=')[1];
      if (!t || !v1) return false;

      const signedPayload = `${t}.${rawBody.toString('utf8')}`;
      const computedHmac = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(computedHmac, 'hex'),
        Buffer.from(v1, 'hex'),
      );
    } catch {
      return false;
    }
  }

  private async completePaymentFromIntent(paymentIntent: any) {
    const intentId = paymentIntent.id;

    // Check for existing payment to prevent duplicate processing (idempotency)
    const existingPayment = await prisma.storefrontOrderPayment.findFirst({
      where: { providerIntentId: intentId },
    });
    if (existingPayment) {
      this.logger.log(`Stripe PaymentIntent ${intentId} was already processed. Skipping.`);
      return { success: true, duplicate: true };
    }

    const metadata = paymentIntent.metadata || {};
    const cartId = metadata.cartId;
    if (!cartId) {
      this.logger.warn(`Stripe PaymentIntent ${intentId} has no cartId in metadata. Skipping order creation.`);
      return { success: true, skipped: true };
    }

    const cart = await prisma.cart.findFirst({
      where: { id: cartId },
      include: { items: { include: { productListing: { include: { product: true } } } } },
    });
    if (!cart) {
      throw new NotFoundException(`Cart ${cartId} associated with PaymentIntent ${intentId} not found.`);
    }

    if (cart.status === 'CONVERTED') {
      this.logger.log(`Cart ${cartId} is already converted. Skipping.`);
      return { success: true, duplicate: true };
    }

    const tenantId = cart.tenantId;
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    if (!org) {
      throw new BadRequestException(`No Organization found for Tenant ${tenantId}`);
    }

    // Extract checkout details from metadata or defaults
    const customerName = metadata.customerName || 'Guest Customer';
    const customerEmail = metadata.customerEmail || paymentIntent.receipt_email || 'guest@example.com';
    const customerPhone = metadata.customerPhone || null;
    const street = metadata.shippingStreet || 'N/A';
    const city = metadata.shippingCity || 'N/A';
    const state = metadata.shippingState || 'N/A';
    const zip = metadata.shippingZip || 'N/A';
    const country = metadata.shippingCountry || 'US';
    const notes = metadata.notes || null;

    const checkoutDto: CheckoutDto = {
      sessionToken: cart.sessionToken,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress: { street, city, state, zip, country },
      notes,
    };

    const customer = await this.findOrCreateGuestCustomer(tenantId, org.id, checkoutDto);
    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity, 0);
    const orderNumber = `ONL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const onlineOrderInput: CreateOnlineOrderInput = {
      customerId: customer.id,
      orderNumber,
      salesChannel: 'ONLINE',
      paymentStatus: 'PAID',
      notes,
      shippingAddress: checkoutDto.shippingAddress,
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

    await prisma.storefrontOrderPayment.create({
      data: {
        tenantId,
        salesOrderId: salesOrder.id,
        provider: 'stripe',
        providerIntentId: intentId,
        status: 'SUCCEEDED',
        amount: subtotal,
        currency: cart.currency,
        rawResponse: paymentIntent,
      },
    });

    await prisma.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } });

    this.logger.log(`Asynchronously converted cart ${cartId} to order ${salesOrder.id} via webhook.`);

    return {
      success: true,
      orderId: salesOrder.id,
      orderNumber: salesOrder.orderNumber,
    };
  }
}
