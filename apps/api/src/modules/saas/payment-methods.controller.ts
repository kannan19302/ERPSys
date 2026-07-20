import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PaymentMethodsService } from "./payment-methods.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const addPaymentMethodSchema = z.object({
  type: z.enum(["card", "bank", "paypal", "stripe"]),
  token: z.string().min(1),
  isDefault: z.boolean().default(false),
  billingDetails: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    zip: z.string().optional(),
  }).optional(),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().optional(),
  expMonth: z.number().int().min(1).max(12).optional(),
  expYear: z.number().int().min(2024).optional(),
});

const refundSchema = z.object({
  amount: z.number().min(0).optional(),
  reason: z.string().optional(),
});

@ApiTags("saas-payments")
@ApiBearerAuth()
@Controller("saas")
@UseGuards(JwtAuthGuard, RbacGuard)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @ApiOperation({ summary: "List payment methods" })
  @Permissions("saas.payment.read")
  @Get("payment-methods")
  async listPaymentMethods(@Req() req: AuthReq) {
    return this.paymentMethodsService.listPaymentMethods(req.user.tenantId);
  }

  @ApiOperation({ summary: "Add payment method" })
  @Permissions("saas.payment.create")
  @Post("payment-methods")
  async addPaymentMethod(@Req() req: AuthReq, @ZodBody(addPaymentMethodSchema) body: z.infer<typeof addPaymentMethodSchema>) {
    return this.paymentMethodsService.addPaymentMethod(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Set default payment method" })
  @Permissions("saas.payment.read")
  @Patch("payment-methods/:id/default")
  async setDefault(@Req() req: AuthReq, @Param("id") id: string) {
    return this.paymentMethodsService.setDefault(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Remove payment method" })
  @Permissions("saas.payment.delete")
  @Delete("payment-methods/:id")
  async removePaymentMethod(@Req() req: AuthReq, @Param("id") id: string) {
    return this.paymentMethodsService.removePaymentMethod(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List transactions" })
  @Permissions("saas.payment.read")
  @Get("transactions")
  async listTransactions(@Req() req: AuthReq) {
    return this.paymentMethodsService.listTransactions(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get transaction" })
  @Permissions("saas.payment.read")
  @Get("transactions/:id")
  async getTransaction(@Req() req: AuthReq, @Param("id") id: string) {
    return this.paymentMethodsService.getTransaction(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Request refund" })
  @Permissions("saas.payment.create")
  @Post("transactions/:id/refund")
  async requestRefund(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(refundSchema) body: z.infer<typeof refundSchema>) {
    return this.paymentMethodsService.requestRefund(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Get payment stats" })
  @Permissions("saas.payment.read")
  @Get("payments/stats")
  async getPaymentStats(@Req() req: AuthReq) {
    return this.paymentMethodsService.getPaymentStats(req.user.tenantId);
  }
}
