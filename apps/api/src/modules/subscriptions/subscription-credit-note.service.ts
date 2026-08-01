import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SubscriptionCreditNoteService {
  async getCreditNotes(tenantId: string, subscriptionId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (subscriptionId) where.subscriptionId = subscriptionId;
    return prisma.subscriptionCreditNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createCreditNote(
    tenantId: string,
    subscriptionId: string,
    createdBy: string,
    dto: {
      creditNoteNo: string;
      amount: number;
      reason: string;
      reasonCategory: string;
      invoiceId?: string;
    },
  ) {
    return prisma.subscriptionCreditNote.create({
      data: {
        tenantId,
        subscriptionId,
        creditNoteNo: dto.creditNoteNo,
        amount: new Prisma.Decimal(dto.amount),
        reason: dto.reason,
        reasonCategory: dto.reasonCategory,
        invoiceId: dto.invoiceId,
        createdBy,
        status: "PENDING",
      },
    });
  }

  async applyCreditNote(tenantId: string, id: string) {
    const cn = await prisma.subscriptionCreditNote.findFirst({
      where: { tenantId, id },
    });
    if (!cn) throw new NotFoundException("Credit note not found");
    if (cn.status !== "PENDING")
      throw new Error("Credit note already applied or voided");
    return prisma.subscriptionCreditNote.update({
      where: { id },
      data: { status: "APPLIED", appliedAt: new Date() },
    });
  }

  async voidCreditNote(tenantId: string, id: string) {
    const cn = await prisma.subscriptionCreditNote.findFirst({
      where: { tenantId, id },
    });
    if (!cn) throw new NotFoundException("Credit note not found");
    return prisma.subscriptionCreditNote.update({
      where: { id },
      data: { status: "VOIDED" },
    });
  }

  async createCreditNoteSimple(tenantId: string, body: any) {
    return prisma.subscriptionCreditNote.create({
      data: { ...body, tenantId } as any,
    });
  }

  async getCreditNoteSummary(tenantId: string) {
    const [pending, applied, voided, total] = await Promise.all([
      prisma.subscriptionCreditNote.aggregate({
        where: { tenantId, status: "PENDING" },
        _sum: { amount: true },
      }),
      prisma.subscriptionCreditNote.aggregate({
        where: { tenantId, status: "APPLIED" },
        _sum: { amount: true },
      }),
      prisma.subscriptionCreditNote.aggregate({
        where: { tenantId, status: "VOIDED" },
        _sum: { amount: true },
      }),
      prisma.subscriptionCreditNote.count({ where: { tenantId } }),
    ]);
    return {
      total,
      pending: pending._sum.amount || 0,
      applied: applied._sum.amount || 0,
      voided: voided._sum.amount || 0,
    };
  }
}
