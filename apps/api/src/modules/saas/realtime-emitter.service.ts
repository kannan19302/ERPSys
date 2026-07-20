import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { SaasGateway } from "./saas.gateway";

@Injectable()
export class RealtimeEmitterService {
  constructor(
    @Inject(forwardRef(() => SaasGateway))
    private readonly gateway: SaasGateway,
  ) {}

  emitUsageUpdate(
    tenantId: string,
    data: {
      metric: string;
      current: number;
      limit: number;
      pct: number;
    },
  ) {
    this.gateway.emitUsageUpdate(tenantId, data);
  }

  emitBillingEvent(
    tenantId: string,
    event: "invoice" | "payment",
    data: Record<string, unknown>,
  ) {
    if (event === "invoice") {
      this.gateway.emitBillingInvoice(tenantId, data as any);
    } else if (event === "payment") {
      this.gateway.emitBillingPayment(tenantId, data as any);
    }
  }

  emitAlert(
    tenantId: string,
    data: {
      alertId: string;
      type: string;
      severity: string;
      message: string;
      metric?: string;
      currentValue?: number;
      threshold?: number;
    },
  ) {
    this.gateway.emitAlert(tenantId, data);
  }

  emitActivity(
    tenantId: string,
    data: {
      userId: string;
      userName: string;
      action: string;
      resource: string;
      details?: string;
      timestamp: string;
    },
  ) {
    this.gateway.emitActivity(tenantId, data);
  }

  emitSubscriptionChange(
    tenantId: string,
    data: {
      planId: string;
      planName: string;
      status: string;
      previousPlan?: string;
      effectiveDate: string;
    },
  ) {
    this.gateway.emitSubscriptionChange(tenantId, data);
  }

  emitAnnouncement(data: {
    id: string;
    title: string;
    body: string;
    priority: string;
    publishedAt: string;
  }) {
    this.gateway.emitAnnouncement(data);
  }
}
