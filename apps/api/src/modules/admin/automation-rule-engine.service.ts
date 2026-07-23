import { Injectable, Logger } from "@nestjs/common";
import { OnEvent, EventEmitter2 } from "@nestjs/event-emitter";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { prisma } from "@unerp/database";
import { AutomationRulesService } from "./automation-rules.service";
import { enqueueTrackedJob } from "../../common/queues/job-tracking.util";

/**
 * Domain events already emitted elsewhere in apps/api/src that this engine reacts to.
 * Confirmed via grep of `eventEmitter.emit(...)` call sites — no new event names invented.
 * See .ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md P0-2 and .ai/ADMIN_SECURITY_AUDIT.md.
 *
 *   sales.order.confirmed        (sales.service.ts)
 *   sales.delivery.created       (sales.service.ts)
 *   sales.return.created         (sales.service.ts)
 *   sales.return.processed       (sales.service.ts)
 *   sales.return.refunded        (sales.service.ts)
 *   procurement.receipt.created  (procurement.service.ts)
 *   procurement.return.created   (procurement.service.ts)
 *   finance.invoice.created      (finance.service.ts)
 *   finance.invoice.sent         (finance.service.ts)
 *   finance.payment.received     (finance.service.ts)
 *   hr.employee.onboarded        (hr.service.ts)
 *
 * Every payload above carries `tenantId`, which this engine uses to scope rule lookup
 * so a rule can only ever fire against events from its own tenant.
 */
const SUPPORTED_TRIGGER_EVENTS = [
  "sales.order.confirmed",
  "sales.delivery.created",
  "sales.return.created",
  "sales.return.processed",
  "sales.return.refunded",
  "procurement.receipt.created",
  "procurement.return.created",
  "finance.invoice.created",
  "finance.invoice.sent",
  "finance.payment.received",
  "hr.employee.onboarded",
] as const;

type SupportedTriggerEvent = (typeof SUPPORTED_TRIGGER_EVENTS)[number];

interface DomainEventPayload {
  tenantId: string;
  [key: string]: unknown;
}

/**
 * Real trigger -> condition -> action runtime for Automation Rules (P0-2).
 *
 * Prior to this, `AutomationRule` rows were pure CRUD plus a `testRule` method that only
 * evaluated conditions against caller-supplied sample data — nothing in the system ever
 * reacted to a real domain event. This service closes that gap for the trigger types the
 * schema already models (the `trigger` column is a free-form string; this pass wires the
 * subset of trigger values that map 1:1 onto already-emitted domain events above).
 *
 * Scope (per P0-2): synchronous in-process execution via the existing EventEmitter2 — no
 * new queue/dispatcher infra. Only two action types have a real downstream this pass:
 *   - `notify` / `notification`: emits `notification.send`, consumed by
 *     NotificationDeliveryService + NotificationsGateway (no direct cross-module import).
 *   - `email`: enqueues a real BullMQ job onto the existing `email` queue.
 * Any other action `type` is recorded in the execution result but not executed (P2 follow-up
 * per the completion requirements doc — webhooks/cross-module writes are out of scope here).
 */
@Injectable()
export class AutomationRuleEngineService {
  private readonly logger = new Logger(AutomationRuleEngineService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue("email") private readonly emailQueue: Queue,
  ) {}

  @OnEvent("sales.order.confirmed")
  async onSalesOrderConfirmed(payload: DomainEventPayload) {
    await this.runTriggersFor("sales.order.confirmed", payload);
  }

  @OnEvent("sales.delivery.created")
  async onSalesDeliveryCreated(payload: DomainEventPayload) {
    await this.runTriggersFor("sales.delivery.created", payload);
  }

  @OnEvent("sales.return.created")
  async onSalesReturnCreated(payload: DomainEventPayload) {
    await this.runTriggersFor("sales.return.created", payload);
  }

  @OnEvent("sales.return.processed")
  async onSalesReturnProcessed(payload: DomainEventPayload) {
    await this.runTriggersFor("sales.return.processed", payload);
  }

  @OnEvent("sales.return.refunded")
  async onSalesReturnRefunded(payload: DomainEventPayload) {
    await this.runTriggersFor("sales.return.refunded", payload);
  }

  @OnEvent("procurement.receipt.created")
  async onProcurementReceiptCreated(payload: DomainEventPayload) {
    await this.runTriggersFor("procurement.receipt.created", payload);
  }

  @OnEvent("procurement.return.created")
  async onProcurementReturnCreated(payload: DomainEventPayload) {
    await this.runTriggersFor("procurement.return.created", payload);
  }

  @OnEvent("finance.invoice.created")
  async onFinanceInvoiceCreated(payload: DomainEventPayload) {
    await this.runTriggersFor("finance.invoice.created", payload);
  }

  @OnEvent("finance.invoice.sent")
  async onFinanceInvoiceSent(payload: DomainEventPayload) {
    await this.runTriggersFor("finance.invoice.sent", payload);
  }

  @OnEvent("finance.payment.received")
  async onFinancePaymentReceived(payload: DomainEventPayload) {
    await this.runTriggersFor("finance.payment.received", payload);
  }

  @OnEvent("hr.employee.onboarded")
  async onHrEmployeeOnboarded(payload: DomainEventPayload) {
    await this.runTriggersFor("hr.employee.onboarded", payload);
  }

