import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AutomationRuleEngineService } from '../automation-rule-engine.service';

/**
 * QA independent verification of P0-2 gaps NOT covered by
 * `automation-rule-engine.service.spec.ts` (see .ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md).
 *
 * Pushback note on existing coverage: `automation-rule-engine.service.spec.ts`'s
 * "only fires rules matching the tenant that emitted the event (tenant isolation)" test
 * (line 193-204) mocks `prisma.automationRule.findMany` to unconditionally resolve `[]`
 * and then asserts only that the `where` clause *argument* contained the right `tenantId`.
 * Because Prisma itself is fully mocked, that test can never fail even if the engine
 * stopped filtering by tenant entirely (e.g. if a future refactor accidentally queried
 * ALL tenants' rules and filtered client-side, or worse, executed a tenant-B event against
 * a tenant-A rule) — it is an argument-shape assertion, not a real isolation proof. It is
 * useful as a smoke test but is not a substitute for a negative test with real records for
 * two tenants where cross-tenant leakage is actually possible in principle and is disproven
 * empirically.
 *
 * This file replaces the mocked-away Prisma with a fake in-memory automationRule "table"
 * that performs the SAME filtering `findMany({ where })` would need to perform for real,
 * seeded with rules for BOTH tenant-a and tenant-b using the SAME trigger name. If the
 * engine's tenant scoping were broken (e.g. a stray `OR` or a forgotten `tenantId` in the
 * where clause), a rule belonging to tenant A would fire off a tenant B event and this test
 * would catch it — the previous test could not.
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

interface FakeRule {
  id: string;
  tenantId: string;
  trigger: string;
  status: string;
  conditions: unknown;
  actions: unknown;
}

/** A minimal in-memory "database" that performs real filtering, unlike a bare mock resolving a fixed value. */
function seedFakeDb(rules: FakeRule[]) {
  mockAutomationRule.findMany.mockImplementation(
    async ({ where }: { where: { tenantId: string; trigger: string; status: string } }) => {
      return rules.filter(
        (r) => r.tenantId === where.tenantId && r.trigger === where.trigger && r.status === where.status,
      );
    },
  );
}

function buildRule(overrides: Partial<FakeRule> = {}): FakeRule {
  return {
    id: 'rule-1',
    tenantId: 'tenant-a',
    trigger: 'sales.order.confirmed',
    status: 'ACTIVE',
    conditions: [],
    actions: [{ type: 'notify', config: { userId: 'user-1', title: 'Order confirmed' } }],
    ...overrides,
  };
}

