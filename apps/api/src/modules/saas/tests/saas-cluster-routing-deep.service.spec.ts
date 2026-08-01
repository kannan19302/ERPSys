import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasMultiTenantCluster: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    saasTenantNodeRouting: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SaasClusterRoutingDeepService } from "../saas-cluster-routing-deep.service";

describe("SaasClusterRoutingDeepService", () => {
  let service: SaasClusterRoutingDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasClusterRoutingDeepService],
    }).compile();

    service = module.get<SaasClusterRoutingDeepService>(
      SaasClusterRoutingDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getClusters", () => {
    it("should list clusters", async () => {
      (prisma.saasMultiTenantCluster.findMany as any).mockResolvedValue([
        { id: "c1", clusterName: "us-east-1-primary" },
      ]);
      const res = await service.getClusters();
      expect(res.length).toBe(1);
    });
  });
});
