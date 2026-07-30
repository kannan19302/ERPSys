// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasPortalBillingSelfServiceService } from "./saas-portal-billing-self-service.service";

@ApiTags("SaasPortalBillingSelfService")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas-portal/billing-self-service")
export class SaasPortalBillingSelfServiceController {
  constructor(
    private readonly billingService: SaasPortalBillingSelfServiceService,
  ) {}

  @ApiOperation({ summary: "Get portal account profile" })
  @Permissions("saas_portal.profile.read")
  @Get("profile")
  async getProfile(@Req() req: any) {
    return this.billingService.getProfile(req.user.tenantId);
  }

  @ApiOperation({ summary: "Update portal account profile" })
  @Permissions("saas_portal.profile.update")
  @Put("profile")
  async upsertProfile(@Req() req: any, @Body() dto: any) {
    return this.billingService.upsertProfile(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get portal payment methods" })
  @Permissions("saas_portal.billing.read")
  @Get("payment-methods")
  async getPaymentMethods(@Req() req: any) {
    return this.billingService.getPaymentMethods(req.user.tenantId);
  }

  @ApiOperation({ summary: "Add portal payment method" })
  @Permissions("saas_portal.billing.create")
  @Post("payment-methods")
  async addPaymentMethod(@Req() req: any, @Body() dto: any) {
    return this.billingService.addPaymentMethod(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Log invoice download" })
  @Permissions("saas_portal.billing.read")
  @Post("invoices/:id/download-log")
  async logInvoiceDownload(@Req() req: any, @Param("id") invoiceId: string) {
    return this.billingService.logInvoiceDownload(
      req.user.tenantId,
      req.user.userId,
      invoiceId,
    );
  }
}
