import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppLogger } from '../../../common/services/logger.service';
import type { PaymentGatewayAdapter, PaymentIntentResult } from './payment-gateway.interface';

/**
 * MOCK PAYMENT GATEWAY — MVP ONLY. No real network I/O, no real charge is ever
 * made. This class exists purely as the one sanctioned implementation of
 * `PaymentGatewayAdapter` for the storefront checkout flow
 * (.ai/ECOMMERCE_MODULE_REQUIREMENTS.md Section 3.2/4). It is unmistakably
 * labeled MOCK in its class name, every log line, and the `provider` field of
 * every result/record it produces — so nobody mistakes it for a real
 * integration and nobody can silently ship a "fake success" without it
 * showing up in logs/DB as `mock_gateway`.
 *
 * Swap-in-a-real-gateway seam: implement `PaymentGatewayAdapter` again (e.g.
 * `StripePaymentGatewayService`) and swap the provider in
 * `ecommerce.module.ts` — no other code in this module should need to change.
 */
@Injectable()
export class MockPaymentGatewayService implements PaymentGatewayAdapter {
  private readonly logger = new AppLogger();

  constructor() {
    this.logger.setContext('MockPaymentGatewayService');
  }

  async createIntent(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>,
  ): Promise<PaymentIntentResult> {
    const id = `mock_pi_${randomUUID()}`;
    this.logger.log(
      `[MOCK PAYMENT GATEWAY] createIntent id=${id} amount=${amount} currency=${currency} metadata=${JSON.stringify(metadata)}`,
    );
    return {
      id,
      status: 'requires_confirmation',
      clientSecret: `${id}_secret_mock`,
    };
  }

  async confirmIntent(intentId: string, simulateDecline = false): Promise<PaymentIntentResult> {
    if (simulateDecline) {
      this.logger.warn(`[MOCK PAYMENT GATEWAY] confirmIntent DECLINED (test-mode) id=${intentId}`);
      return { id: intentId, status: 'failed' };
    }
    this.logger.log(`[MOCK PAYMENT GATEWAY] confirmIntent SUCCEEDED (no real charge) id=${intentId}`);
    return { id: intentId, status: 'succeeded' };
  }

  async refund(intentId: string, amount: number): Promise<PaymentIntentResult> {
    this.logger.log(`[MOCK PAYMENT GATEWAY] refund id=${intentId} amount=${amount} (no real refund issued)`);
    return { id: intentId, status: 'refunded' };
  }
}
