import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class ReportingVersionsService {
  async getVersions(tenantId: string, reportId: string) {
    return prisma.reportVersion.findMany({
      where: { tenantId, reportId },
      orderBy: { version: "desc" },
    });
  }

  async createVersion(
    tenantId: string,
    reportId: string,
    createdBy: string,
    dto: {
      queryConfig: Record<string, unknown>;
      snapshot?: Record<string, unknown>;
      changeNotes?: string;
    },
  ) {
    const latest = await prisma.reportVersion.findFirst({
      where: { tenantId, reportId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return prisma.reportVersion.create({
      data: {
        tenantId,
        reportId,
        createdBy,
        version: (latest?.version ?? 0) + 1,
        queryConfig: dto.queryConfig as Prisma.InputJsonValue,
        snapshot: (dto.snapshot ?? {}) as Prisma.InputJsonValue,
        changeNotes: dto.changeNotes,
      },
    });
  }

  async getVersionDiff(
    tenantId: string,
    reportId: string,
    v1: number,
    v2: number,
  ) {
    const [a, b] = await Promise.all([
      prisma.reportVersion.findUnique({
        where: {
          tenantId_reportId_version: { tenantId, reportId, version: v1 },
        },
      }),
      prisma.reportVersion.findUnique({
        where: {
          tenantId_reportId_version: { tenantId, reportId, version: v2 },
        },
      }),
    ]);
    if (!a || !b) throw new NotFoundException("One or both versions not found");
    return {
      versionA: a,
      versionB: b,
      changes: this.computeDiff(
        a.queryConfig as Record<string, unknown>,
        b.queryConfig as Record<string, unknown>,
      ),
    };
  }

  private computeDiff(a: Record<string, unknown>, b: Record<string, unknown>) {
    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    for (const key of Object.keys(b)) {
      if (!(key in a)) added.push(key);
      else if (JSON.stringify(a[key]) !== JSON.stringify(b[key]))
        modified.push(key);
    }
    for (const key of Object.keys(a)) {
      if (!(key in b)) removed.push(key);
    }
    return { added, removed, modified };
  }
}
