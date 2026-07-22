import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SalesPromotionsService } from "./sales-promotions.service";
import {
  createPromotionSchema,
  updatePromotionSchema,
  createCouponSchema,
  applyCouponSchema,
  CreatePromotionDto,
  UpdatePromotionDto,
  CreateCouponDto,
  ApplyCouponDto,
} from "./dto/sales-extra.dto";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("sales-promotions")
@ApiBearerAuth()
@Controller("sales/promotions")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesPromotionsController {
  constructor(private readonly promotionsService: SalesPromotionsService) {}

  @Get()
  @Permissions("sales.promotion.read")
  @ApiOperation({ summary: "List promotions" })
  async getPromotions(@Req() req: AuthenticatedRequest) {
    return this.promotionsService.getPromotions(req.user.tenantId);
  }

  @Get(":id")
  @Permissions("sales.promotion.read")
  @ApiOperation({ summary: "Get promotion by id" })
  async getPromotionById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.promotionsService.getPromotionById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("sales.promotion.create")
  @ApiOperation({ summary: "Create a promotion" })
  async createPromotion(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createPromotionSchema) dto: CreatePromotionDto,
  ) {
    const orgId = req.user.orgId || "org-system-default";
    return this.promotionsService.createPromotion(
      req.user.tenantId,
      orgId,
      dto,
    );
  }

  @Patch(":id")
  @Permissions("sales.promotion.update")
  @ApiOperation({ summary: "Update a promotion" })
  async updatePromotion(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updatePromotionSchema) dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.updatePromotion(req.user.tenantId, id, dto);
  }

  @Delete(":id")
  @Permissions("sales.promotion.delete")
  @ApiOperation({ summary: "Delete (deactivate) a promotion" })
  async deletePromotion(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.promotionsService.deletePromotion(req.user.tenantId, id);
  }

  @Get(":id/coupons")
  @Permissions("sales.coupon.read")
  @ApiOperation({ summary: "List coupons for a promotion" })
  async getCoupons(
    @Req() req: AuthenticatedRequest,
    @Param("id") promotionId: string,
  ) {
    return this.promotionsService.getCoupons(req.user.tenantId, promotionId);
  }

  @Post(":id/coupons")
  @Permissions("sales.coupon.create")
  @ApiOperation({ summary: "Create a coupon for a promotion" })
  async createCoupon(
    @Req() req: AuthenticatedRequest,
    @Param("id") promotionId: string,
    @ZodBody(createCouponSchema) dto: CreateCouponDto,
  ) {
    return this.promotionsService.createCoupon(req.user.tenantId, {
      ...dto,
      promotionId,
    });
  }

  @Patch("coupons/:id")
  @Permissions("sales.coupon.update")
  @ApiOperation({ summary: "Update a coupon" })
  async updateCoupon(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.promotionsService.updateCoupon(req.user.tenantId, id, dto);
  }

  @Delete("coupons/:id")
  @Permissions("sales.coupon.delete")
  @ApiOperation({ summary: "Delete a coupon" })
  async deleteCoupon(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.promotionsService.deleteCoupon(req.user.tenantId, id);
  }

  @Post("apply-coupon")
  @Permissions("sales.promotion.read")
  @ApiOperation({ summary: "Validate and apply a coupon code" })
  async applyCoupon(
    @Req() req: AuthenticatedRequest,
    @ZodBody(applyCouponSchema) dto: ApplyCouponDto,
  ) {
    return this.promotionsService.applyCoupon(
      req.user.tenantId,
      dto.code,
      dto.orderSubtotal,
      dto.customerId,
      dto.productIds,
    );
  }
}
