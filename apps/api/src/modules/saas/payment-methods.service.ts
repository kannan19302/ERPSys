import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class PaymentMethodsService {
  async listPaymentMethods(tenantId: string) {
    return prisma.paymentMethod.findMany({
      where: { tenantId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async addPaymentMethod(tenantId: string, dto: {
    type: string;
    token: string;
    isDefault: boolean;
    billingDetails?: Record<string, unknown>;
    cardLast4?: string;
    cardBrand?: string;
    expMonth?: number;
    expYear?: number;
  }) {
    if (dto.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.paymentMethod.create({
      data: {
        tenantId,
        provider: dto.type === "card" ? "STRIPE" : dto.type.toUpperCase(),
        providerPaymentMethodId: dto.token,
        cardBrand: dto.cardBrand,
        cardLast4: dto.cardLast4,
        isDefault: dto.isDefault,
      },
    });
  }

  async setDefault(tenantId: string, id: string) {
    const pm = await prisma.paymentMethod.findFirst({
      where: { id, tenantId },
    });
    if (!pm) throw new NotFoundException("Payment method not found");

    await prisma.paymentMethod.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });

    return prisma.paymentMethod.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async removePaymentMethod(tenantId: string, id: string) {
    const pm = await prisma.paymentMethod.findFirst({
      where: { id, tenantId },
    });
    if (!pm) throw new NotFoundException("Payment method not found");
    return prisma.paymentMethod.delete({ where: { id } });
  }

  async listTransactions(tenantId: string) {
    return prisma.paymentTransaction.findMany({
      where: { tenantId },
      include: { invoice: true, paymentMethod: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTransaction(tenantId: string, id: string) {
    const tx = await prisma.paymentTransaction.findFirst({
      where: { id, tenantId },
      include: { invoice: { include: { lines: true } }, paymentMethod: true },
    });
    if (!tx) throw new NotFoundException("Transaction not found");
    return tx;
  }

  async requestRefund(tenantId: string, transactionId: string, body: { amount?: number; reason?: string }) {
    const tx = await prisma.paymentTransaction.findFirst({
      where: { id: transactionId, tenantId },
    });
    if (!tx) throw new NotFoundException("Transaction not found");
    if (tx.status !== "SUCCEEDED") throw new BadRequestException("Only successful transactions can be refunded");

    return prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: { status: "REFUNDED" },
      }),
      prisma.paymentTransaction.create({
        data: {
          tenantId,
          invoiceId: tx.invoiceId,
          provider: tx.provider,
          type: "REFUND",
          status: "SUCCEEDED",
          amount: body.amount ?? tx.amount,
          currency: tx.currency,
          description: body.reason ?? `Refund of transaction ${transactionId}`,
        },
      }),
    ]);
  }

  async getPaymentStats(tenantId: string) {
    const transactions = await prisma.paymentTransaction.findMany({
      where: { tenantId },
      select: { status: true, amount: true, type: true, createdAt: true },
    });

    const succeededCount = transactions.filter((t) => t.status === "SUCCEEDED").length;
    const totalSucceeded = transactions.filter((t) => t.status === "SUCCEEDED").reduce((s, t) => s + Number(t.amount), 0);

    return {
      totalTransactions: transactions.length,
      succeededCount,
      failedCount: transactions.filter((t) => t.status === "FAILED").length,
      pendingCount: transactions.filter((t) => t.status === "PENDING").length,
      refundedCount: transactions.filter((t) => t.status === "REFUNDED").length,
      totalSucceeded,
      totalFailed: transactions.filter((t) => t.status === "FAILED").reduce((s, t) => s + Number(t.amount), 0),
      successRate: transactions.length > 0 ? Math.round((succeededCount / transactions.length) * 100) : 0,
    };
  }
}
