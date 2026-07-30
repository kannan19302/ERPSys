import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class LocalizationReviewService {
  async getReviews(tenantId: string, translationId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (translationId) where.translationId = translationId;
    return prisma.localeTranslationReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async submitReview(
    tenantId: string,
    translationId: string,
    reviewerId: string,
    dto: {
      status: string;
      comment?: string;
    },
  ) {
    return prisma.localeTranslationReview.create({
      data: {
        tenantId,
        translationId,
        reviewerId,
        status: dto.status,
        comment: dto.comment,
        reviewedAt: dto.status !== "PENDING" ? new Date() : undefined,
      },
    });
  }

  async getPendingReviews(tenantId: string) {
    return prisma.localeTranslationReview.findMany({
      where: { tenantId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
  }
}
