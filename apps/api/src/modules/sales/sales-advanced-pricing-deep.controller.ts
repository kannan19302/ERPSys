// @ts-nocheck
import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SalesAdvancedPricingDeepService } from "./sales-advanced-pricing-deep.service";

@ApiTags("SalesAdvancedPricingDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/advanced-pricing-deep")
export class SalesAdvancedPricingDeepController {
  constructor(
    private readonly pricingService: SalesAdvancedPricingDeepService,
  ) {}

  @ApiOperation({ summary: "Calculate volume tier discount" })
  @Permissions("sales.pricing.read")
  @Post("volume-discount")
  async calculateVolumeDiscount(
    @Req() req: any,
    @Body() dto: { productId: string; quantity: number; basePrice: number },
  ) {
    return this.pricingService.calculateVolumeDiscount(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get currency exchange pricing matrices" })
  @Permissions("sales.pricing.read")
  @Get("currency-matrices")
  async getCurrencyMatrices(@Req() req: any) {
    return this.pricingService.getCurrencyMatrices(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get pricing rule sets" })
  @Permissions("sales.pricing.read")
  @Get("rule-sets")
  async getPricingRuleSets(@Req() req: any) {
    return this.pricingService.getPricingRuleSets(req.user.tenantId);
  }
}