describe('AutomationRuleEngineService — genuine tenant isolation (real filtering, not a mocked-away Prisma)', () => {
  let eventEmitter: EventEmitter2;
  let engine: AutomationRuleEngineService;
  let fakeEmailQueue: { add: ReturnType<typeof vi.fn>; name: string };
  let notificationSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBackgroundJob.create.mockResolvedValue({ id: 'bg-job-1' });
    mockAutomationRule.update.mockResolvedValue({});
    mockAutomationRuleExecution.create.mockResolvedValue({});
    eventEmitter = new EventEmitter2();
    fakeEmailQueue = { add: vi.fn().mockResolvedValue({ id: 'bull-job-1' }), name: 'email' };
    engine = new AutomationRuleEngineService(eventEmitter, fakeEmailQueue as any);
    eventEmitter.on('sales.order.confirmed', (payload) => engine.onSalesOrderConfirmed(payload));
    notificationSpy = vi.fn();
    eventEmitter.on('notification.send', notificationSpy);
  });

  it('a tenant-A event never fires a tenant-B rule sharing the same trigger, even when both exist in the same query universe', async () => {
    seedFakeDb([
      buildRule({ id: 'rule-tenant-a', tenantId: 'tenant-a', actions: [{ type: 'notify', config: { userId: 'user-a', title: 'A fired' } }] }),
      buildRule({ id: 'rule-tenant-b', tenantId: 'tenant-b', actions: [{ type: 'notify', config: { userId: 'user-b', title: 'B fired' } }] }),
    ]);

    await eventEmitter.emitAsync('sales.order.confirmed', {
      tenantId: 'tenant-a',
      salesOrderId: 'so-1',
      orderNumber: 'SO-001',
    });

    // Only tenant-a's rule executed.
    expect(notificationSpy).toHaveBeenCalledTimes(1);
    expect(notificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-a', userId: 'user-a', title: 'A fired' }),
    );
    expect(mockAutomationRuleExecution.create).toHaveBeenCalledTimes(1);
    expect(mockAutomationRuleExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ruleId: 'rule-tenant-a', tenantId: 'tenant-a' }) }),
    );
  });

  it('the reverse direction also holds: a tenant-B event never fires tenant-A rule data', async () => {
    seedFakeDb([
      buildRule({ id: 'rule-tenant-a', tenantId: 'tenant-a', actions: [{ type: 'notify', config: { userId: 'user-a', title: 'A fired' } }] }),
      buildRule({ id: 'rule-tenant-b', tenantId: 'tenant-b', actions: [{ type: 'notify', config: { userId: 'user-b', title: 'B fired' } }] }),
    ]);

    await eventEmitter.emitAsync('sales.order.confirmed', {
      tenantId: 'tenant-b',
      salesOrderId: 'so-2',
      orderNumber: 'SO-002',
    });

    expect(notificationSpy).toHaveBeenCalledTimes(1);
    expect(notificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-b', userId: 'user-b', title: 'B fired' }),
    );
  });

  it('concurrent same-tick events for two different tenants each only trigger their own tenant rule (no cross-talk under concurrency)', async () => {
    seedFakeDb([
      buildRule({ id: 'rule-tenant-a', tenantId: 'tenant-a', actions: [{ type: 'notify', config: { userId: 'user-a', title: 'A fired' } }] }),
      buildRule({ id: 'rule-tenant-b', tenantId: 'tenant-b', actions: [{ type: 'notify', config: { userId: 'user-b', title: 'B fired' } }] }),
    ]);

    await Promise.all([
      eventEmitter.emitAsync('sales.order.confirmed', { tenantId: 'tenant-a', salesOrderId: 'so-3', orderNumber: 'SO-003' }),
      eventEmitter.emitAsync('sales.order.confirmed', { tenantId: 'tenant-b', salesOrderId: 'so-4', orderNumber: 'SO-004' }),
    ]);

    expect(notificationSpy).toHaveBeenCalledTimes(2);
    const tenantIdsNotified = notificationSpy.mock.calls.map((c) => c[0].tenantId).sort();
    expect(tenantIdsNotified).toEqual(['tenant-a', 'tenant-b']);
    // Each notification's userId must match only its own tenant's rule config — no swapping.
    for (const call of notificationSpy.mock.calls) {
      const [payload] = call;
      if (payload.tenantId === 'tenant-a') expect(payload.userId).toBe('user-a');
      if (payload.tenantId === 'tenant-b') expect(payload.userId).toBe('user-b');
    }
  });
});

