// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FieldServiceSchedulingService } from "./field-service-scheduling.service";
import { NotFoundException } from "@nestjs/common";

const { db } = vi.hoisted(() => {
  const mockDb: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    fieldServiceSchedule: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: "sched-1", ...d.data }),
        ),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
    fieldServiceCalendarEvent: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: "event-1", ...d.data }),
        ),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
  };
  return { db: mockDb };
});

vi.mock("@unerp/database", () => ({ prisma: db }));

describe("FieldServiceSchedulingService", () => {
  let service: FieldServiceSchedulingService;

  beforeEach(async () => {
    const { Test } = await import("@nestjs/testing");
    const mod = await Test.createTestingModule({
      providers: [FieldServiceSchedulingService],
    }).compile();
    service = mod.get(FieldServiceSchedulingService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getSchedules", () => {
    it("should return paginated schedules", async () => {
      const result = await service.getSchedules("tenant-1", {});
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(typeof result.total).toBe("number");
    });
  });

  describe("getScheduleById", () => {
    it("should throw NotFoundException for missing schedule", async () => {
      await expect(
        service.getScheduleById("tenant-1", "invalid"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return schedule when found", async () => {
      db.fieldServiceSchedule.findFirst.mockResolvedValueOnce({
        id: "sched-1",
        tenantId: "tenant-1",
        title: "Test",
      });
      const result = await service.getScheduleById("tenant-1", "sched-1");
      expect(result.title).toBe("Test");
    });
  });

  describe("createSchedule", () => {
    it("should create a new schedule entry", async () => {
      const data = {
        technicianId: "tech-1",
        title: "Test Job",
        scheduledDate: "2026-07-27T12:00:00Z",
        durationMin: 60,
      };
      const result = await service.createSchedule("tenant-1", data);
      expect(result).toBeDefined();
    });
  });

  describe("deleteSchedule", () => {
    it("should soft-delete schedule", async () => {
      db.fieldServiceSchedule.findFirst.mockResolvedValueOnce({
        id: "sched-1",
        tenantId: "tenant-1",
      });
      const result = await service.deleteSchedule("tenant-1", "sched-1");
      expect(result.isActive).toBe(false);
    });
  });

  describe("getCalendarEvents", () => {
    it("should return calendar events", async () => {
      const result = await service.getCalendarEvents("tenant-1", {});
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getWeeklySchedule", () => {
    it("should return weekly schedule with events", async () => {
      const result = await service.getWeeklySchedule("tenant-1", "2026-07-27");
      expect(result).toBeDefined();
      expect(result.schedules).toBeDefined();
      expect(result.events).toBeDefined();
    });
  });
});