  /**
   * Core runtime: loads ACTIVE rules for this tenant matching the trigger, evaluates
   * conditions, executes actions for real, and records an execution row.
   */
  private async runTriggersFor(
    trigger: SupportedTriggerEvent,
    payload: DomainEventPayload,
  ) {
    const { tenantId } = payload;
    if (!tenantId) {
      this.logger.warn(
        `Received "${trigger}" event with no tenantId — skipping automation dispatch`,
      );
      return;
    }

    // DRAFT (and any other non-ACTIVE status, e.g. PAUSED) rules are inert by design.
    const rules = await prisma.automationRule.findMany({
      where: { tenantId, trigger, status: "ACTIVE" },
    });

    for (const rule of rules) {
      try {
        await this.executeRule(rule, payload);
      } catch (err) {
        // A single malformed/misbehaving rule must never abort processing of its
        // siblings in the same trigger batch, and must never vanish from the audit
        // trail (US-P0-2b) just because it failed before reaching its own execution
        // row write. Record the failure here and move on to the next rule.
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Automation rule ${rule.id} failed before execution: ${errorMessage}`,
        );
        await prisma.automationRuleExecution.create({
          data: {
            tenantId: rule.tenantId,
            ruleId: rule.id,
            status: "FAILED",
            triggerData: payload as any,
            result: { reason: "rule_evaluation_error" },
            error: errorMessage,
          },
        });
      }
    }
  }

  private async executeRule(
    rule: {
      id: string;
      tenantId: string;
      conditions: unknown;
      actions: unknown;
    },
    payload: DomainEventPayload,
  ) {
    const startTime = Date.now();
    // `conditions`/`actions` are schema-less Prisma Json columns. `null`/`undefined` are a
    // legitimate "no conditions" rule (always matches). Any other non-array value (e.g. `{}`,
    // a string) is a malformed rule — fail loudly (caught by the caller, recorded as FAILED)
    // rather than silently treating it as "no conditions" and running actions on bad config.
    if (rule.conditions != null && !Array.isArray(rule.conditions)) {
      throw new Error(
        `Rule ${rule.id} has malformed conditions (expected an array, got ${typeof rule.conditions})`,
      );
    }
    if (rule.actions != null && !Array.isArray(rule.actions)) {
      throw new Error(
        `Rule ${rule.id} has malformed actions (expected an array, got ${typeof rule.actions})`,
      );
    }
    const conditions = (rule.conditions as any[]) ?? [];
    const actions = (rule.actions as any[]) ?? [];

    const { matchedConditions, allConditionsMet } =
      AutomationRulesService.evaluateConditions(conditions, payload);

    if (!allConditionsMet) {
      await prisma.automationRuleExecution.create({
        data: {
          tenantId: rule.tenantId,
          ruleId: rule.id,
          status: "SKIPPED",
          triggerData: payload as any,
          result: {
            matchedConditions,
            allConditionsMet,
            reason: "conditions_not_met",
          },
          durationMs: Date.now() - startTime,
        },
      });
      return;
    }

    const actionResults: Array<{
      type: string;
      executed: boolean;
      detail?: string;
    }> = [];
    let hadError = false;
    let errorMessage: string | undefined;

    for (const action of actions) {
      try {
        const result = await this.executeAction(rule.tenantId, action, payload);
        actionResults.push(result);
      } catch (err) {
        hadError = true;
        errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Automation rule ${rule.id} action "${action?.type}" failed: ${errorMessage}`,
        );
        actionResults.push({
          type: action?.type ?? "unknown",
          executed: false,
          detail: errorMessage,
        });
      }
    }

    await prisma.automationRule.update({
      where: { id: rule.id },
      data: {
        runCount: { increment: 1 },
        lastRunAt: new Date(),
      },
    });

    await prisma.automationRuleExecution.create({
      data: {
        tenantId: rule.tenantId,
        ruleId: rule.id,
        status: hadError ? "FAILED" : "SUCCESS",
        triggerData: payload as any,
        result: { matchedConditions, allConditionsMet, actionResults },
        durationMs: Date.now() - startTime,
        error: errorMessage,
      },
    });
  }

  /**
   * Executes a single action for real. Only `notify`/`notification` and `email` have a
   * real downstream this pass (per P0-2 scope) — every other action type is recorded as
   * not-executed rather than silently dropped, so execution history stays honest.
   */
  private async executeAction(
    tenantId: string,
    action: { type?: string; config?: Record<string, unknown> },
    payload: DomainEventPayload,
  ): Promise<{ type: string; executed: boolean; detail?: string }> {
    const type = (action?.type ?? "").toLowerCase();
    const config = action?.config ?? {};

    switch (type) {
      case "notify":
      case "notification":
      case "send_notification": {
        const userId =
          (config.userId as string | undefined) ??
          (payload.userId as string | undefined);
        if (!userId) {
          return {
            type,
            executed: false,
            detail: "No target userId resolved for notification action",
          };
        }
        this.eventEmitter.emit("notification.send", {
          tenantId,
          userId,
          type: "AUTOMATION_RULE",
          title:
            (config.title as string | undefined) ?? "Automation rule triggered",
          body: (config.body as string | undefined) ?? "",
          channel: (config.channel as string | undefined) ?? "IN_APP",
        });
        return { type, executed: true };
      }

      case "email":
      case "send_email": {
        const to =
          (config.to as string | undefined) ??
          (payload.email as string | undefined);
        if (!to) {
          return {
            type,
            executed: false,
            detail: "No recipient email resolved for email action",
          };
        }
        const { bullJobId } = await enqueueTrackedJob(this.emailQueue, {
          tenantId,
          jobType: "automation-rule-email",
          payload: {
            to,
            subject:
              (config.subject as string | undefined) ??
              "Automation rule notification",
            body: (config.body as string | undefined) ?? "",
            tenantId,
          },
        });
        return { type, executed: true, detail: `bullJobId=${bullJobId}` };
      }

      default:
        return {
          type: type || "unknown",
          executed: false,
          detail: "Action type has no real downstream in this pass",
        };
    }
  }
}
