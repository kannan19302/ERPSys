import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { OutboxService, type OutboxTxClient } from '@unerp/shared';
import { PaymentGatewayAdapter } from './payments/payment-gateway.interface';
import { CheckoutDto } from './dto/ecommerce.dto';
import { AppLogger } from '../../common/services/logger.service';

/** Sentinel `createdBy`/`User` id for guest storefront checkouts. */
const STOREFRONT_GUEST_CREATED_BY = 'storefront-guest';

/**
 * Payload shape written to the outbox for the `ecommerce.checkout.completed`
 * event.  Consumed by `SalesOutboxHandler` in the Sales module.
 */
interface CheckoutOutboxPayload {
  storefrontSlug: string;
  cartId: string;
  onlineOrderInput: {
    customerId: string;
    orderNumber: string;
    salesChannel: 'ONLINE';
    paymentStatus: 'PAID';
    paymentMethod?: string;
    notes: string | null;
    shippingAddress: { street: string; city: string; state: string; zip: string; country: string };
    lineItems: Array<{
      productId: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>;
  };
  createdBy: string;
  organizationId: string;
  paymentInfo: {
    provider: string;
    providerIntentId: string;
    amount: number;
    currency: string;
    rawResponse: Record<string, unknown>;
  };
}

/**
 * Checkout/payment orchestration for the storefront's public
 * `POST store/:tenantSlug/checkout` route.  Instead of calling the Sales
 * module synchronously, this service writes a `StorefrontCheckoutState` row
 * and an `ecommerce.checkout.completed` outbox event inside a single
 * transaction — the Sales consumer handler creates the real order
 * asynchronously.
 */
@Injectable()
export class EcommerceCheckoutService {
  private readonly logger = new AppLogger();

  constructor(
    private readonly outboxService: OutboxService,
    @Inject('PAYMENT_GATEWAY') private readonly paymentGateway: PaymentGatewayAdapter,
  ) {
    this.logger.setContext('EcommerceCheckoutService');
  }

  async checkout(tenantId: string, storefrontSlug: string, dto: CheckoutDto) {
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
      this.logger.warn(`[MOCK PAYMENT GATEWAY] checkout declined tenantId=${tenantId} cartId=${cart.id}`);
      throw new BadRequestException('Payment was declined. Please try again.');
    }

    // 3. Payment succeeded — write checkout state + outbox event inside a
    // single transaction.  The Sales consumer handler will pick up the event
    // and create the SalesOrder + StorefrontOrderPayment asynchronously.
    const onlineOrderInput = {
      customerId: customer.id,
      orderNumber,
      salesChannel: 'ONLINE' as const,
      paymentStatus: 'PAID' as const,
      notes: dto.notes || null,
      shippingAddress: dto.shippingAddress,
      lineItems: cart.items.map((item) => ({
        productId: item.productListing.productId,
        description: item.productListing.displayName || item.productListing.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPriceSnapshot),
        taxRate: 0,
      })),
    };

    const provider = this.paymentGateway.constructor.name === 'StripePaymentGatewayService' ? 'stripe' : 'mock_gateway';

    const checkoutState = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const state = await tx.storefrontCheckoutState.create({
        data: {
          tenantId,
          storefrontSlug,
          cartId: cart.id,
          status: 'ORDER_CREATING',
        },
      });

      const payload: CheckoutOutboxPayload = {
        storefrontSlug,
        cartId: cart.id,
        onlineOrderInput,
        createdBy: STOREFRONT_GUEST_CREATED_BY,
        organizationId: org.id,
        paymentInfo: {
          provider,
          providerIntentId: intent.id,
          amount: subtotal,
          currency: cart.currency,
          rawResponse: confirmed as unknown as Record<string, unknown>,
        },
      };

      await this.outboxService.writeEvent(tx as unknown as OutboxTxClient, {
        tenantId,
        eventName: 'ecommerce.checkout.completed',
        eventVersion: 1,
        aggregateType: 'storefront_checkout',
        aggregateId: state.id,
        payload: payload as unknown as Record<string, unknown>,
        correlationId: cart.id,
      });

      await tx.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } });

      return state;
    });

    // NOTE: The outbox event `ecommerce.checkout.completed` will be picked up
    // by the dispatcher/processor, which delegates to `SalesOutboxHandler`.
    // That handler calls `SalesService.createConfirmedOnlineOrder`, records
    // the `StorefrontOrderPayment`, and updates this checkout state to
    // ORDER_COMPLETED (or ORDER_FAILED on error).

    return {
      checkoutStateId: checkoutState.id,
      status: checkoutState.status,
      statusUrl: `/store/${storefrontSlug}/checkout/${cart.sessionToken}/status`,
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

  async getCheckoutStateBySession(tenantId: string, sessionToken: string): Promise<{
    status: string;
    salesOrderId: string | null;
    errorMessage: string | null;
  } | null> {
    const cart = await prisma.cart.findFirst({ where: { tenantId, sessionToken } });
    if (!cart) return null;
    return this.getCheckoutState(tenantId, cart.id);
  }

  async getCheckoutState(tenantId: string, cartId: string): Promise<{
    status: string;
    salesOrderId: string | null;
    errorMessage: string | null;
  } | null> {
    const state = await prisma.storefrontCheckoutState.findFirst({
      where: { tenantId, cartId },
      orderBy: { createdAt: 'desc' },
    });
    if (!state) return null;
    return {
      status: state.status,
      salesOrderId: state.salesOrderId,
      errorMessage: state.errorMessage,
    };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string, storefrontSlug: string): Promise<any> {
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
      return this.completePaymentFromIntent(paymentIntent, storefrontSlug);
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

  private async completePaymentFromIntent(paymentIntent: any, storefrontSlug: string) {
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

    // Check for existing checkout state to prevent duplicate outbox writes
    const existingState = await prisma.storefrontCheckoutState.findFirst({
      where: { cartId, tenantId: metadata.tenantId },
    });
    if (existingState) {
      this.logger.log(`Cart ${cartId} already has a checkout state. Skipping.`);
      return { success: true, duplicate: true };
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

    const onlineOrderInput = {
      customerId: customer.id,
      orderNumber,
      salesChannel: 'ONLINE' as const,
      paymentStatus: 'PAID' as const,
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

    const checkoutState = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const state = await tx.storefrontCheckoutState.create({
        data: {
          tenantId,
          storefrontSlug,
          cartId: cart.id,
          status: 'ORDER_CREATING',
        },
      });

      const payload: CheckoutOutboxPayload = {
        storefrontSlug,
        cartId: cart.id,
        onlineOrderInput,
        createdBy: STOREFRONT_GUEST_CREATED_BY,
        organizationId: org.id,
        paymentInfo: {
          provider: 'stripe',
          providerIntentId: intentId,
          amount: subtotal,
          currency: cart.currency,
          rawResponse: paymentIntent,
        },
      };

      await this.outboxService.writeEvent(tx as unknown as OutboxTxClient, {
        tenantId,
        eventName: 'ecommerce.checkout.completed',
        eventVersion: 1,
        aggregateType: 'storefront_checkout',
        aggregateId: state.id,
        payload: payload as unknown as Record<string, unknown>,
        correlationId: cart.id,
      });

      await tx.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } });

      return state;
    });

    this.logger.log(`Webhook converted cart ${cartId} to outbox event (checkout state ${checkoutState.id})`);

    return {
      success: true,
      checkoutStateId: checkoutState.id,
      status: checkoutState.status,
    };
  }
}
