import { Controller, Get, Post, Put, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PosExpansionService } from './pos-expansion.service';
import {
  CreatePosShiftSchema, ClosePosShiftSchema, CreatePosRegisterSchema, ClosePosRegisterSchema,
  CreatePosPaymentMethodSchema, UpdatePosPaymentMethodSchema, CreatePosRefundSchema, ApprovePosRefundSchema,
  IssuePosGiftCardSchema, TopUpPosGiftCardSchema, CreatePosOrderTypeSchema, CreatePosDiscountRuleSchema,
  CreatePosTaxRuleSchema, CreatePosKitchenDisplaySchema, UpdatePosKitchenOrderStatusSchema, CreatePosSplitPaymentSchema,
} from './dto/pos-expansion.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('pos')
@ApiBearerAuth()
@Controller('pos')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PosExpansionController {
  constructor(private readonly posExpansionService: PosExpansionService) {}

  // ═══ SHIFTS ═══

  @Get('exp/shifts')
  @Permissions('pos.shift.read')
  @ApiOperation({ summary: 'List shifts' })
  async getShifts(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.posExpansionService.getShifts(req.user.tenantId, query);
  }

  @Get('exp/shifts/:id')
  @Permissions('pos.shift.read')
  @ApiOperation({ summary: 'Get shift by id' })
  async getShiftById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posExpansionService.getShiftById(req.user.tenantId, id);
  }

  @Post('exp/shifts')
  @Permissions('pos.shift.manage')
  @ApiOperation({ summary: 'Start a new shift' })
  async startShift(@Req() req: AuthenticatedRequest, @ZodBody(CreatePosShiftSchema) dto: any) {
    return this.posExpansionService.startShift(req.user.tenantId, dto);
  }

  @Put('exp/shifts/:id/close')
  @Permissions('pos.shift.manage')
  @ApiOperation({ summary: 'Close a shift' })
  async closeShift(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(ClosePosShiftSchema) dto: any) {
    return this.posExpansionService.closeShift(req.user.tenantId, id, dto);
  }

  @Get('exp/shifts/:id/cash-drawers')
  @Permissions('pos.shift.read')
  @ApiOperation({ summary: 'Get cash drawer entries for a shift' })
  async getCashDrawers(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posExpansionService.getCashDrawers(req.user.tenantId, id);
  }

  @Post('exp/shifts/:id/cash-drawers')
  @Permissions('pos.shift.manage')
  @ApiOperation({ summary: 'Add cash drawer entry' })
  async addCashDrawer(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.object({ type: z.enum(['CASH_IN', 'CASH_OUT', 'DECLARE']), amount: z.number(), reason: z.string().optional() })) dto: any) {
    return this.posExpansionService.addCashDrawer(req.user.tenantId, id, { ...dto, createdBy: req.user.userId });
  }

  // ═══ REGISTERS ═══

  @Get('exp/registers')
  @Permissions('pos.register.read')
  @ApiOperation({ summary: 'List registers' })
  async getRegisters(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.posExpansionService.getRegisters(req.user.tenantId, query);
  }

  @Get('exp/registers/:id')
  @Permissions('pos.register.read')
  @ApiOperation({ summary: 'Get register by id' })
  async getRegisterById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posExpansionService.getRegisterById(req.user.tenantId, id);
  }

  @Post('exp/registers')
  @Permissions('pos.register.open')
  @ApiOperation({ summary: 'Open a register session' })
  async openRegister(@Req() req: AuthenticatedRequest, @ZodBody(CreatePosRegisterSchema) dto: any) {
    return this.posExpansionService.openRegister(req.user.tenantId, dto, req.user.userId);
  }

  @Put('exp/registers/:id/close')
  @Permissions('pos.register.close')
  @ApiOperation({ summary: 'Close a register session' })
  async closeRegister(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(ClosePosRegisterSchema) dto: any) {
    return this.posExpansionService.closeRegister(req.user.tenantId, id, dto);
  }

  // ═══ PAYMENT METHODS ═══

  @Get('exp/payment-methods')
  @Permissions('pos.payment-method.read')
  @ApiOperation({ summary: 'List payment methods' })
  async getPaymentMethods(@Req() req: AuthenticatedRequest) {
    return this.posExpansionService.getPaymentMethods(req.user.tenantId);
  }

  @Post('exp/payment-methods')
  @Permissions('pos.payment-method.create')
  @ApiOperation({ summary: 'Create payment method' })
  async createPaymentMethod(@Req() req: AuthenticatedRequest, @ZodBody(CreatePosPaymentMethodSchema) dto: any) {
    return this.posExpansionService.createPaymentMethod(req.user.tenantId, dto);
  }

  @Put('exp/payment-methods/:id')
  @Permissions('pos.payment-method.update')
  @ApiOperation({ summary: 'Update payment method' })
  async updatePaymentMethod(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(UpdatePosPaymentMethodSchema) dto: any) {
    return this.posExpansionService.updatePaymentMethod(req.user.tenantId, id, dto);
  }

  @Delete('exp/payment-methods/:id')
  @Permissions('pos.payment-method.delete')
  @ApiOperation({ summary: 'Delete payment method' })
  async deletePaymentMethod(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posExpansionService.deletePaymentMethod(req.user.tenantId, id);
  }

  // ═══ REFUNDS ═══

  @Get('exp/refunds')
  @Permissions('pos.return.read')
  @ApiOperation({ summary: 'List refunds' })
  async getRefunds(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.posExpansionService.getRefunds(req.user.tenantId, query);
  }

  @Get('exp/refunds/:id')
  @Permissions('pos.return.read')
  @ApiOperation({ summary: 'Get refund by id' })
  async getRefundById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posExpansionService.getRefundById(req.user.tenantId, id);
  }

  @Post('exp/refunds')
  @Permissions('pos.return.create')
  @ApiOperation({ summary: 'Create refund/return' })
  async createRefund(@Req() req: AuthenticatedRequest, @ZodBody(CreatePosRefundSchema) dto: any) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posExpansionService.createRefund(req.user.tenantId, orgId, { ...dto, processedBy: req.user.userId });
  }

  @Put('exp/refunds/:id/approve')
  @Permissions('pos.return.create')
  @ApiOperation({ summary: 'Approve or reject refund' })
  async approveRefund(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(ApprovePosRefundSchema) dto: any) {
    return this.posExpansionService.approveRefund(req.user.tenantId, id, dto);
  }

  // ═══ GIFT CARDS ═══

  @Get('exp/gift-cards')
  @Permissions('pos.gift-card.read')
  @ApiOperation({ summary: 'List gift cards' })
  async getGiftCards(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.posExpansionService.getGiftCards(req.user.tenantId, query);
  }

  @Post('exp/gift-cards')
  @Permissions('pos.gift-card.create')
  @ApiOperation({ summary: 'Issue a gift card' })
  async issueGiftCard(@Req() req: AuthenticatedRequest, @ZodBody(IssuePosGiftCardSchema) dto: any) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posExpansionService.issueGiftCard(req.user.tenantId, orgId, dto, req.user.userId);
  }

  @Post('exp/gift-cards/:id/top-up')
  @Permissions('pos.gift-card.create')
  @ApiOperation({ summary: 'Top up gift card balance' })
  async topUpGiftCard(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(TopUpPosGiftCardSchema) dto: any) {
    return this.posExpansionService.topUpGiftCard(req.user.tenantId, id, dto, req.user.userId);
  }

  @Get('exp/gift-cards/:id/transactions')
  @Permissions('pos.gift-card.read')
  @ApiOperation({ summary: 'Get gift card transactions' })
  async getGiftCardTransactions(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posExpansionService.getGiftCardTransactions(req.user.tenantId, id);
  }

  @Post('exp/gift-cards/check-balance')
  @Permissions('pos.gift-card.read')
  @ApiOperation({ summary: 'Check gift card balance by code' })
  async checkGiftCardBalance(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ code: z.string() })) dto: any) {
    return this.posExpansionService.checkGiftCardBalance(req.user.tenantId, dto.code);
  }

  // ═══ ORDER TYPES ═══

  @Get('exp/order-types')
  @Permissions('pos.order-type.read')
  @ApiOperation({ summary: 'List order types' })
  async getOrderTypes(@Req() req: AuthenticatedRequest) {
    return this.posExpansionService.getOrderTypes(req.user.tenantId);
  }

  @Post('exp/order-types')
  @Permissions('pos.order-type.create')
  @ApiOperation({ summary: 'Create order type' })
  async createOrderType(@Req() req: AuthenticatedRequest, @ZodBody(CreatePosOrderTypeSchema) dto: any) {
    return this.posExpansionService.createOrderType(req.user.tenantId, dto);
  }

  @Put('exp/order-types/:id')
  @Permissions('pos.order-type.update')
  @ApiOperation({ summary: 'Update order type' })
  async updateOrderType(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreatePosOrderTypeSchema.partial()) dto: any) {
    return this.posExpansionService.updateOrderType(req.user.tenantId, id, dto);
  }

  // ═══ DISCOUNT RULES ═══

  @Get('exp/discount-rules')
  @Permissions('pos.discount.read')
  @ApiOperation({ summary: 'List discount rules' })
  async getDiscountRules(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.posExpansionService.getDiscountRules(req.user.tenantId, query);
  }

  @Post('exp/discount-rules')
  @Permissions('pos.discount.create')
  @ApiOperation({ summary: 'Create discount rule' })
  async createDiscountRule(@Req() req: AuthenticatedRequest, @ZodBody(CreatePosDiscountRuleSchema) dto: any) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.posExpansionService.createDiscountRule(req.user.tenantId, orgId, dto);
  }

  @Put('exp/discount-rules/:id')
  @Permissions('pos.discount.update')
  @ApiOperation({ summary: 'Update discount rule' })
  async updateDiscountRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreatePosDiscountRuleSchema.partial()) dto: any) {
    return this.posExpansionService.updateDiscountRule(req.user.tenantId, id, dto);
  }

  @Delete('exp/discount-rules/:id')
  @Permissions('pos.discount.delete')
  @ApiOperation({ summary: 'Delete discount rule' })
  async deleteDiscountRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posExpansionService.deleteDiscountRule(req.user.tenantId, id);
  }

  // ═══ TAX RULES ═══

  @Get('exp/tax-rules')
  @Permissions('pos.tax-rule.read')
  @ApiOperation({ summary: 'List tax rules' })
  async getTaxRules(@Req() req: AuthenticatedRequest) {
    return this.posExpansionService.getTaxRules(req.user.tenantId);
  }

  @Post('exp/tax-rules')
  @Permissions('pos.tax-rule.create')
  @ApiOperation({ summary: 'Create tax rule' })
  async createTaxRule(@Req() req: AuthenticatedRequest, @ZodBody(CreatePosTaxRuleSchema) dto: any) {
    return this.posExpansionService.createTaxRule(req.user.tenantId, dto);
  }

  @Put('exp/tax-rules/:id')
  @Permissions('pos.tax-rule.update')
  @ApiOperation({ summary: 'Update tax rule' })
  async updateTaxRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreatePosTaxRuleSchema.partial()) dto: any) {
    return this.posExpansionService.updateTaxRule(req.user.tenantId, id, dto);
  }

  @Delete('exp/tax-rules/:id')
  @Permissions('pos.tax-rule.delete')
  @ApiOperation({ summary: 'Delete tax rule' })
  async deleteTaxRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posExpansionService.deleteTaxRule(req.user.tenantId, id);
  }

  // ═══ KITCHEN DISPLAY ═══

  @Get('exp/kitchen-displays')
  @Permissions('pos.kitchen-display.read')
  @ApiOperation({ summary: 'List kitchen displays' })
  async getKitchenDisplays(@Req() req: AuthenticatedRequest) {
    return this.posExpansionService.getKitchenDisplays(req.user.tenantId);
  }

  @Post('exp/kitchen-displays')
  @Permissions('pos.kitchen-display.create')
  @ApiOperation({ summary: 'Create kitchen display' })
  async createKitchenDisplay(@Req() req: AuthenticatedRequest, @ZodBody(CreatePosKitchenDisplaySchema) dto: any) {
    return this.posExpansionService.createKitchenDisplay(req.user.tenantId, dto);
  }

  @Put('exp/kitchen-displays/:id')
  @Permissions('pos.kitchen-display.update')
  @ApiOperation({ summary: 'Update kitchen display' })
  async updateKitchenDisplay(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreatePosKitchenDisplaySchema.partial()) dto: any) {
    return this.posExpansionService.updateKitchenDisplay(req.user.tenantId, id, dto);
  }

  @Delete('exp/kitchen-displays/:id')
  @Permissions('pos.kitchen-display.delete')
  @ApiOperation({ summary: 'Delete kitchen display' })
  async deleteKitchenDisplay(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.posExpansionService.deleteKitchenDisplay(req.user.tenantId, id);
  }

  @Get('exp/kitchen-displays/:id/orders')
  @Permissions('pos.kitchen-display.read')
  @ApiOperation({ summary: 'Get kitchen orders for display' })
  async getKitchenOrders(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('status') status?: string) {
    return this.posExpansionService.getKitchenOrders(req.user.tenantId, id, status);
  }

  @Put('exp/kitchen-orders/:id/status')
  @Permissions('pos.kitchen-display.update')
  @ApiOperation({ summary: 'Update kitchen order status' })
  async updateKitchenOrderStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(UpdatePosKitchenOrderStatusSchema) dto: any) {
    return this.posExpansionService.updateKitchenOrderStatus(req.user.tenantId, id, dto);
  }

  // ═══ SPLIT PAYMENTS ═══

  @Post('exp/split-payments')
  @Permissions('pos.split-payment.create')
  @ApiOperation({ summary: 'Process split payment' })
  async processSplitPayment(@Req() req: AuthenticatedRequest, @ZodBody(CreatePosSplitPaymentSchema) dto: any) {
    return this.posExpansionService.processSplitPayment(req.user.tenantId, dto);
  }

  @Get('exp/split-payments/:orderId')
  @Permissions('pos.split-payment.read')
  @ApiOperation({ summary: 'Get split payments for order' })
  async getSplitPayments(@Req() req: AuthenticatedRequest, @Param('orderId') orderId: string) {
    return this.posExpansionService.getSplitPayments(req.user.tenantId, orderId);
  }
}
