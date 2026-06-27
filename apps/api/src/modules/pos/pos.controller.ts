import { Controller, Get, Post, Param, Put, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PosService } from './pos.service';
import { CreatePosOrderSchema, CreatePosOrderDto } from './dto/create-pos-order.dto';
import { QueryPosOrdersSchema } from './dto/query-pos-orders.dto';
import { CreateDiscountSchema } from './dto/create-discount.dto';
import { CreateLoyaltyProgramSchema } from './dto/create-loyalty-program.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('pos')
@ApiBearerAuth()
@Controller('pos')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PosController {
  constructor(private readonly posService: PosService) { }

  // ═══════════════════════════════════════════════════════════════
  // TERMINALS
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Get terminals' })
  @Permissions('pos.read')
  @Get('terminals')
  @Permissions('pos.terminal.read')
  async getTerminals(@Req() req: AuthenticatedRequest) {
    return this.posService.getTerminals(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get terminal' })
  @Permissions('pos.read')
  @Get('terminals/:id')
  @Permissions('pos.terminal.read')
  async getTerminal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.getTerminalById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create terminal' })
  @Permissions('pos.create')
  @Post('terminals')
  @Permissions('pos.terminal.create')
  async createTerminal(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; code: string; warehouseId?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createTerminal(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update terminal' })
  @Permissions('pos.update')
  @Put('terminals/:id')
  @Permissions('pos.terminal.create')
  async updateTerminal(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: any
  ) {
    return this.posService.updateTerminal(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete terminal' })
  @Permissions('pos.delete')
  @Delete('terminals/:id')
  @Permissions('pos.terminal.create')
  async deleteTerminal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.deleteTerminal(req.user.tenantId, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // REGISTERS
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Get registers' })
  @Permissions('pos.read')
  @Get('registers')
  @Permissions('pos.register.read')
  async getRegisters(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.posService.getRegisters(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Open register' })
  @Permissions('pos.create')
  @Post('registers/open')
  @Permissions('pos.register.create')
  async openRegister(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { terminalId: string; startingCash: number }
  ): Promise<unknown> {
    return this.posService.openRegister(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Close register' })
  @Permissions('pos.update')
  @Put('registers/:id/close')
  @Permissions('pos.register.create')
  async closeRegister(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { endingCash: number; actualCash: number }
  ): Promise<unknown> {
    return this.posService.closeRegister(req.user.tenantId, id, dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // SHIFTS
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Get shifts' })
  @Permissions('pos.read')
  @Get('registers/:registerId/shifts')
  @Permissions('pos.shift.read')
  async getShifts(@Req() req: AuthenticatedRequest, @Param('registerId') registerId: string) {
    return this.posService.getShifts(req.user.tenantId, registerId);
  }

  @ApiOperation({ summary: 'Start shift' })
  @Permissions('pos.create')
  @Post('registers/:registerId/shifts/start')
  @Permissions('pos.shift.create')
  async startShift(
    @Req() req: AuthenticatedRequest,
    @Param('registerId') registerId: string,
    @ZodBody(z.any()) dto: { employeeId: string }
  ) {
    return this.posService.startShift(req.user.tenantId, registerId, dto);
  }

  @ApiOperation({ summary: 'End shift' })
  @Permissions('pos.update')
  @Put('shifts/:shiftId/end')
  @Permissions('pos.shift.create')
  async endShift(@Req() req: AuthenticatedRequest, @Param('shiftId') shiftId: string) {
    return this.posService.endShift(req.user.tenantId, shiftId);
  }

  // ═══════════════════════════════════════════════════════════════
  // CASH ENTRIES
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Get cash entries' })
  @Permissions('pos.read')
  @Get('registers/:registerId/cash-entries')
  @Permissions('pos.cash-entry.read')
  async getCashEntries(@Req() req: AuthenticatedRequest, @Param('registerId') registerId: string): Promise<unknown> {
    return this.posService.getCashEntries(req.user.tenantId, registerId);
  }

  @ApiOperation({ summary: 'Add cash entry' })
  @Permissions('pos.create')
  @Post('registers/:registerId/cash-entries')
  @Permissions('pos.cash-entry.create')
  async addCashEntry(
    @Req() req: AuthenticatedRequest,
    @Param('registerId') registerId: string,
    @ZodBody(z.any()) dto: { type: 'IN' | 'OUT'; amount: number; reason?: string }
  ): Promise<unknown> {
    return this.posService.addCashEntry(req.user.tenantId, registerId, dto, req.user.userId || 'system');
  }

  // ═══════════════════════════════════════════════════════════════
  // ORDERS (Phase A)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Create order' })
  @Permissions('pos.create')
  @Post('orders')
  @Permissions('pos.order.create')
  async createOrder(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: CreatePosOrderDto
  ) {
    const parsed = CreatePosOrderSchema.parse(dto);
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createOrder(req.user.tenantId, orgId, parsed, req.user.userId, req.user.email);
  }

  @ApiOperation({ summary: 'Get orders' })
  @Permissions('pos.read')
  @Get('orders')
  @Permissions('pos.order.read')
  async getOrders(
    @Req() req: AuthenticatedRequest,
    @Query() query: any
  ) {
    const parsed = QueryPosOrdersSchema.parse(query);
    return this.posService.getOrders(req.user.tenantId, parsed);
  }

  @ApiOperation({ summary: 'Get order' })
  @Permissions('pos.read')
  @Get('orders/:id')
  @Permissions('pos.order.read')
  async getOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.getOrderById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get order by number' })
  @Permissions('pos.read')
  @Get('orders/number/:orderNumber')
  @Permissions('pos.order.read')
  async getOrderByNumber(@Req() req: AuthenticatedRequest, @Param('orderNumber') orderNumber: string) {
    return this.posService.getOrderByNumber(req.user.tenantId, orderNumber);
  }

  @ApiOperation({ summary: 'Void order' })
  @Permissions('pos.create')
  @Post('orders/:id/void')
  @Permissions('pos.order.create')
  async voidOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { reason: string }
  ) {
    return this.posService.voidOrder(req.user.tenantId, id, dto.reason, req.user.userId);
  }

  @ApiOperation({ summary: 'Generate receipt' })
  @Permissions('pos.create')
  @Post('orders/:id/receipt')
  @Permissions('pos.order.read')
  async generateReceipt(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.generateReceipt(req.user.tenantId, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT SEARCH
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Search products' })
  @Permissions('pos.read')
  @Get('products/search')
  @Permissions('pos.product.search')
  async searchProducts(
    @Req() req: AuthenticatedRequest,
    @Query('q') query: string
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.searchProducts(req.user.tenantId, orgId, query || '');
  }

  // ═══════════════════════════════════════════════════════════════
  // DISCOUNTS & COUPONS (Phase A)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Create discount' })
  @Permissions('pos.create')
  @Post('discounts')
  @Permissions('pos.discount.create')
  async createDiscount(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any
  ) {
    const parsed = CreateDiscountSchema.parse(dto);
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createDiscount(req.user.tenantId, orgId, parsed);
  }

  @ApiOperation({ summary: 'Get discounts' })
  @Permissions('pos.read')
  @Get('discounts')
  @Permissions('pos.discount.read')
  async getDiscounts(@Req() req: AuthenticatedRequest) {
    return this.posService.getDiscounts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get discount' })
  @Permissions('pos.read')
  @Get('discounts/:id')
  @Permissions('pos.discount.read')
  async getDiscount(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.getDiscountById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Validate coupon' })
  @Permissions('pos.create')
  @Post('coupons/validate')
  @Permissions('pos.coupon.validate')
  async validateCoupon(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { code: string; orderAmount: number }
  ) {
    return this.posService.validateCoupon(req.user.tenantId, dto.code, dto.orderAmount);
  }

  @ApiOperation({ summary: 'Create coupon' })
  @Permissions('pos.create')
  @Post('coupons')
  @Permissions('pos.coupon.create')
  async createCoupon(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { code: string; discountId: string; maxUses?: number; validFrom?: string; validTo?: string }
  ) {
    return this.posService.createCoupon(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get coupons' })
  @Permissions('pos.read')
  @Get('coupons')
  @Permissions('pos.coupon.read')
  async getCoupons(@Req() req: AuthenticatedRequest) {
    return this.posService.getCoupons(req.user.tenantId);
  }

  // ═══════════════════════════════════════════════════════════════
  // TAX PROFILES
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Create tax profile' })
  @Permissions('pos.create')
  @Post('tax-profiles')
  @Permissions('pos.tax-profile.create')
  async createTaxProfile(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; rates: any[]; isDefault?: boolean; isInclusive?: boolean }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createTaxProfile(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Get tax profiles' })
  @Permissions('pos.read')
  @Get('tax-profiles')
  @Permissions('pos.tax-profile.read')
  async getTaxProfiles(@Req() req: AuthenticatedRequest) {
    return this.posService.getTaxProfiles(req.user.tenantId);
  }

  // ═══════════════════════════════════════════════════════════════
  // QUICK KEYS
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Get quick keys' })
  @Permissions('pos.read')
  @Get('terminals/:id/quick-keys')
  @Permissions('pos.terminal.read')
  async getQuickKeys(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.getQuickKeys(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Save quick keys' })
  @Permissions('pos.update')
  @Put('terminals/:id/quick-keys')
  @Permissions('pos.terminal.create')
  async saveQuickKeys(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { keys: Array<{ productId?: string; label: string; color?: string; position: number; categoryGroup?: string }> }
  ) {
    return this.posService.saveQuickKeys(req.user.tenantId, id, dto.keys);
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMERS & LOYALTY (Phase B)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Search customers' })
  @Permissions('pos.read')
  @Get('customers/search')
  @Permissions('pos.customer.read')
  async searchCustomers(
    @Req() req: AuthenticatedRequest,
    @Query('q') query: string
  ) {
    return this.posService.searchCustomers(req.user.tenantId, query || '');
  }

  @ApiOperation({ summary: 'Create walk in customer' })
  @Permissions('pos.create')
  @Post('customers/walk-in')
  @Permissions('pos.customer.create')
  async createWalkInCustomer(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; email?: string; phone?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createWalkInCustomer(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Create loyalty program' })
  @Permissions('pos.create')
  @Post('loyalty/programs')
  @Permissions('pos.loyalty.create')
  async createLoyaltyProgram(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any
  ) {
    const parsed = CreateLoyaltyProgramSchema.parse(dto);
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createLoyaltyProgram(req.user.tenantId, orgId, parsed);
  }

  @ApiOperation({ summary: 'Get loyalty programs' })
  @Permissions('pos.read')
  @Get('loyalty/programs')
  @Permissions('pos.loyalty.read')
  async getLoyaltyPrograms(@Req() req: AuthenticatedRequest) {
    return this.posService.getLoyaltyPrograms(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get loyalty members' })
  @Permissions('pos.read')
  @Get('loyalty/programs/:programId/members')
  @Permissions('pos.loyalty.read')
  async getLoyaltyMembers(@Req() req: AuthenticatedRequest, @Param('programId') programId: string) {
    return this.posService.getLoyaltyMembers(req.user.tenantId, programId);
  }

  @ApiOperation({ summary: 'Get loyalty balance' })
  @Permissions('pos.read')
  @Get('loyalty/:customerId/balance')
  @Permissions('pos.loyalty.read')
  async getLoyaltyBalance(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.posService.getLoyaltyBalance(req.user.tenantId, customerId);
  }

  @ApiOperation({ summary: 'Redeem loyalty points' })
  @Permissions('pos.create')
  @Post('loyalty/redeem')
  @Permissions('pos.loyalty.redeem')
  async redeemLoyaltyPoints(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { customerId: string; points: number; orderId: string }
  ) {
    return this.posService.redeemLoyaltyPoints(req.user.tenantId, dto.customerId, dto.points, dto.orderId);
  }

  @ApiOperation({ summary: 'Issue gift card' })
  @Permissions('pos.create')
  @Post('gift-cards')
  @Permissions('pos.gift-card.create')
  async issueGiftCard(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { code: string; initialBalance: number; currency?: string; issuedTo?: string; expiresAt?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.issueGiftCard(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Check gift card balance' })
  @Permissions('pos.create')
  @Post('gift-cards/check-balance')
  @Permissions('pos.gift-card.read')
  async checkGiftCardBalance(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { code: string }
  ) {
    return this.posService.checkGiftCardBalance(req.user.tenantId, dto.code);
  }

  @ApiOperation({ summary: 'Get gift cards' })
  @Permissions('pos.read')
  @Get('gift-cards')
  @Permissions('pos.gift-card.read')
  async getGiftCards(@Req() req: AuthenticatedRequest) {
    return this.posService.getGiftCards(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get store credit' })
  @Permissions('pos.read')
  @Get('store-credits/:customerId')
  @Permissions('pos.store-credit.read')
  async getStoreCredit(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.posService.getStoreCredit(req.user.tenantId, customerId);
  }

  // ═══════════════════════════════════════════════════════════════
  // RETURNS & EXCHANGES (Phase C)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Process return' })
  @Permissions('pos.create')
  @Post('returns')
  @Permissions('pos.return.create')
  async processReturn(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
      originalOrderId: string;
      type: 'RETURN' | 'EXCHANGE';
      reason?: string;
      refundMethod?: string;
      items: Array<{ orderItemId: string; qty: number; refundAmount: number; restock?: boolean; reason?: string }>;
      exchangeOrderId?: string;
    }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.processReturn(req.user.tenantId, orgId, {
      ...dto,
      processedBy: req.user.userId });
  }

  @ApiOperation({ summary: 'Get returns' })
  @Permissions('pos.read')
  @Get('returns')
  @Permissions('pos.return.read')
  async getReturns(@Req() req: AuthenticatedRequest) {
    return this.posService.getReturns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get return' })
  @Permissions('pos.read')
  @Get('returns/:id')
  @Permissions('pos.return.read')
  async getReturn(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.getReturnById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Approve return' })
  @Permissions('pos.create')
  @Post('returns/:id/approve')
  @Permissions('pos.return.create')
  async approveReturn(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.approveReturn(req.user.tenantId, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // HELD ORDERS (Phase D)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Hold order' })
  @Permissions('pos.create')
  @Post('held-orders')
  @Permissions('pos.held-order.create')
  async holdOrder(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
      terminalId: string;
      customerId?: string;
      customerName?: string;
      label?: string;
      items: any[];
      subtotal: number;
      notes?: string;
      expiresInMinutes?: number;
    }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.holdOrder(req.user.tenantId, orgId, {
      ...dto,
      cashierId: req.user.userId });
  }

  @ApiOperation({ summary: 'Get held orders' })
  @Permissions('pos.read')
  @Get('held-orders')
  @Permissions('pos.held-order.read')
  async getHeldOrders(
    @Req() req: AuthenticatedRequest,
    @Query('terminalId') terminalId?: string
  ) {
    return this.posService.getHeldOrders(req.user.tenantId, terminalId);
  }

  @ApiOperation({ summary: 'Resume held order' })
  @Permissions('pos.update')
  @Put('held-orders/:id/resume')
  @Permissions('pos.held-order.create')
  async resumeHeldOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.resumeHeldOrder(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Discard held order' })
  @Permissions('pos.delete')
  @Delete('held-orders/:id')
  @Permissions('pos.held-order.create')
  async discardHeldOrder(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.discardHeldOrder(req.user.tenantId, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRICE LISTS (Phase D)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Create price list' })
  @Permissions('pos.create')
  @Post('price-lists')
  @Permissions('pos.price-list.create')
  async createPriceList(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createPriceList(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Get price lists' })
  @Permissions('pos.read')
  @Get('price-lists')
  @Permissions('pos.price-list.read')
  async getPriceLists(@Req() req: AuthenticatedRequest) {
    return this.posService.getPriceLists(req.user.tenantId);
  }

  // ═══════════════════════════════════════════════════════════════
  // PROMOTIONS (Phase D)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Create promotion' })
  @Permissions('pos.create')
  @Post('promotions')
  @Permissions('pos.promotion.create')
  async createPromotion(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createPromotion(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Get promotions' })
  @Permissions('pos.read')
  @Get('promotions')
  @Permissions('pos.promotion.read')
  async getPromotions(@Req() req: AuthenticatedRequest) {
    return this.posService.getPromotions(req.user.tenantId);
  }

  // ═══════════════════════════════════════════════════════════════
  // OPEN TABS (Phase D)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Create open tab' })
  @Permissions('pos.create')
  @Post('open-tabs')
  @Permissions('pos.open-tab.create')
  async createOpenTab(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
      terminalId: string;
      customerId?: string;
      customerName?: string;
      items?: any[];
      notes?: string;
    }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createOpenTab(req.user.tenantId, orgId, {
      ...dto,
      cashierId: req.user.userId });
  }

  @ApiOperation({ summary: 'Get open tabs' })
  @Permissions('pos.read')
  @Get('open-tabs')
  @Permissions('pos.open-tab.read')
  async getOpenTabs(@Req() req: AuthenticatedRequest) {
    return this.posService.getOpenTabs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Close open tab' })
  @Permissions('pos.update')
  @Put('open-tabs/:id/close')
  @Permissions('pos.open-tab.create')
  async closeOpenTab(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.closeOpenTab(req.user.tenantId, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // LAYAWAY (Phase D)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Create layaway' })
  @Permissions('pos.create')
  @Post('layaway')
  @Permissions('pos.layaway.create')
  async createLayaway(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: any
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posService.createLayaway(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Get layaways' })
  @Permissions('pos.read')
  @Get('layaway')
  @Permissions('pos.layaway.read')
  async getLayaways(@Req() req: AuthenticatedRequest) {
    return this.posService.getLayaways(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Record layaway payment' })
  @Permissions('pos.create')
  @Post('layaway/:id/payment')
  @Permissions('pos.layaway.create')
  async recordLayawayPayment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { amount: number; method: string; reference?: string; notes?: string }
  ) {
    return this.posService.recordLayawayPayment(req.user.tenantId, id, {
      ...dto,
      createdBy: req.user.userId });
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER DISPLAY (Phase D)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Get customer display config' })
  @Permissions('pos.read')
  @Get('customer-display/:terminalId')
  @Permissions('pos.terminal.read')
  async getCustomerDisplayConfig(@Req() req: AuthenticatedRequest, @Param('terminalId') terminalId: string) {
    return this.posService.getCustomerDisplayConfig(req.user.tenantId, terminalId);
  }

  @ApiOperation({ summary: 'Update customer display config' })
  @Permissions('pos.update')
  @Put('customer-display/:terminalId')
  @Permissions('pos.terminal.create')
  async updateCustomerDisplayConfig(
    @Req() req: AuthenticatedRequest,
    @Param('terminalId') terminalId: string,
    @ZodBody(z.any()) dto: { enabled: boolean; template?: string; showCart?: boolean; showTotal?: boolean; showPromo?: boolean }
  ) {
    return this.posService.updateCustomerDisplayConfig(req.user.tenantId, terminalId, dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // REPORTING (Phase E)
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Get daily summary' })
  @Permissions('pos.read')
  @Get('summary/daily')
  @Permissions('pos.report.read')
  async getDailySummary(
    @Req() req: AuthenticatedRequest,
    @Query('date') date?: string
  ) {
    return this.posService.getDailySummary(req.user.tenantId, date);
  }

  @ApiOperation({ summary: 'Get shift report' })
  @Permissions('pos.read')
  @Get('summary/shift/:shiftId')
  @Permissions('pos.report.read')
  async getShiftReport(@Req() req: AuthenticatedRequest, @Param('shiftId') shiftId: string) {
    return this.posService.getShiftReport(req.user.tenantId, shiftId);
  }

  @ApiOperation({ summary: 'Get sales by product' })
  @Permissions('pos.read')
  @Get('reports/sales-by-product')
  @Permissions('pos.report.read')
  async getSalesByProduct(
    @Req() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.posService.getSalesByProduct(req.user.tenantId, dateFrom, dateTo);
  }

  @ApiOperation({ summary: 'Get sales by cashier' })
  @Permissions('pos.read')
  @Get('reports/sales-by-cashier')
  @Permissions('pos.report.read')
  async getSalesByCashier(
    @Req() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.posService.getSalesByCashier(req.user.tenantId, dateFrom, dateTo);
  }

  @ApiOperation({ summary: 'Get sales by hour' })
  @Permissions('pos.read')
  @Get('reports/sales-by-hour')
  @Permissions('pos.report.read')
  async getSalesByHour(
    @Req() req: AuthenticatedRequest,
    @Query('date') date?: string
  ) {
    return this.posService.getSalesByHour(req.user.tenantId, date);
  }

  @ApiOperation({ summary: 'Get sales by payment method' })
  @Permissions('pos.read')
  @Get('reports/sales-by-payment')
  @Permissions('pos.report.read')
  async getSalesByPaymentMethod(
    @Req() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.posService.getSalesByPaymentMethod(req.user.tenantId, dateFrom, dateTo);
  }

  @ApiOperation({ summary: 'Get discount usage' })
  @Permissions('pos.read')
  @Get('reports/discount-usage')
  @Permissions('pos.report.read')
  async getDiscountUsage(
    @Req() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.posService.getDiscountUsage(req.user.tenantId, dateFrom, dateTo);
  }

  @ApiOperation({ summary: 'Get customer insights' })
  @Permissions('pos.read')
  @Get('reports/customer-insights')
  @Permissions('pos.report.read')
  async getCustomerInsights(@Req() req: AuthenticatedRequest) {
    return this.posService.getCustomerInsights(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get register summary' })
  @Permissions('pos.read')
  @Get('reports/register-summary')
  @Permissions('pos.report.read')
  async getRegisterSummary(
    @Req() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.posService.getRegisterSummary(req.user.tenantId, dateFrom, dateTo);
  }

  // ═══════════════════════════════════════════════════════════════
  // RECEIPT TEMPLATE & DIAGNOSTICS
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({ summary: 'Update terminal receipt template' })
  @Permissions('pos.update')
  @Put('terminals/:id/receipt-template')
  @Permissions('pos.terminal.create')
  async updateTerminalReceiptTemplate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { receiptTemplate: string; layoutFormat: string }
  ) {
    return this.posService.updateTerminalReceiptTemplate(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Get terminal diagnostics' })
  @Permissions('pos.read')
  @Get('terminals/:id/diagnostics')
  @Permissions('pos.terminal.read')
  async getTerminalDiagnostics(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posService.getTerminalDiagnostics(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Update terminal diagnostics' })
  @Permissions('pos.update')
  @Put('terminals/:id/diagnostics')
  @Permissions('pos.terminal.create')
  async updateTerminalDiagnostics(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { diagnosticData: any }
  ) {
    return this.posService.updateTerminalDiagnostics(req.user.tenantId, id, dto);
  }
}