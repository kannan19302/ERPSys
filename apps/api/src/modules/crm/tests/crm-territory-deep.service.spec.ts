import { Test, TestingModule } from "@nestjs/testing";
import {
  CrmTerritoryDeepService,
  createTerritoryPlanSchema,
  createAccountTeamMemberSchema,
  createNamedAccountSchema,
} from "../crm-territory-deep.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("CrmTerritoryDeepService", () => {
  let service: CrmTerritoryDeepService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmTerritoryDeepService],
    }).compile();
    service = module.get<CrmTerritoryDeepService>(CrmTerritoryDeepService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Schema validation", () => {
    it("should validate createTerritoryPlanSchema", () => {
      const valid = createTerritoryPlanSchema.parse({
        name: "FY2026 EMEA Plan",
        fiscalYear: "FY2026",
        assignments: [
          {
            territoryId: "t1",
            userId: "u1",
            allocation: 50,
            startDate: "2026-01-01",
          },
        ],
      });
      expect(valid.name).toBe("FY2026 EMEA Plan");
      expect(valid.assignments).toHaveLength(1);
    });

    it("should reject empty name", () => {
      expect(() =>
        createTerritoryPlanSchema.parse({ name: "", fiscalYear: "FY2026" }),
      ).toThrow();
    });

    it("should validate createAccountTeamMemberSchema", () => {
      const valid = createAccountTeamMemberSchema.parse({
        customerId: "c1",
        userId: "u1",
      });
      expect(valid.role).toBe("MEMBER");
      expect(valid.isPrimary).toBe(false);
    });

    it("should validate createNamedAccountSchema", () => {
      const valid = createNamedAccountSchema.parse({
        customerId: "c1",
        name: "Acme Corp",
      });
      expect(valid.tier).toBe("STANDARD");
    });
  });

  describe("Business logic stubs", () => {
    it("should produce territory performance data shape", async () => {
      const result = await service.getTerritoryPerformance(
        "tenant1",
        "territory1",
        "last_30",
      );
      expect(result).toHaveProperty("territoryId", "territory1");
      expect(result).toHaveProperty("revenue");
      expect(result).toHaveProperty("dealCount");
      expect(result).toHaveProperty("winRate");
    });

    it("should produce territory dashboard shape", async () => {
      const result = await service.getTerritoryDashboard("tenant1");
      expect(result).toHaveProperty("totalTerritories");
      expect(result).toHaveProperty("totalTeamMembers");
      expect(result).toHaveProperty("activePlans");
    });
  });
});
