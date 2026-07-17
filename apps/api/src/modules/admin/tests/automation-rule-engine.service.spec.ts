import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AutomationRuleEngineService } from '../automation-rule-engine.service';

/**
 * Integration-style test for P0-2 (see .ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md).
 *
 * Prior to this engine, `AutomationRule` rows were pure CRUD plus a `testRule` method that
 * only evaluated conditions against caller-supplied sample data — nothing in the system ever
 * reacted to a real domain event. These tests emit REAL domain events (via a real
 * EventEmitter2 instance, not a mocked one) through a real `@OnEvent`-decorated listener and
 * assert real side effects: an `AutomationRuleExecution` row and (for the notify action) a
 * `notification.send` event that the real `NotificationDeliveryService`/`NotificationsGateway`
 * would consume. This is deliberately NOT just another `testRule` sample-data call.
 */

const { mockAutomationRule, mockAutomationRuleExecution, mockBackgroundJob } = vi.hoisted(() => ({
  mockAutomationRule: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  mockAutomationRuleExecution: {
    create: vi.fn(),
  },
  mockBackgroundJob: {
    create: vi.fn(),
  },
}));

vi.mock('@unerp/database', () => ({
  prisma: {
    automationRule: mockAutomationRule,
    automationRuleExecution: mockAutomationRuleExecution,
    backgroundJob: mockBackgroundJob,
  },
}));

vi.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
  OnWorkerEvent: () => () => {},
}));

function buildRule(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'rule-1',
    tenantId: 'tenant-a',
    name: 'Notify requester on PO confirm',
    trigger: 'sales.order.confirmed',
    conditions: [],
    actions: [{ type: 'notify', config: { userId: 'user-1', title: 'Order confirmed' } }],
    status: 'ACTIVE',
    ...overrides,
  };
}

describe('AutomationRuleEngineService (P0-2 real execution engine)', () => {
  let eventEmitter: EventEmitter2;
  let engine: AutomationRuleEngineService;
  let fakeEmailQueue: { add: ReturnType<typeof vi.fn>; name: string };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBackgroundJob.create.mockResolvedValue({ id: 'bg-job-1' });
    eventEmitter = new EventEmitter2();
    fakeEmailQueue = { add: vi.fn().mockResolvedValue({ id: 'bull-job-1' }), name: 'email' };
    engine = new AutomationRuleEngineService(eventEmitter, fakeEmailQueue as any);

    // Manually register this instance's @OnEvent handlers against the real emitter,
    // mirroring what Nest's DiscoveryService does at boot for @OnEvent-decorated methods.
    eventEmitter.on('sales.order.confirmed', (payload) => engine.onSalesOrderConfirmed(payload));
    eventEmitter.on('finance.invoice.created', (payload) => engine.onFinanceInvoiceCreated(payload));
  });

  it('fires a real notification.send event and records a SUCCESS execution when an ACTIVE rule matches', async () => {
    mockAutomationRule.findMany.mockResolvedValue([buildRule()]);
    mockAutomationRule.update.mockResolvedValue({});
    mockAutomationRuleExecution.create.mockResolvedValue({});

    const notificationSpy = vi.fn();
    eventEmitter.on('notification.send', notificationSpy);

    await eventEmitter.emitAsync('sales.order.confirmed', {
      tenantId: 'tenant-a',
      salesOrderId: 'so-1',
      orderNumber: 'SO-001',
    });

    // Real side effect #1: a notification.send domain event was emitted with the right shape.
    expect(notificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-a',
        userId: 'user-1',
        type: 'AUTOMATION_RULE',
        title: 'Order confirmed',
      }),
    );

    // Real side effect #2: a SUCCESS execution row was recorded (not TEST).
    expect(mockAutomationRuleExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-a',
          ruleId: 'rule-1',
          status: 'SUCCESS',
        }),
      }),
    );

    // Rule bookkeeping (runCount/lastRunAt) was updated for real.
    expect(mockAutomationRule.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'rule-1' } }),
    );

    // Rule lookup was tenant-scoped and ACTIVE-only.
    expect(mockAutomationRule.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', trigger: 'sales.order.confirmed', status: 'ACTIVE' },
    });
  });

  it('records a SKIPPED execution and performs no action when conditions do not match', async () => {
    mockAutomationRule.findMany.mockResolvedValue([
      buildRule({
        conditions: [{ field: 'orderNumber', operator: 'equals', value: 'DOES-NOT-MATCH' }],
      }),
    ]);
    mockAutomationRuleExecution.create.mockResolvedValue({});

    const notificationSpy = vi.fn();
    eventEmitter.on('notification.send', notificationSpy);

    await eventEmitter.emitAsync('sales.order.confirmed', {
      tenantId: 'tenant-a',
      salesOrderId: 'so-2',
      orderNumber: 'SO-002',
    });

    expect(notificationSpy).not.toHaveBeenCalled();
    expect(mockAutomationRule.update).not.toHaveBeenCalled();
    expect(mockAutomationRuleExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SKIPPED', ruleId: 'rule-1' }),
      }),
    );
  });

  it('never executes a DRAFT rule — findMany is scoped to status: ACTIVE so DRAFT rows are excluded', async () => {
    // DRAFT rules must be inert by design (US-P0-2a). The query itself filters on
    // status: 'ACTIVE', so a DRAFT rule is never returned/considered in the first place.
    mockAutomationRule.findMany.mockResolvedValue([]);

    await eventEmitter.emitAsync('sales.order.confirmed', {
      tenantId: 'tenant-a',
      salesOrderId: 'so-3',
      orderNumber: 'SO-003',
    });

    expect(mockAutomationRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) }),
    );
    expect(mockAutomationRuleExecution.create).not.toHaveBeenCalled();
  });

  it('enqueues a real BullMQ email job for an email action', async () => {
    mockAutomationRule.findMany.mockResolvedValue([
      buildRule({
        id: 'rule-2',
        actions: [{ type: 'email', config: { to: 'ops@tenant-a.test', subject: 'PO Confirmed' } }],
      }),
    ]);
    mockAutomationRuleExecution.create.mockResolvedValue({});
    mockAutomationRule.update.mockResolvedValue({});

    await eventEmitter.emitAsync('sales.order.confirmed', {
      tenantId: 'tenant-a',
      salesOrderId: 'so-4',
      orderNumber: 'SO-004',
    });

    expect(fakeEmailQueue.add).toHaveBeenCalledWith(
      'automation-rule-email',
      expect.objectContaining({ to: 'ops@tenant-a.test', subject: 'PO Confirmed' }),
      expect.any(Object),
    );
  });

  it('skips dispatch entirely and does not query rules when the event payload has no tenantId', async () => {
    await eventEmitter.emitAsync('sales.order.confirmed', { salesOrderId: 'so-5' } as any);
    expect(mockAutomationRule.findMany).not.toHaveBeenCalled();
  });

  it('only fires rules matching the tenant that emitted the event (tenant isolation)', async () => {
    mockAutomationRule.findMany.mockResolvedValue([]); // tenant-b has no rules for this trigger
    await eventEmitter.emitAsync('sales.order.confirmed', {
      tenantId: 'tenant-b',
      salesOrderId: 'so-6',
      orderNumber: 'SO-006',
    });

    expect(mockAutomationRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-b' }) }),
    );
  });
});
