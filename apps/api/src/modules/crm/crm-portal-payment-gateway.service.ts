import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppLogger } from '../../common/services/logger.service';

export interface PortalPaymentIntentResult {
  id: string;
  status: 'requires_confirmation' | 'succeeded' | 'failed';
}

/**
 * MOCK PAYMENT GATEWAY for customer-portal invoice payment collection (Up
 * Next item 37). No real network I/O, no real charge is ever made — every
 * result and log line is unmistakably labeled MOCK/`mock_gateway`, mirroring
 * the sanctioned pattern in `ecommerce/payments/mock-payment-gateway.service.ts`.
 * Re-implemented here (not imported) because CRM must not cross-import the
 * ecommerce module — see AGENTS.md "no cross-module imports".
 *
 * Swap-in-a-real-gateway seam: implement this same two-method shape (Stripe/
 * PayPal/etc.) and swap the provider in `crm.module.ts` — no other CRM code
 * needs to change.
 */
@Injectable()
export class CrmPortalPaymentGatewayService {
  private readonly logger = new AppLogger();
  readonly provider = 'mock_gateway';

  constructor() {
    this.logger.setContext('CrmPortalPaymentGatewayService');
  }

  async createIntent(amount: number, currency: string, metadata: Record<string, unknown>): Promise<PortalPaymentIntentResult> {
    const id = `mock_pi_${randomUUID()}`;
    this.logger.log(
      `[MOCK PAYMENT GATEWAY] createIntent id=${id} amount=${amount} currency=${currency} metadata=${JSON.stringify(metadata)}`,
    );
    return { id, status: 'requires_confirmation' };
  }

  async confirmIntent(intentId: string, simulateDecline = false): Promise<PortalPaymentIntentResult> {
    if (simulateDecline) {
      this.logger.warn(`[MOCK PAYMENT GATEWAY] confirmIntent DECLINED (test-mode) id=${intentId}`);
      return { id: intentId, status: 'failed' };
    }
    this.logger.log(`[MOCK PAYMENT GATEWAY] confirmIntent SUCCEEDED (no real charge) id=${intentId}`);
    return { id: intentId, status: 'succeeded' };
  }
}
