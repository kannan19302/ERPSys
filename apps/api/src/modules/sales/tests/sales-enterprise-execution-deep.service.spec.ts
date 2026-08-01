import { Test, TestingModule } from "@nestjs/testing";
import { SalesEnterpriseExecutionDeepService } from "../sales-enterprise-execution-deep.service";
import { SalesQuoteCpqMasterDeepService } from "../sales-quote-cpq-master-deep.service";
import { PrismaService } from "@unerp/database";

describe("Sales Deepening Services", () => {
  let executionService: SalesEnterpriseExecutionDeepService;
  let cpqMasterService: SalesQuoteCpqMasterDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesEnterpriseExecutionDeepService,
        SalesQuoteCpqMasterDeepService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    executionService = module.get<SalesEnterpriseExecutionDeepService>(
      SalesEnterpriseExecutionDeepService,
    );
    cpqMasterService = module.get<SalesQuoteCpqMasterDeepService>(
      SalesQuoteCpqMasterDeepService,
    );
  });

  describe("SalesEnterpriseExecutionDeepService", () => {
    it("should create deal desk request", async () => {
      const res = await executionService.createDealDeskRequest("tenant-1", {
        dealName: "Enterprise SaaS",
      });
      expect(res.status).toBe("PENDING_REVIEW");
    });

    it("should get sales velocity metrics", async () => {
      const res = await executionService.getSalesVelocityMetrics(
        "tenant-1",
        "Q3",
      );
      expect(res.salesVelocity).toBeGreaterThan(0);
    });

    it("should get competitor battlecards", async () => {
      const res = await executionService.getCompetitorBattlecards("tenant-1");
      expect(res.length).toBeGreaterThan(0);
    });

    it("should calculate lead score", async () => {
      const res = await executionService.calculateLeadScore(
        "tenant-1",
        "lead-100",
      );
      expect(res.tier).toBe("HOT");
    });

    it("should get sales cadences", async () => {
      const res = await executionService.getSalesCadences("tenant-1");
      expect(res.length).toBeGreaterThan(0);
    });
  });

  describe("SalesQuoteCpqMasterDeepService", () => {
    it("should get bundle rules", async () => {
      const res = await cpqMasterService.getBundleRules("tenant-1");
      expect(res.length).toBeGreaterThan(0);
    });

    it("should run guided selling questions", async () => {
      const res = await cpqMasterService.runGuidedSellingQuestions("tenant-1", {
        users: 50,
      });
      expect(res.matchScore).toBe(95.0);
    });

    it("should convert quote to sales order", async () => {
      const res = await cpqMasterService.convertQuoteToSalesOrder(
        "tenant-1",
        "quote-100",
      );
      expect(res.status).toBe("CONFIRMED");
    });
  });
});
