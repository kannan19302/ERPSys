import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { z } from "zod";

export const hierarchyNodeSchema = z.object({
  parentAccountId: z.string().min(1),
  childAccountId: z.string().min(1),
  relationshipType: z
    .enum(["SUBSIDIARY", "DIVISION", "BRANCH", "AFFILIATE"])
    .default("SUBSIDIARY"),
  ownershipPercentage: z.number().min(0).max(100).optional(),
});

@Injectable()
export class CrmAccountHierarchiesDeepService {
  async linkAccountHierarchy(
    tenantId: string,
    data: z.infer<typeof hierarchyNodeSchema>,
  ) {
    const validated = hierarchyNodeSchema.parse(data);
    const parent = await prisma.customer.findFirst({
      where: { tenantId, id: validated.parentAccountId },
    });
    if (!parent) throw new NotFoundException("Parent account not found");

    const child = await prisma.customer.findFirst({
      where: { tenantId, id: validated.childAccountId },
    });
    if (!child) throw new NotFoundException("Child account not found");

    return prisma.customer.update({
      where: { id: validated.childAccountId },
      data: {
        type: `${validated.relationshipType}:${validated.parentAccountId}`,
      },
    });
  }

  async getAccountTree(tenantId: string, rootAccountId: string) {
    const root = await prisma.customer.findFirst({
      where: { tenantId, id: rootAccountId },
      include: { contacts: true, opportunities: true },
    });
    if (!root) throw new NotFoundException("Root account not found");

    const subsidiaries = await prisma.customer.findMany({
      where: { tenantId, type: { contains: rootAccountId } },
      include: { contacts: true, opportunities: true },
    });

    const aggregateArr = [root, ...subsidiaries].reduce(
      (
        sum: number,
        acc: { opportunities: Array<{ stage: string; amount: any }> },
      ) => {
        const dealsWon = acc.opportunities.filter(
          (d: { stage: string }) => d.stage === "CLOSED_WON",
        );
        return (
          sum +
          dealsWon.reduce(
            (dSum: number, d: { amount: any }) =>
              dSum + (d.amount ? Number(d.amount) : 0),
            0,
          )
        );
      },
      0,
    );

    return {
      rootAccountId,
      rootAccountName: root.name,
      totalSubsidiaries: subsidiaries.length,
      aggregateGlobalArr: aggregateArr,
      treeNodes: [
        {
          accountId: root.id,
          name: root.name,
          role: "GLOBAL_ULTIMATE_PARENT",
          childCount: subsidiaries.length,
        },
        ...subsidiaries.map((s) => ({
          accountId: s.id,
          name: s.name,
          role: "SUBSIDIARY",
          childCount: 0,
        })),
      ],
    };
  }

  async getGlobalCreditPool(tenantId: string, globalParentId: string) {
    const tree = await this.getAccountTree(tenantId, globalParentId);
    const poolLimit = 1000000;
    const utilizedCredit = tree.aggregateGlobalArr * 0.4;

    return {
      globalParentId,
      allocatedCreditPoolLimit: poolLimit,
      utilizedCreditAmount: utilizedCredit,
      remainingAvailableCredit: poolLimit - utilizedCredit,
      subsidiaryCreditDrawdowns: tree.treeNodes.map((n) => ({
        accountId: n.accountId,
        accountName: n.name,
        drawnAmount: (utilizedCredit / tree.treeNodes.length).toFixed(2),
      })),
    };
  }

  async getCrossSubsidiaryDeals(tenantId: string, globalParentId: string) {
    const _tree = await this.getAccountTree(tenantId, globalParentId);

    const deals = await prisma.opportunity.findMany({
      where: { tenantId },
      take: 50,
    });

    return {
      globalParentId,
      totalSubsidiaryDeals: deals.length,
      deals: deals.map(
        (d: {
          id: string;
          name: string;
          amount: any;
          stage: string;
          createdAt: Date;
        }) => ({
          dealId: d.id,
          title: d.name,
          amount: d.amount,
          stage: d.stage,
          createdAt: d.createdAt,
        }),
      ),
    };
  }
}
