import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Req, Query } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { SalesAdvancedPricingService } from "./sales-advanced-pricing.service";
import { createCustomerPriceListSchema, updateCustomerPriceListSchema, addPriceListItemSchema, createContractPricingSchema, updateContractPricingSchema, createFloorPriceSchema, updateFloorPriceSchema, approveFloorPriceSchema, calculateTieredPriceSchema, CreateCustomerPriceListDto, UpdateCustomerPriceListDto, AddPriceListItemDto, CreateContractPricingDto, UpdateContractPricingDto, CreateFloorPriceDto, UpdateFloorPriceDto, ApproveFloorPriceDto, CalculateTieredPriceDto } from "./dto/sales-extra.dto";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request { user: { tenantId: string; userId: string; orgId?: string } }

@ApiTags("sales")
@ApiBearerAuth()
@Controller("sales/pricing")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesAdvancedPricingController {
  constructor(private readonly service: SalesAdvancedPricingService) {}

  @Get("customer-price-lists")
  @Permissions("sales.pricing.read")
  @ApiOperation({ summary: "List customer price lists" })
  async getPriceLists(@Req() req: AuthReq, @Query("customerId") customerId?: string) {
    return this.service.getCustomerPriceLists(req.user.tenantId, customerId);
  }

  @Get("customer-price-lists/:id")
  @Permissions("sales.pricing.read")
  @ApiOperation({ summary: "Get customer price list by id" })
  async getPriceListById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getCustomerPriceListById(req.user.tenantId, id);
  }

  @Post("customer-price-lists")
  @Permissions("sales.pricing.create")
  @ApiOperation({ summary: "Create customer price list" })
  async createPriceList(@Req() req: AuthReq, @ZodBody(createCustomerPriceListSchema) dto: CreateCustomerPriceListDto) {
    return this.service.createCustomerPriceList(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Patch("customer-price-lists/:id")
  @Permissions("sales.pricing.update")
  @ApiOperation({ summary: "Update customer price list" })
  async updatePriceList(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateCustomerPriceListSchema) dto: UpdateCustomerPriceListDto) {
    return this.service.updateCustomerPriceList(req.user.tenantId, id, dto);
  }

  @Delete("customer-price-lists/:id")
  @Permissions("sales.pricing.delete")
  @ApiOperation({ summary: "Delete customer price list" })
  async deletePriceList(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.deleteCustomerPriceList(req.user.tenantId, id);
  }

  @Post("customer-price-lists/:id/items")
  @Permissions("sales.pricing.create")
  @ApiOperation({ summary: "Add item to price list" })
  async addItem(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(addPriceListItemSchema) dto: AddPriceListItemDto) {
    return this.service.addPriceListItem(req.user.tenantId, id, dto);
  }

  @Delete("customer-price-list-items/:itemId")
  @Permissions("sales.pricing.delete")
  @ApiOperation({ summary: "Remove price list item" })
  async removeItem(@Req() req: AuthReq, @Param("itemId") itemId: string) {
    return this.service.removePriceListItem(req.user.tenantId, itemId);
  }

  @Get("contract-pricing")
  @Permissions("sales.pricing.read")
  @ApiOperation({ summary: "List contract pricing overrides" })
  async getContractPricing(@Req() req: AuthReq, @Query("contractId") contractId?: string) {
    return this.service.getContractPricing(req.user.tenantId, contractId);
  }

  @Post("contract-pricing")
  @Permissions("sales.pricing.create")
  @ApiOperation({ summary: "Create contract pricing override" })
  async createContractPricing(@Req() req: AuthReq, @ZodBody(createContractPricingSchema) dto: CreateContractPricingDto) {
    return this.service.createContractPricing(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Patch("contract-pricing/:id")
  @Permissions("sales.pricing.update")
  @ApiOperation({ summary: "Update contract pricing override" })
  async updateContractPricing(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateContractPricingSchema) dto: UpdateContractPricingDto) {
    return this.service.updateContractPricing(req.user.tenantId, id, dto);
  }

  @Delete("contract-pricing/:id")
  @Permissions("sales.pricing.delete")
  @ApiOperation({ summary: "Delete contract pricing override" })
  async deleteContractPricing(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.deleteContractPricing(req.user.tenantId, id);
  }

  @Get("floor-prices")
  @Permissions("sales.pricing.read")
  @ApiOperation({ summary: "List floor prices" })
  async getFloorPrices(@Req() req: AuthReq, @Query("productId") productId?: string) {
    return this.service.getFloorPrices(req.user.tenantId, productId);
  }

  @Post("floor-prices")
  @Permissions("sales.pricing.create")
  @ApiOperation({ summary: "Create floor price" })
  async createFloorPrice(@Req() req: AuthReq, @ZodBody(createFloorPriceSchema) dto: CreateFloorPriceDto) {
    return this.service.createFloorPrice(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Patch("floor-prices/:id")
  @Permissions("sales.pricing.update")
  @ApiOperation({ summary: "Update floor price" })
  async updateFloorPrice(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateFloorPriceSchema) dto: UpdateFloorPriceDto) {
    return this.service.updateFloorPrice(req.user.tenantId, id, dto);
  }

  @Post("floor-prices/:id/approve")
  @Permissions("sales.pricing.create")
  @ApiOperation({ summary: "Approve/reject floor price" })
  async approveFloorPrice(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(approveFloorPriceSchema) dto: ApproveFloorPriceDto) {
    return this.service.approveFloorPrice(req.user.tenantId, id, dto.approved, req.user.userId);
  }

  @Post("calculate-tiered")
  @Permissions("sales.pricing.read")
  @ApiOperation({ summary: "Calculate tiered price with all rules" })
  async calculateTiered(@Req() req: AuthReq, @ZodBody(calculateTieredPriceSchema) dto: CalculateTieredPriceDto) {
    return this.service.calculateTieredPrice(req.user.tenantId, dto);
  }

  @Get("analytics")
  @Permissions("sales.pricing.read")
  @ApiOperation({ summary: "Pricing engine analytics" })
  async analytics(@Req() req: AuthReq) {
    return this.service.getPricingAnalytics(req.user.tenantId);
  }
}
