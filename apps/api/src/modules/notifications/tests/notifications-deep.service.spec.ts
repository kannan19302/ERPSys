import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@unerp/database";
import { NotificationsDeepService } from "../notifications-deep.service";

describe("NotificationsDeepService", () => {
  let service: NotificationsDeepService;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = { emit: jest.fn() } as any;
    service = new NotificationsDeepService(eventEmitter);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createTemplate", () => {
    it("should create a notification template", async () => {
      jest
        .spyOn(prisma.notificationTemplate, "findUnique")
        .mockResolvedValue(null);
      const mockCreate = jest
        .spyOn(prisma.notificationTemplate, "create")
        .mockResolvedValue({
          id: "1",
          tenantId: "t1",
          name: "Welcome",
          description: null,
          subject: "Welcome!",
          body: "Hello {{name}}",
          channel: "EMAIL",
          variables: ["name"],
          eventType: "user.welcome",
          isActive: true,
          category: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await service.createTemplate("t1", {
        name: "Welcome",
        subject: "Welcome!",
        body: "Hello {{name}}",
        variables: ["name"],
        eventType: "user.welcome",
      });
      expect(result.name).toBe("Welcome");
      expect(result.subject).toBe("Welcome!");
    });
  });

  describe("renderTemplate", () => {
    it("should render template with variables", async () => {
      jest.spyOn(prisma.notificationTemplate, "findFirst").mockResolvedValue({
        id: "1",
        tenantId: "t1",
        name: "Welcome",
        description: null,
        subject: "Welcome {{name}}!",
        body: "Hello {{name}}, your email is {{email}}",
        channel: "EMAIL",
        variables: ["name", "email"],
        eventType: null,
        isActive: true,
        category: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.renderTemplate("t1", "1", {
        name: "John",
        email: "john@test.com",
      });
      expect(result.subject).toBe("Welcome John!");
      expect(result.body).toBe("Hello John, your email is john@test.com");
    });
  });

  describe("upsertDigest", () => {
    it("should upsert a digest config", async () => {
      const mockUpsert = jest
        .spyOn(prisma.notificationDigest, "upsert")
        .mockResolvedValue({
          id: "1",
          tenantId: "t1",
          userId: "u1",
          frequency: "DAILY",
          channel: "EMAIL",
          lastSentAt: null,
          nextScheduledAt: null,
          isEnabled: true,
          preferences: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await service.upsertDigest("t1", "u1", {
        frequency: "DAILY",
      });
      expect(result.frequency).toBe("DAILY");
    });
  });

  describe("createBatch", () => {
    it("should create a batch with items", async () => {
      jest.spyOn(prisma.notificationBatch, "create").mockResolvedValue({
        id: "b1",
        tenantId: "t1",
        name: "Test Batch",
        channel: "EMAIL",
        status: "PENDING",
        totalItems: 2,
        sentItems: 0,
        failedItems: 0,
        templateId: null,
        scheduledAt: null,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest
        .spyOn(prisma.notificationBatchItem, "createMany")
        .mockResolvedValue({ count: 2 });

      const result = await service.createBatch("t1", {
        name: "Test Batch",
        items: [
          {
            userId: "u1",
            recipient: "a@test.com",
            subject: "Hello",
            body: "Body",
          },
          {
            userId: "u2",
            recipient: "b@test.com",
            subject: "Hello",
            body: "Body",
          },
        ],
      });
      expect(result.name).toBe("Test Batch");
      expect(result.totalItems).toBe(2);
    });
  });

  describe("processBatch", () => {
    it("should process a pending batch", async () => {
      jest.spyOn(prisma.notificationBatch, "findFirst").mockResolvedValue({
        id: "b1",
        tenantId: "t1",
        name: "Test",
        channel: "EMAIL",
        status: "PENDING",
        totalItems: 1,
        sentItems: 0,
        failedItems: 0,
        templateId: null,
        scheduledAt: null,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest
        .spyOn(prisma.notificationBatch, "update")
        .mockResolvedValue({} as any);
      jest.spyOn(prisma.notificationBatchItem, "findMany").mockResolvedValue([
        {
          id: "i1",
          tenantId: "t1",
          batchId: "b1",
          userId: "u1",
          recipient: "a@test.com",
          subject: "Hello",
          body: "Body",
          status: "PENDING",
          errorMsg: null,
          sentAt: null,
          createdAt: new Date(),
        },
      ]);
      jest
        .spyOn(prisma.notificationBatchItem, "update")
        .mockResolvedValue({} as any);

      const result = await service.processBatch("t1", "b1");
      expect(result.status).toBe("COMPLETED");
    });
  });

  describe("getDeliveryLogs", () => {
    it("should return delivery logs", async () => {
      jest.spyOn(prisma.notificationDeliveryLog, "findMany").mockResolvedValue([
        {
          id: "1",
          tenantId: "t1",
          notificationId: null,
          templateId: null,
          userId: "u1",
          channel: "EMAIL",
          status: "SENT",
          errorMsg: null,
          metadata: {},
          sentAt: new Date(),
          deliveredAt: null,
          openedAt: null,
          createdAt: new Date(),
        },
      ]);
      const result = await service.getDeliveryLogs("t1");
      expect(result).toHaveLength(1);
    });
  });
});
