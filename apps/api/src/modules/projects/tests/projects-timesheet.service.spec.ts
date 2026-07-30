// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectsTimesheetService } from "../services/projects-timesheet.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    ppmTimesheet: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";

describe("ProjectsTimesheetService", () => {
  let service: ProjectsTimesheetService;

  beforeEach(() => {
    service = new ProjectsTimesheetService();
    vi.clearAllMocks();
  });

  describe("getTimesheets", () => {
    it("should return timesheets with optional filters", async () => {
      vi.mocked(prisma.ppmTimesheet.findMany).mockResolvedValue([
        {
          id: "ts-1",
          userId: "u-1",
          status: "DRAFT",
          totalHours: 40,
          timesheetEntries: [],
        } as never,
      ]);

      const result = await service.getTimesheets("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getTimesheetById", () => {
    it("should return a timesheet by id", async () => {
      vi.mocked(prisma.ppmTimesheet.findFirst).mockResolvedValue({
        id: "ts-1",
        totalHours: 40,
        timesheetEntries: [],
      } as never);
      const result = await service.getTimesheetById("t-1", "ts-1");
      expect(result.id).toBe("ts-1");
    });

    it("should throw if not found", async () => {
      vi.mocked(prisma.ppmTimesheet.findFirst).mockResolvedValue(null);
      await expect(service.getTimesheetById("t-1", "bad")).rejects.toThrow(
        "Timesheet not found",
      );
    });
  });

  describe("createTimesheet", () => {
    it("should create a timesheet with entries", async () => {
      vi.mocked(prisma.ppmTimesheet.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.ppmTimesheet.create).mockResolvedValue({
        id: "ts-1",
        totalHours: 8,
        billableHours: 6,
      } as never);

      const result = await service.createTimesheet("t-1", {
        userId: "u-1",
        weekStart: "2026-07-06",
        weekEnd: "2026-07-12",
        entries: [{ date: "2026-07-06", hours: 8, isBillable: true }],
      });
      expect(result).toBeDefined();
    });

    it("should reject overlapping timesheets", async () => {
      vi.mocked(prisma.ppmTimesheet.findFirst).mockResolvedValue({
        id: "existing",
      } as never);
      await expect(
        service.createTimesheet("t-1", {
          userId: "u-1",
          weekStart: "2026-07-06",
          weekEnd: "2026-07-12",
        }),
      ).rejects.toThrow("already exists");
    });
  });

  describe("submitTimesheet", () => {
    it("should submit a draft timesheet", async () => {
      vi.mocked(prisma.ppmTimesheet.findFirst).mockResolvedValue({
        id: "ts-1",
        status: "DRAFT",
      } as never);
      vi.mocked(prisma.ppmTimesheet.update).mockResolvedValue({
        id: "ts-1",
        status: "SUBMITTED",
      } as never);

      const result = await service.submitTimesheet("t-1", "ts-1");
      expect(result).toBeDefined();
    });

    it("should reject non-draft timesheets", async () => {
      vi.mocked(prisma.ppmTimesheet.findFirst).mockResolvedValue({
        id: "ts-1",
        status: "APPROVED",
      } as never);
      await expect(service.submitTimesheet("t-1", "ts-1")).rejects.toThrow(
        "already",
      );
    });
  });

  describe("approveTimesheet", () => {
    it("should approve a submitted timesheet", async () => {
      vi.mocked(prisma.ppmTimesheet.findFirst).mockResolvedValue({
        id: "ts-1",
        status: "SUBMITTED",
        notes: "",
      } as never);
      vi.mocked(prisma.ppmTimesheet.update).mockResolvedValue({
        id: "ts-1",
        status: "APPROVED",
      } as never);

      const result = await service.approveTimesheet("t-1", "ts-1", "manager-1");
      expect(result).toBeDefined();
    });
  });

  describe("rejectTimesheet", () => {
    it("should reject a submitted timesheet", async () => {
      vi.mocked(prisma.ppmTimesheet.findFirst).mockResolvedValue({
        id: "ts-1",
        status: "SUBMITTED",
        notes: "",
      } as never);
      vi.mocked(prisma.ppmTimesheet.update).mockResolvedValue({
        id: "ts-1",
        status: "REJECTED",
      } as never);

      const result = await service.rejectTimesheet(
        "t-1",
        "ts-1",
        "Missing details",
      );
      expect(result).toBeDefined();
    });
  });

  describe("getUtilizationRate", () => {
    it("should calculate utilization rate", async () => {
      vi.mocked(prisma.ppmTimesheet.findMany).mockResolvedValue([
        {
          id: "ts-1",
          totalHours: 40,
          billableHours: 30,
          userId: "u-1",
          timesheetEntries: [],
        } as never,
        {
          id: "ts-2",
          totalHours: 40,
          billableHours: 35,
          userId: "u-2",
          timesheetEntries: [],
        } as never,
      ]);

      const result = await service.getUtilizationRate("t-1");
      expect(result.totalHours).toBe(80);
      expect(result.billableHours).toBe(65);
      expect(result.utilizationRate).toBe(81);
      expect(result.byUser).toHaveLength(2);
    });
  });

  describe("getTimesheetDashboard", () => {
    it("should return aggregated stats", async () => {
      vi.mocked(prisma.ppmTimesheet.findMany).mockResolvedValue([
        {
          id: "ts-1",
          status: "DRAFT",
          totalHours: 40,
          billableHours: 30,
          userId: "u-1",
          timesheetEntries: [],
        } as never,
        {
          id: "ts-2",
          status: "APPROVED",
          totalHours: 35,
          billableHours: 32,
          userId: "u-1",
          timesheetEntries: [],
        } as never,
      ]);

      const result = await service.getTimesheetDashboard("t-1");
      expect(result.total).toBe(2);
      expect(result.draft).toBe(1);
      expect(result.approved).toBe(1);
      expect(result.totalHours).toBe(75);
    });
  });
});
