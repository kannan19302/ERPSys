// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class ReportingBookmarksService {
  async getBookmarks(tenantId: string, userId: string) {
    return prisma.reportBookmark.findMany({
      where: { tenantId, userId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createBookmark(
    tenantId: string,
    userId: string,
    dto: {
      reportId: string;
      label: string;
      filterState?: Record<string, unknown>;
    },
  ) {
    const max = await prisma.reportBookmark.findFirst({
      where: { tenantId, userId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return prisma.reportBookmark.create({
      data: {
        tenantId,
        userId,
        reportId: dto.reportId,
        label: dto.label,
        sortOrder: (max?.sortOrder ?? 0) + 1,
        filterState: (dto.filterState ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async deleteBookmark(tenantId: string, userId: string, id: string) {
    const bm = await prisma.reportBookmark.findFirst({
      where: { tenantId, userId, id },
    });
    if (!bm) throw new NotFoundException("Bookmark not found");
    await prisma.reportBookmark.delete({ where: { id } });
    return { success: true };
  }

  async createBookmarkSimple(tenantId: string, body: any) {
    return prisma.reportBookmark.create({ data: { ...body, tenantId } as any });
  }

  async deleteBookmarkById(id: string) {
    return prisma.reportBookmark.delete({ where: { id } });
  }
}
