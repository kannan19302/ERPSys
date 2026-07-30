// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasPortalFeedbackRoadmapService {
  async getFeatureRequests() {
    return prisma.saasPortalFeatureRequest.findMany({
      orderBy: { upvotesCount: "desc" },
    });
  }

  async submitFeatureRequest(
    tenantId: string,
    dto: { title: string; description: string; category: string },
  ) {
    return prisma.saasPortalFeatureRequest.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
      },
    });
  }

  async voteFeatureRequest(
    tenantId: string,
    userId: string,
    requestId: string,
  ) {
    await prisma.saasPortalFeatureVote.create({
      data: {
        requestId,
        tenantId,
        voterId: userId,
      },
    });

    return prisma.saasPortalFeatureRequest.update({
      where: { id: requestId },
      data: {
        upvotesCount: { increment: 1 },
      },
    });
  }
}
