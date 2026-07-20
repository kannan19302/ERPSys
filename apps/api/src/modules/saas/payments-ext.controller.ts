import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PaymentMethodsService } from "./payment-methods.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const addPaymentMethodSchema = z.object({
  type: z.enum(["card", "bank", "paypal"]).default("card"),
  token: z.string().min(1),
  isDefault: z.boolean().default(false),
  cardBrand: z.string().optional(),
  cardLast4: z.string().optional(),
  expMonth: z.number().int().min(1).max(12).optional(),
  expYear: z.number().int().optional(),
});

const makePaymentSchema = z.object({
  amount: z.number().min(0.01),
  currency: z.string().default("USD"),
  description: z.string().optional(),
  paymentMethodId: z.string().optional(),
  invoiceId: z.string().optional(),
});

const currencyRates: Record<string, Record<string, number>> = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 149.5, INR: 83.1, CAD: 1.36, AUD: 1.53, BRL: 4.97 },
  EUR: { USD: 1.09, GBP: 0.86, JPY: 162.5, INR: 90.3, CAD: 1.48, AUD: 1.66 },
  GBP: { USD: 1.27, EUR: 1.16, JPY: 189.2, INR: 105.2, CAD: 1.72, AUD: 1.94 },
};

@ApiTags("saas-payments")
@ApiBearerAuth()
@Controller("saas/payments")
@UseGuards(JwtAuthGuard, RbacGuard)
export class PaymentsExtController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @ApiOperation({ summary: "List saved payment methods" })
  @Permissions("saas.payment.read")
  @Get("methods")
  async listPaymentMethods(@Req() req: AuthReq) {
    return this.paymentMethodsService.listPaymentMethods(req.user.tenantId);
  }

  @ApiOperation({ summary: "Add a new payment method" })
  @Permissions("saas.payment.create")
  @Post("methods")
  async addPaymentMethod(@Req() req: AuthReq, @ZodBody(addPaymentMethodSchema) body: z.infer<typeof addPaymentMethodSchema>) {
    return this.paymentMethodsService.addPaymentMethod(req.user.tenantId, {
      type: body.type,
      token: body.token,
      isDefault: body.isDefault,
      cardBrand: body.cardBrand,
      cardLast4: body.cardLast4,
      expMonth: body.expMonth,
      expYear: body.expYear,
    });
  }

  @ApiOperation({ summary: "Set a payment method as default" })
  @Permissions("saas.payment.create")
  @Patch("methods/:id/default")
  async setDefaultMethod(@Req() req: AuthReq, @Param("id") id: string) {
    return this.paymentMethodsService.setDefault(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Remove a payment method" })
  @Permissions("saas.payment.delete")
  @Delete("methods/:id")
  async removePaymentMethod(@Req() req: AuthReq, @Param("id") id: string) {
    return this.paymentMethodsService.removePaymentMethod(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get a specific payment method" })
  @Permissions("saas.payment.read")
  @Get("methods/:id")
  async getPaymentMethod(@Req() req: AuthReq, @Param("id") id: string) {
    return prisma.paymentMethod.findFirst({ where: { id, tenantId: req.user.tenantId } });
  }

  @ApiOperation({ summary: "Get payment history" })
  @Permissions("saas.payment.read")
  @Get("history")
  async getPaymentHistory(@Req() req: AuthReq) {
    return this.paymentMethodsService.listTransactions(req.user.tenantId);
  }

  @ApiOperation({ summary: "List payment transactions" })
  @Permissions("saas.payment.read")
  @Get("transactions")
  async listPaymentTransactions(
    @Req() req: AuthReq,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const where: Record<string, unknown> = { tenantId: req.user.tenantId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where: where as any,
        include: { invoice: true, paymentMethod: true },
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
      }),
      prisma.paymentTransaction.count({ where: where as any }),
    ]);
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @ApiOperation({ summary: "Get a payment transaction by id" })
  @Permissions("saas.payment.read")
  @Get("transactions/:id")
  async getPaymentTransaction(@Req() req: AuthReq, @Param("id") id: string) {
    return this.paymentMethodsService.getTransaction(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Make a one-time payment" })
  @Permissions("saas.payment.create")
  @Post("pay")
  async makeOneTimePayment(@Req() req: AuthReq, @ZodBody(makePaymentSchema) body: z.infer<typeof makePaymentSchema>) {
    const pm = body.paymentMethodId
      ? await prisma.paymentMethod.findFirst({ where: { id: body.paymentMethodId, tenantId: req.user.tenantId } })
      : await prisma.paymentMethod.findFirst({ where: { tenantId: req.user.tenantId, isDefault: true } });

    return prisma.paymentTransaction.create({
      data: {
        tenantId: req.user.tenantId,
        invoiceId: body.invoiceId ?? undefined,
        paymentMethodId: pm?.id ?? undefined,
        provider: pm?.provider ?? "MANUAL",
        type: "ONE_TIME",
        status: "SUCCEEDED",
        amount: body.amount,
        currency: body.currency,
        description: body.description ?? "One-time payment",
      },
    });
  }

  @ApiOperation({ summary: "Get upcoming scheduled payments" })
  @Permissions("saas.payment.read")
  @Get("upcoming")
  async getUpcomingPayments(@Req() req: AuthReq) {
    const invoices = await prisma.saaSInvoice.findMany({
      where: { tenantId: req.user.tenantId, status: "PENDING", dueDate: { gte: new Date() } },
      orderBy: { dueDate: "asc" },
      take: 10,
    });
    return { upcoming: invoices, total: invoices.length };
  }

  @ApiOperation({ summary: "Get payment status summary" })
  @Permissions("saas.payment.read")
  @Get("status")
  async getPaymentStatus(@Req() req: AuthReq) {
    const [totalPaid, totalPending, totalOverdue, methods] = await Promise.all([
      prisma.paymentTransaction.aggregate({ where: { tenantId: req.user.tenantId, status: "SUCCEEDED" }, _sum: { amount: true } }),
      prisma.saaSInvoice.aggregate({ where: { tenantId: req.user.tenantId, status: "PENDING" }, _sum: { amountDue: true } }),
      prisma.saaSInvoice.aggregate({ where: { tenantId: req.user.tenantId, status: "OVERDUE" }, _sum: { amountDue: true } }),
      prisma.paymentMethod.count({ where: { tenantId: req.user.tenantId } }),
    ]);
    return {
      totalPaid: Number(totalPaid._sum.amount ?? 0),
      pendingAmount: Number(totalPending._sum.amountDue ?? 0),
      overdueAmount: Number(totalOverdue._sum.amountDue ?? 0),
      savedMethods: methods,
      hasDefaultMethod: await prisma.paymentMethod.count({ where: { tenantId: req.user.tenantId, isDefault: true } }).then((c) => c > 0),
    };
  }

  @ApiOperation({ summary: "Get currency exchange rates" })
  @Permissions("saas.payment.read")
  @Get("currency-rates")
  async getCurrencyRates(@Query("base") base?: string) {
    const baseCurrency = (base ?? "USD").toUpperCase();
    const rates = currencyRates[baseCurrency] ?? currencyRates.USD;
    return { base: baseCurrency, rates, updatedAt: "2026-07-19T00:00:00Z" };
  }
}
