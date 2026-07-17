/**
 * PaymentGatewayAdapter — shaped like Stripe's PaymentIntent API so a real
 * gateway (Stripe/PayPal/etc.) is a drop-in swap for MVP's mock implementation.
 * See .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Section 3.2 ("Real payment gateway
 * wiring... is an explicit fast-follow") and Section 4 (`StorefrontOrderPayment`).
 */

export interface PaymentIntentResult {
  id: string;
  status: 'requires_confirmation' | 'succeeded' | 'failed' | 'refunded';
  clientSecret?: string;
}

export interface PaymentGatewayAdapter {
  createIntent(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>,
  ): Promise<PaymentIntentResult>;

  confirmIntent(intentId: string, simulateDecline?: boolean): Promise<PaymentIntentResult>;

  refund(intentId: string, amount: number): Promise<PaymentIntentResult>;
}