describe('AutomationRuleEngineService — edge cases (malformed conditions, unsupported actions, duplicate events)', () => {
  let eventEmitter: EventEmitter2;
  let engine: AutomationRuleEngineService;
  let fakeEmailQueue: { add: ReturnType<typeof vi.fn>; name: string };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBackgroundJob.create.mockResolvedValue({ id: 'bg-job-1' });
    mockAutomationRule.update.mockResolvedValue({});
    mockAutomationRuleExecution.create.mockResolvedValue({});
    eventEmitter = new EventEmitter2();
    fakeEmailQueue = { add: vi.fn().mockResolvedValue({ id: 'bull-job-1' }), name: 'email' };
    engine = new AutomationRuleEngineService(eventEmitter, fakeEmailQueue as any);
    eventEmitter.on('sales.order.confirmed', (payload) => engine.onSalesOrderConfirmed(payload));
  });

  it('FIXED: a rule with malformed (non-array, e.g. object) `conditions` is recorded as FAILED and does not block sibling rules in the same batch', async () => {
    // Regression test for the defect found in this same QA pass: `executeRule` used to do
    // `(rule.conditions as any[]) ?? []`, which only guards against null/undefined — a
    // malformed non-null, non-array JSON value (e.g. `{}`) sailed through into
    // `AutomationRulesService.evaluateConditions`'s unconditional `conditions.filter(...)`,
    // throwing an uncaught TypeError that silently dropped the audit trail for the offending
    // rule AND aborted the `for (const rule of rules)` loop, starving every well-formed sibling
    // rule ordered after it. Fixed by: (a) explicitly validating conditions/actions shape in
    // `executeRule` and throwing a descriptive error instead of letting `.filter` blow up, and
    // (b) wrapping each `executeRule` call in `runTriggersFor` with try/catch that records a
    // FAILED execution row and continues to the next rule.
    mockAutomationRule.findMany.mockResolvedValue([
      buildRule({ id: 'rule-malformed', conditions: { not: 'an array' } as any }),
      buildRule({ id: 'rule-well-formed', conditions: [] }),
    ]);

    let thrown: unknown;
    try {
      await eventEmitter.emitAsync('sales.order.confirmed', {
        tenantId: 'tenant-a',
        salesOrderId: 'so-malformed',
        orderNumber: 'SO-M1',
      });
    } catch (err) {
      thrown = err;
    }

    // The malformed rule's error must not escape the handler.
    expect(thrown).toBeUndefined();

    // The malformed rule gets an honest FAILED execution row (audit trail preserved).
    expect(mockAutomationRuleExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ruleId: 'rule-malformed',
          status: 'FAILED',
          error: expect.stringContaining('malformed conditions'),
        }),
      }),
    );

    // The well-formed sibling rule still runs to completion (SUCCESS or SKIPPED), proving the
    // batch was not aborted.
    expect(mockAutomationRuleExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ruleId: 'rule-well-formed' }),
      }),
    );
    expect(mockAutomationRuleExecution.create).toHaveBeenCalledTimes(2);
  });

  it('DEFECT (secondary): a rule whose action references an unsupported type does NOT throw, and is honestly recorded as not-executed (this part is correct)', async () => {
    // This is the "should not throw" half of the assignment's edge case — confirming the
    // engine DOES handle an unknown action type gracefully via the `default` branch of
    // `executeAction`'s switch, unlike the malformed-conditions case above.
    mockAutomationRule.findMany.mockResolvedValue([
      buildRule({
        id: 'rule-unsupported-action',
        actions: [{ type: 'webhook', config: { url: 'https://example.test/hook' } }],
      }),
    ]);

    await eventEmitter.emitAsync('sales.order.confirmed', {
      tenantId: 'tenant-a',
      salesOrderId: 'so-unsupported',
      orderNumber: 'SO-U1',
    });

    expect(mockAutomationRuleExecution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SUCCESS', // no action threw, so the rule "succeeded" even though nothing real happened
          result: expect.objectContaining({
            actionResults: [
              expect.objectContaining({ type: 'webhook', executed: false }),
            ],
          }),
        }),
      }),
    );
  });

  it('DEFECT: firing the identical domain event twice (duplicate delivery) double-executes the rule with no idempotency guard', async () => {
    // No dedupe key (e.g. a stable event/message ID, or an idempotency check against
    // AutomationRuleExecution for the same ruleId+triggerData within a time window) exists
    // anywhere in `runTriggersFor`/`executeRule`. Any at-least-once delivery semantics
    // upstream (e.g. a retried HTTP request that re-emits the same domain event, or a queue
    // redelivery once this moves to BullMQ per the P0-2 "out of scope for now" note) will
    // cause the same notification/email action to fire twice for what the business
    // considers a single logical event. This test proves the current double-execution
        // behavior empirically so it's tracked, not assumed.
    mockAutomationRule.findMany.mockResolvedValue([buildRule({ id: 'rule-dup' })]);
    const notificationSpy = vi.fn();
    eventEmitter.on('notification.send', notificationSpy);

    const duplicatePayload = {
      tenantId: 'tenant-a',
      salesOrderId: 'so-dup',
      orderNumber: 'SO-DUP',
    };

    await eventEmitter.emitAsync('sales.order.confirmed', duplicatePayload);
    await eventEmitter.emitAsync('sales.order.confirmed', { ...duplicatePayload });

    // Current (unguarded) behavior: fires twice.
    expect(notificationSpy).toHaveBeenCalledTimes(2);
    expect(mockAutomationRuleExecution.create).toHaveBeenCalledTimes(2);
    expect(mockAutomationRule.update).toHaveBeenCalledTimes(2);
  });
});
