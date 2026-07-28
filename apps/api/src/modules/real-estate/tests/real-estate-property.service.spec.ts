import { describe, it, expect, beforeEach, vi } from "vitest";
import { RealEstatePropertyService } from "../real-estate-property.service";

describe("RealEstatePropertyService", () => {
  let service: RealEstatePropertyService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      realEstatePropertyInspection: {
        findMany: vi.fn().mockResolvedValue([{ id: "insp-1", propertyId: "prop-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "insp-1", ...data })),
      },
      realEstateRentCollectionLog: {
        findMany: vi.fn().mockResolvedValue([{ id: "rent-1", leaseId: "lse-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "rent-1", ...data })),
      },
      realEstateListingSyndicate: {
        findMany: vi.fn().mockResolvedValue([{ id: "syn-1", propertyId: "prop-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "syn-1", ...data })),
      },
    };
    service = new RealEstatePropertyService(mockPrisma);
  });

  it("should list property inspections", async () => {
    const result = await service.getInspections("tenant-1", { propertyId: "prop-1" });
    expect(result).toHaveLength(1);
  });

  it("should create property inspection", async () => {
    const data = { propertyId: "prop-1", inspectorId: "user-1", type: "MOVE_IN" };
    const result = await service.createInspection("tenant-1", data);
    expect(result.type).toBe("MOVE_IN");
    expect(result.passed).toBe(true);
  });

  it("should create rent collection log", async () => {
    const data = { leaseId: "lse-1", tenantUser: "john", amountPaid: 1200 };
    const result = await service.createRentCollectionLog("tenant-1", data);
    expect(result.amountPaid).toBe(1200);
  });

  it("should create listing syndicate", async () => {
    const data = { propertyId: "prop-1", platform: "ZILLOW" };
    const result = await service.createListingSyndicate("tenant-1", data);
    expect(result.platform).toBe("ZILLOW");
    expect(result.status).toBe("ACTIVE");
  });
});
