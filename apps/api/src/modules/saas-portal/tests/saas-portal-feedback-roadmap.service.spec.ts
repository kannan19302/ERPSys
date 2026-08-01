import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasPortalFeatureRequest: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    saasPortalFeatureVote: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SaasPortalFeedbackRoadmapService } from "../saas-portal-feedback-roadmap.service";

describe("SaasPortalFeedbackRoadmapService", () => {
  let service: SaasPortalFeedbackRoadmapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasPortalFeedbackRoadmapService],
    }).compile();

    service = module.get<SaasPortalFeedbackRoadmapService>(
      SaasPortalFeedbackRoadmapService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("submitFeatureRequest", () => {
    it("should submit new feature request", async () => {
      const mockResult = {
        id: "fr-1",
        title: "Dark Mode Support",
        upvotesCount: 1,
      };
      (prisma.saasPortalFeatureRequest.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.submitFeatureRequest("t1", {
        title: "Dark Mode Support",
        description: "Add dark mode UI",
        category: "UI",
      });
      expect(res.title).toBe("Dark Mode Support");
    });
  });
});
