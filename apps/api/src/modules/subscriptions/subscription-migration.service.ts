import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class SubscriptionMigrationService {
  async getMigrations(tenantId: string, subscriptionId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (subscriptionId) where.subscriptionId = subscriptionId;
    return prisma.subscriptionMigration.findMany({
      where,
      orderBy: { effectiveDate: "desc" },
    });
  }

  async migrate(
    tenantId: string,
    subscriptionId: string,
    initiatedBy: string,
    dto: {
      toPlanTierId: string;
      effectiveDate: string;
      reason?: string;
    },
  ) {
    const sub = await prisma.subscription.findFirst({
      where: { tenantId, id: subscriptionId },
    });
    if (!sub) throw new NotFoundException("Subscription not found");
    const newPlan = await prisma.subscriptionPlanTier.findFirst({
      where: { tenantId, id: dto.toPlanTierId },
    });
    if (!newPlan) throw new NotFoundException("Target plan not found");
    const migrationType =
      Number(newPlan.monthlyPrice) >= Number(sub.unitAmount)
        ? "UPGRADE"
        : "DOWNGRADE";
    const proratedCredit = Number(sub.unitAmount) * sub.quantity * 0.5;
    const proratedCharge = Number(newPlan.monthlyPrice) * sub.quantity * 0.5;
    return prisma.$transaction(async (tx) => {
      const migration = await tx.subscriptionMigration.create({
        data: {
          tenantId,
          subscriptionId,
          fromPlanTierId: null,
          toPlanTierId: dto.toPlanTierId,
          migrationType,
          effectiveDate: new Date(dto.effectiveDate),
          proratedCredit: new Prisma.Decimal(proratedCredit),
          proratedCharge: new Prisma.Decimal(proratedCharge),
          previousUnitAmount: sub.unitAmount,
          newUnitAmount: newPlan.monthlyPrice,
          reason: dto.reason,
          initiatedBy,
        },
      });
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { unitAmount: newPlan.monthlyPrice, updatedAt: new Date() },
      });
      return migration;
    });
  }

  async getMigrationStats(tenantId: string) {
    const [total, upgrades, downgrades] = await Promise.all([
      prisma.subscriptionMigration.count({ where: { tenantId } }),
      prisma.subscriptionMigration.count({
        where: { tenantId, migrationType: "UPGRADE" },
      }),
      prisma.subscriptionMigration.count({
        where: { tenantId, migrationType: "DOWNGRADE" },
      }),
    ]);
    return {
      total,
      upgrades,
      downgrades,
      upgradeRatio: total > 0 ? Math.round((upgrades / total) * 100) : 0,
    };
  }
}
