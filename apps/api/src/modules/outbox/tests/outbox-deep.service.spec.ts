// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OutboxDeepService } from "../outbox-deep.service";
import { NotFoundException } from "@nestjs/common";

const mockDlq = {
  id: "dlq1",
  tenantId: "t1",
  outboxEventId: "evt1",
  outboxDeliveryId: "del1",
  destination: "http://example.com/webhook",
  eventName: "order.created",
  payload: {},
  status: "PENDING_REVIEW",
  failedAttempts: 3,
  requeueCount: 0,
  maxRequeues: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockDeadLetter = {
  id: "dlm1",
  tenantId: "t1",
  outboxDeliveryId: "del1",
  destination: "http://example.com",
  eventName: "order.created",
  payload: {},
  deadLetterAt: new Date(),
  createdAt: new Date(),
};
const mockRetryLog = {
  id: "rl1",
  tenantId: "t1",
  outboxDeliveryId: "del1",
  attemptNumber: 1,
  status: "FAILED",
  durationMs: 100,
  createdAt: new Date(),
};
const mockDispatcher = {
  id: "ds1",
  tenantId: "t1",
  dispatcherName: "default-dispatcher",
  status: "ACTIVE",
  itemsProcessed: 100,
  itemsFailed: 5,
  config: {},
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock("@unerp/database", () => ({
  prisma: {
    outboxDLQ: {
      findMany: vi.fn().mockResolvedValue([mockDlq]),
      findFirst: vi.fn().mockResolvedValue(mockDlq),
      update: vi.fn().mockResolvedValue(mockDlq),
      count: vi.fn().mockResolvedValue(1),
    },
    outboxDeadLetterMessage: {
      findMany: vi.fn().mockResolvedValue([mockDeadLetter]),
      findFirst: vi.fn().mockResolvedValue(mockDeadLetter),
      update: vi.fn().mockResolvedValue(mockDeadLetter),
      count: vi.fn().mockResolvedValue(1),
    },
    outboxRetryLog: {
      findMany: vi.fn().mockResolvedValue([mockRetryLog]),
      count: vi.fn().mockResolvedValue(1),
      aggregate: vi.fn().mockResolvedValue({ _avg: { durationMs: 150 } }),
    },
    outboxDispatcherState: {
      findMany: vi.fn().mockResolvedValue([mockDispatcher]),
      findFirst: vi.fn().mockResolvedValue(mockDispatcher),
      create: vi.fn().mockResolvedValue(mockDispatcher),
      update: vi.fn().mockResolvedValue(mockDispatcher),
    },
    outboxDelivery: {
      count: vi.fn().mockResolvedValue(10),
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    outboxEvent: { count: vi.fn().mockResolvedValue(5) },
  },
}));

describe("OutboxDeepService", () => {
  let service: OutboxDeepService;

  beforeEach(() => {
    service = new OutboxDeepService();
    vi.clearAllMocks();
  });

  it("should get DLQ entries with pagination", async () => {
    const result = await service.getDlqEntries("t1");
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("should get DLQ entry by id", async () => {
    const result = await service.getDlqEntry("t1", "dlq1");
    expect(result.id).toBe("dlq1");
  });

  it("should throw on missing DLQ entry", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.outboxDLQ.findFirst as any).mockResolvedValueOnce(null);
    await expect(service.getDlqEntry("t1", "bad")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should requeue DLQ entry", async () => {
    const result = await service.requeueDlqEntry("t1", "dlq1");
    expect(result).toBeDefined();
  });

  it("should archive DLQ entry", async () => {
    const result = await service.archiveDlqEntry("t1", "dlq1");
    expect(result).toBeDefined();
  });

  it("should discard DLQ entry", async () => {
    const result = await service.discardDlqEntry("t1", "dlq1");
    expect(result).toBeDefined();
  });

  it("should batch requeue", async () => {
    const results = await service.batchRequeue("t1", { ids: ["dlq1"] });
    expect(results).toHaveLength(1);
  });

  it("should get DLQ stats", async () => {
    const stats = await service.getDlqStats("t1");
    expect(stats.pendingReview).toBe(1);
  });

  it("should get dead letters with pagination", async () => {
    const result = await service.getDeadLetters("t1");
    expect(result.items).toHaveLength(1);
  });

  it("should get dead letter by id", async () => {
    const result = await service.getDeadLetter("t1", "dlm1");
    expect(result.id).toBe("dlm1");
  });

  it("should retry dead letter", async () => {
    const result = await service.retryDeadLetter("t1", "dlm1");
    expect(result).toBeDefined();
  });

  it("should action dead letter", async () => {
    const result = await service.actionDeadLetter(
      "t1",
      "dlm1",
      "ARCHIVE",
      "admin",
    );
    expect(result).toBeDefined();
  });

  it("should get retry logs", async () => {
    const result = await service.getRetryLogs("t1");
    expect(result.items).toHaveLength(1);
  });

  it("should get dispatcher states", async () => {
    const result = await service.getDispatcherStates("t1");
    expect(result).toHaveLength(1);
  });

  it("should update dispatcher state", async () => {
    const result = await service.updateDispatcherState(
      "t1",
      "default-dispatcher",
      { status: "PAUSED" },
    );
    expect(result).toBeDefined();
  });

  it("should get analytics", async () => {
    const result = await service.getAnalytics("t1", "7d");
    expect(result.totalEvents).toBe(5);
    expect(result.totalDeliveries).toBe(10);
  });

  it("should get dispatcher health", async () => {
    const result = await service.getDispatcherHealth("t1");
    expect(result.active).toBe(1);
    expect(result.total).toBe(1);
  });

  it("should detect poison messages", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.outboxDelivery.findMany as any).mockResolvedValueOnce([]);
    const result = await service.detectPoisonMessages("t1");
    expect(result.poisonCount).toBe(0);
  });

  it("should get dispatcher state by name", async () => {
    const result = await service.getDispatcherState("t1", "default-dispatcher");
    expect(result.id).toBe("ds1");
  });
});
