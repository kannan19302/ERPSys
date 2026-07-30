// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssetMaintenanceService } from "./asset-maintenance.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    assetMaintenanceSchedule: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("AssetMaintenanceService", () => {
  let service: AssetMaintenanceService;

  beforeEach(() => {
    service = new AssetMaintenanceService();
    vi.clearAllMocks();
  });

  it("should return maintenance schedules", async () => {
    (prisma.assetMaintenanceSchedule.findMany as any).mockResolvedValue([
      { title: "HVAC Inspection" },
    ]);
    (prisma.assetMaintenanceSchedule.count as any).mockResolvedValue(1);

    const res = await service.getMaintenanceSchedules("tenant1", {});
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("should create maintenance schedule", async () => {
    (prisma.assetMaintenanceSchedule.create as any).mockResolvedValue({
      id: "ms1",
      title: "Oil Change",
    });

    const res = await service.createMaintenanceSchedule("tenant1", {
      title: "Oil Change",
    });
    expect(res.id).toBe("ms1");
  });
});
