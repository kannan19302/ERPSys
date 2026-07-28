import { describe, it, expect, beforeEach, vi } from "vitest";
import { FieldServiceOperationsService } from "../field-service-operations.service";

describe("FieldServiceOperationsService", () => {
  let service: FieldServiceOperationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      fieldServiceWarranty: {
        findMany: vi.fn().mockResolvedValue([{ id: "wrn-1", assetId: "ast-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "wrn-1", ...data })),
      },
      fieldServiceWorkOrderExpense: {
        findMany: vi.fn().mockResolvedValue([{ id: "exp-1", workOrderId: "wo-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "exp-1", ...data })),
      },
      fieldServiceInspectionChecklist: {
        findMany: vi.fn().mockResolvedValue([{ id: "chk-1", workOrderId: "wo-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "chk-1", ...data })),
      },
    };
    service = new FieldServiceOperationsService(mockPrisma);
  });

  it("should list warranties", async () => {
    const result = await service.getWarranties("tenant-1", { assetId: "ast-1" });
    expect(result).toHaveLength(1);
  });

  it("should create warranty", async () => {
    const data = { assetId: "ast-1", provider: "OEM Corp", startDate: "2026-01-01", endDate: "2027-01-01" };
    const result = await service.createWarranty("tenant-1", data);
    expect(result.provider).toBe("OEM Corp");
    expect(result.status).toBe("ACTIVE");
  });

  it("should create work order expense", async () => {
    const data = { workOrderId: "wo-1", techId: "tech-1", category: "PARTS", amount: 250 };
    const result = await service.createWorkOrderExpense("tenant-1", data);
    expect(result.amount).toBe(250);
    expect(result.status).toBe("PENDING");
  });

  it("should create inspection checklist", async () => {
    const data = { workOrderId: "wo-1", title: "Pre-service Safety Inspection" };
    const result = await service.createInspectionChecklist("tenant-1", data);
    expect(result.status).toBe("IN_PROGRESS");
  });
});
