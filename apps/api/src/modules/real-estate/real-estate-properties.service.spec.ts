import { Test, TestingModule } from "@nestjs/testing";
import { RealEstatePropertiesService } from "./real-estate-properties.service";
import { prisma } from "@unerp/database";

describe("RealEstatePropertiesService", () => {
  let svc: RealEstatePropertiesService;
  const tenantId = "tenant-1";

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealEstatePropertiesService],
    }).compile();
    svc = module.get<RealEstatePropertiesService>(RealEstatePropertiesService);
  });

  it("should be defined", () => {
    expect(svc).toBeDefined();
  });

  describe("properties", () => {
    it("getProperties returns paginated results", async () => {
      const mockData = [
        { id: "p1", name: "Test Property", type: "RESIDENTIAL" },
      ];
      jest
        .spyOn(prisma.realEstateProperty, "findMany")
        .mockResolvedValue(mockData as any);
      jest.spyOn(prisma.realEstateProperty, "count").mockResolvedValue(1);
      const result = await svc.getProperties(tenantId, {
        type: "RESIDENTIAL",
        page: "1",
        limit: "10",
      });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
    it("getPropertyById throws on missing", async () => {
      jest
        .spyOn(prisma.realEstateProperty, "findFirst")
        .mockResolvedValue(null);
      await expect(
        svc.getPropertyById(tenantId, "nonexistent"),
      ).rejects.toThrow("Property not found");
    });
    it("createProperty creates with tenantId", async () => {
      const input = { name: "New Property", type: "COMMERCIAL" };
      jest
        .spyOn(prisma.realEstateProperty, "create")
        .mockResolvedValue({ id: "p2", ...input, tenantId } as any);
      const result = await svc.createProperty(tenantId, input);
      expect(result.tenantId).toBe(tenantId);
    });
    it("updateProperty updates existing", async () => {
      jest
        .spyOn(prisma.realEstateProperty, "findFirst")
        .mockResolvedValue({ id: "p1", tenantId } as any);
      jest
        .spyOn(prisma.realEstateProperty, "update")
        .mockResolvedValue({ id: "p1", name: "Updated" } as any);
      const result = await svc.updateProperty(tenantId, "p1", {
        name: "Updated",
      });
      expect(result.name).toBe("Updated");
    });
    it("deleteProperty soft-deletes", async () => {
      jest
        .spyOn(prisma.realEstateProperty, "findFirst")
        .mockResolvedValue({ id: "p1", tenantId } as any);
      jest
        .spyOn(prisma.realEstateProperty, "update")
        .mockResolvedValue({ id: "p1", isActive: false } as any);
      const result = await svc.deleteProperty(tenantId, "p1");
      expect(result.isActive).toBe(false);
    });
  });

  describe("portfolios", () => {
    it("getPortfolios returns list", async () => {
      jest
        .spyOn(prisma.realEstatePropertyPortfolio, "findMany")
        .mockResolvedValue([{ id: "pf1", name: "Test Portfolio" }] as any);
      const result = await svc.getPortfolios(tenantId, {});
      expect(result).toHaveLength(1);
    });
    it("createPortfolio creates item", async () => {
      jest
        .spyOn(prisma.realEstatePropertyPortfolio, "create")
        .mockResolvedValue({
          id: "pf2",
          name: "New Portfolio",
          tenantId,
        } as any);
      const result = await svc.createPortfolio(tenantId, {
        name: "New Portfolio",
      });
      expect(result.tenantId).toBe(tenantId);
    });
  });

  describe("units", () => {
    it("getUnits filters by propertyId", async () => {
      jest
        .spyOn(prisma.realEstatePropertyUnit, "findMany")
        .mockResolvedValue([{ id: "u1", unitNumber: "101" }] as any);
      jest.spyOn(prisma.realEstatePropertyUnit, "count").mockResolvedValue(1);
      const result = await svc.getUnits(tenantId, { propertyId: "p1" });
      expect(result.total).toBe(1);
    });
    it("getUnitAvailability groups by status", async () => {
      jest.spyOn(prisma.realEstatePropertyUnit, "groupBy").mockResolvedValue([
        { status: "VACANT", _count: 5 },
        { status: "OCCUPIED", _count: 3 },
      ] as any);
      const result = await svc.getUnitAvailability(tenantId);
      expect(result).toHaveLength(2);
    });
  });

  describe("buildings", () => {
    it("getBuildings returns list with property count", async () => {
      jest
        .spyOn(prisma.realEstatePropertyBuilding, "findMany")
        .mockResolvedValue([
          { id: "b1", name: "Main Bldg", _count: { properties: 3 } },
        ] as any);
      const result = await svc.getBuildings(tenantId);
      expect(result).toHaveLength(1);
    });
  });
});
