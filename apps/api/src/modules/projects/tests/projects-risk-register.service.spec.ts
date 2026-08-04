import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectsRiskRegisterService } from "../services/projects-risk-register.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    project: { findFirst: vi.fn() },
    ppmRiskRegister: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

describe("ProjectsRiskRegisterService", () => {
  let service: ProjectsRiskRegisterService;

  beforeEach(() => {
    service = new ProjectsRiskRegisterService();
    vi.clearAllMocks();
  });

  describe("getRiskMatrix", () => {
    it("should return risk matrix with heatmap", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
      } as never);
      vi.mocked(prisma.ppmRiskRegister.findMany).mockResolvedValue([
        {
          id: "r-1",
          title: "Risk 1",
          probability: 0.8,
          impact: 0.7,
          riskScore: 56,
          severity: "CRITICAL",
          status: "IDENTIFIED",
        } as never,
        {
          id: "r-2",
          title: "Risk 2",
          probability: 0.3,
          impact: 0.4,
          riskScore: 12,
          severity: "LOW",
          status: "ASSESSED",
        } as never,
      ]);

      const result = await service.getRiskMatrix("t-1", "p-1");
      expect(result.totalRisks).toBe(2);
      expect(result.highRiskCount).toBe(1);
      expect(result.matrix).toBeDefined();
      expect(result.heatmap).toBeDefined();
    });
  });

  describe("getRiskById", () => {
    it("should return a risk", async () => {
      vi.mocked(prisma.ppmRiskRegister.findFirst).mockResolvedValue({
        id: "r-1",
        title: "Risk 1",
      } as never);
      const result = await service.getRiskById("t-1", "r-1");
      expect(result.id).toBe("r-1");
    });

    it("should throw if not found", async () => {
      vi.mocked(prisma.ppmRiskRegister.findFirst).mockResolvedValue(null);
      await expect(service.getRiskById("t-1", "bad")).rejects.toThrow(
        "Risk not found",
      );
    });
  });

  describe("createRisk", () => {
    it("should create a risk with computed severity", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
      } as never);
      vi.mocked(prisma.ppmRiskRegister.create).mockResolvedValue({
        id: "r-1",
        severity: "CRITICAL",
      } as never);

      const result = await service.createRisk("t-1", {
        projectId: "p-1",
        title: "Budget Risk",
        probability: 0.9,
        impact: 0.9,
      });
      expect(result).toBeDefined();
    });
  });

  describe("assessRisk", () => {
    it("should update risk assessment", async () => {
      vi.mocked(prisma.ppmRiskRegister.findFirst).mockResolvedValue({
        id: "r-1",
        probability: 0.5,
        impact: 0.5,
      } as never);
      vi.mocked(prisma.ppmRiskRegister.update).mockResolvedValue({
        id: "r-1",
        severity: "HIGH",
      } as never);

      const result = await service.assessRisk("t-1", "r-1", {
        probability: 0.8,
        impact: 0.6,
        status: "ASSESSED",
      });
      expect(result).toBeDefined();
    });
  });

  describe("getRiskImpactMatrix", () => {
    it("should return 5x5 matrix", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
      } as never);
      vi.mocked(prisma.ppmRiskRegister.findMany).mockResolvedValue([
        { id: "r-1", probability: 0.8, impact: 0.7, severity: "HIGH" } as never,
      ]);

      const result = await service.getRiskImpactMatrix("t-1", "p-1");
      expect(result.matrix).toBeDefined();
      expect(result.totalRisks).toBe(1);
    });
  });

  describe("getRiskDashboard", () => {
    it("should return aggregated dashboard", async () => {
      vi.mocked(prisma.ppmRiskRegister.findMany).mockResolvedValue([
        {
          id: "r-1",
          riskScore: 56,
          severity: "CRITICAL",
          status: "IDENTIFIED",
        } as never,
        {
          id: "r-2",
          riskScore: 12,
          severity: "LOW",
          status: "CLOSED",
        } as never,
        {
          id: "r-3",
          riskScore: 30,
          severity: "HIGH",
          status: "ASSESSED",
        } as never,
      ]);

      const result = await service.getRiskDashboard("t-1");
      expect(result.totalRisks).toBe(3);
      expect(result.bySeverity.critical).toBe(1);
      expect(result.openRisks).toBe(2);
    });
  });
});
