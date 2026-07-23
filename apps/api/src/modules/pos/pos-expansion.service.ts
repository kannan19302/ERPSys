import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { buildPaginationValues, buildOrderBy, paginatedResult, resolveOrgId } from '../../common/utils/pagination.util';

@Injectable()
export class PosExpansionService {
  constructor(@Inject(EventEmitter2) private readonly eventEmitter?: EventEmitter2) {}

  private get p(): any { return prisma; }

  // ═══ SHIFT MANAGEMENT ═══

  async getShifts(tenantId: string, query: { registerId?: string; status?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.registerId) where.registerId = query.registerId;
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.p.posShift.findMany({ where, orderBy: { startTime: 'desc' }, skip, take, include: { _count: { select: { shiftTransactions: true } } } }),
      this.p.posShift.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async getShiftById(tenantId: string, id: string) {
    const shift = await this.p.posShift.findFirst({ where: { id, tenantId }, include: { cashDrawers: true, shiftTransactions: true } });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async startShift(tenantId: string, dto: { registerId: string; employeeId: string; openingCash: number; notes?: string }) {
    const active = await this.p.posShift.findFirst({ where: { tenantId, registerId: dto.registerId, status: 'OPEN' } });
    if (active) throw new BadRequestException('An active shift already exists on this register');
    const register = await this.p.pOSRegister.findFirst({ where: { id: dto.registerId, tenantId } });
    if (!register) throw new NotFoundException('Register not found');
    return this.p.posShift.create({
      data: {
        tenantId, registerId: dto.registerId, employeeId: dto.employeeId,
        openingCash: new Prisma.Decimal(dto.openingCash), notes: dto.notes || null,
        status: 'OPEN', startTime: new Date(),
      },
    });
  }

  async closeShift(tenantId: string, shiftId: string, dto: { closingCash: number; declaredCash: number; notes?: string }) {
    const shift = await this.p.posShift.findFirst({ where: { id: shiftId, tenantId } });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status === 'CLOSED') throw new BadRequestException('Shift is already closed');
    const variance = new Prisma.Decimal(dto.declaredCash).sub(new Prisma.Decimal(dto.closingCash));
    return this.p.posShift.update({
      where: { id: shiftId },
      data: { status: 'CLOSED', endTime: new Date(), closingCash: new Prisma.Decimal(dto.closingCash), declaredCash: new Prisma.Decimal(dto.declaredCash), cashVariance: variance, notes: dto.notes || null },
    });
  }

  async addCashDrawer(tenantId: string, shiftId: string, dto: { type: string; amount: number; reason?: string; createdBy: string }) {
    const shift = await this.p.posShift.findFirst({ where: { id: shiftId, tenantId } });
    if (!shift) throw new NotFoundException('Shift not found');
    return this.p.posShiftCashDrawer.create({
      data: { tenantId, shiftId, type: dto.type, amount: new Prisma.Decimal(dto.amount), reason: dto.reason || null, createdBy: dto.createdBy },
    });
  }

  async getCashDrawers(tenantId: string, shiftId: string) {
    return this.p.posShiftCashDrawer.findMany({ where: { tenantId, shiftId }, orderBy: { createdAt: 'desc' } });
  }

  // ═══ REGISTER MANAGEMENT ═══

  async getRegisters(tenantId: string, query: { terminalId?: string; status?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.terminalId) where.terminalId = query.terminalId;
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.p.posRegister.findMany({ where, orderBy: { openedAt: 'desc' }, skip, take, include: { terminal: true } }),
      this.p.posRegister.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async getRegisterById(tenantId: string, id: string) {
    const reg = await this.p.posRegister.findFirst({ where: { id, tenantId }, include: { terminal: true } });
    if (!reg) throw new NotFoundException('Register not found');
    return reg;
  }

  async openRegister(tenantId: string, dto: { terminalId: string; startingCash: number }, userId: string) {
    const active = await this.p.posRegister.findFirst({ where: { tenantId, terminalId: dto.terminalId, status: 'OPEN' } });
    if (active) throw new BadRequestException('This terminal already has an open register session');
    return this.p.posRegister.create({
      data: { tenantId, terminalId: dto.terminalId, openedById: userId, startingCash: new Prisma.Decimal(dto.startingCash), status: 'OPEN' },
    });
  }

  async closeRegister(tenantId: string, id: string, dto: { endingCash: number; actualCash: number }) {
    const reg = await this.p.posRegister.findFirst({ where: { id, tenantId } });
    if (!reg) throw new NotFoundException('Register not found');
    if (reg.status === 'CLOSED') throw new BadRequestException('Register is already closed');
    const variance = new Prisma.Decimal(dto.actualCash).sub(new Prisma.Decimal(dto.endingCash));
    return this.p.posRegister.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), endingCash: new Prisma.Decimal(dto.endingCash), actualCash: new Prisma.Decimal(dto.actualCash), cashVariance: variance },
    });
  }

  // ═══ PAYMENT METHODS ═══

  async getPaymentMethods(tenantId: string) {
    return this.p.posPaymentMethod.findMany({ where: { tenantId }, orderBy: { sortOrder: 'asc' } });
  }

  async createPaymentMethod(tenantId: string, dto: any) {
    const existing = await this.p.posPaymentMethod.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException('Payment method with this code already exists');
    return this.p.posPaymentMethod.create({ data: { tenantId, ...dto } });
  }

  async updatePaymentMethod(tenantId: string, id: string, dto: any) {
    const method = await this.p.posPaymentMethod.findFirst({ where: { id, tenantId } });
    if (!method) throw new NotFoundException('Payment method not found');
    return this.p.posPaymentMethod.update({ where: { id }, data: dto });
  }

  async deletePaymentMethod(tenantId: string, id: string) {
    const method = await this.p.posPaymentMethod.findFirst({ where: { id, tenantId } });
    if (!method) throw new NotFoundException('Payment method not found');
    return this.p.posPaymentMethod.delete({ where: { id } });
  }

  // ═══ REFUND PROCESSING ═══

  async getRefunds(tenantId: string, query: { status?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.p.posRefund.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { items: true } }),
      this.p.posRefund.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async getRefundById(tenantId: string, id: string) {
    const refund = await this.p.posRefund.findFirst({ where: { id, tenantId }, include: { items: true } });
    if (!refund) throw new NotFoundException('Refund not found');
    return refund;
  }

  async createRefund(tenantId: string, orgId: string, dto: any) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const originalOrder = await this.p.pOSOrder.findFirst({ where: { id: dto.originalOrderId, tenantId }, include: { items: true } });
    if (!originalOrder) throw new NotFoundException('Original order not found');
    const refundNumber = `REF-${Date.now().toString(36).toUpperCase()}`;
    const totalRefund = dto.items.reduce((sum: number, i: any) => sum + i.refundAmount, 0);
    return this.p.$transaction(async (tx: any) => {
      const refund = await tx.posRefund.create({
        data: {
          tenantId, orgId: resolvedOrgId, refundNumber, originalOrderId: dto.originalOrderId,
          type: dto.type || 'REFUND', status: 'PENDING', reason: dto.reason || null,
          refundMethod: dto.refundMethod || null, refundAmount: new Prisma.Decimal(totalRefund),
          exchangeOrderId: dto.exchangeOrderId || null, processedBy: dto.processedBy || 'system',
          notes: dto.notes || null,
        },
      });
      for (const item of dto.items) {
        const orderItem = originalOrder.items.find((oi: any) => oi.id === item.orderItemId);
        await tx.posRefundItem.create({
          data: {
            tenantId, refundId: refund.id, orderItemId: item.orderItemId, productId: orderItem?.productId || null,
            productName: orderItem?.productName || '', qty: new Prisma.Decimal(item.qty),
            unitPrice: new Prisma.Decimal(orderItem?.unitPrice || 0), refundAmount: new Prisma.Decimal(item.refundAmount),
            restock: item.restock !== false, reason: item.reason || null,
          },
        });
        if (item.restock !== false && orderItem?.productId) {
          await this.increaseInventory(tx, tenantId, resolvedOrgId, orderItem.productId, item.qty);
        }
      }
      await tx.pOSOrder.update({ where: { id: dto.originalOrderId }, data: { status: dto.type === 'EXCHANGE' ? 'EXCHANGED' : 'RETURNED' } });
      return refund;
    });
  }

  async approveRefund(tenantId: string, id: string, dto: { approved: boolean; notes?: string }) {
    const refund = await this.p.posRefund.findFirst({ where: { id, tenantId } });
    if (!refund) throw new NotFoundException('Refund not found');
    if (dto.approved) {
      return this.p.posRefund.update({ where: { id }, data: { status: 'APPROVED', approvedAt: new Date(), notes: dto.notes || null } });
    }
    return this.p.posRefund.update({ where: { id }, data: { status: 'REJECTED', notes: dto.notes || null } });
  }

  // ═══ GIFT CARDS ═══

  async getGiftCards(tenantId: string, query: { status?: string; search?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.search) { where.OR = [{ code: { contains: query.search, mode: 'insensitive' } }, { issuedTo: { contains: query.search, mode: 'insensitive' } }]; }
    const [data, total] = await Promise.all([
      this.p.posGiftCard.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.p.posGiftCard.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async issueGiftCard(tenantId: string, orgId: string, dto: any, userId?: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const existing = await this.p.posGiftCard.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException('Gift card code already exists');
    const card = await this.p.posGiftCard.create({
      data: {
        tenantId, orgId: resolvedOrgId, code: dto.code.toUpperCase(),
        initialBalance: new Prisma.Decimal(dto.initialBalance), currentBalance: new Prisma.Decimal(dto.initialBalance),
        currency: dto.currency || 'USD', issuedTo: dto.issuedTo || null, issuedBy: userId || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null, status: 'ACTIVE',
      },
    });
    await this.p.posGiftCardTransaction.create({
      data: { tenantId, giftCardId: card.id, type: 'ISSUE', amount: new Prisma.Decimal(dto.initialBalance), balance: new Prisma.Decimal(dto.initialBalance), createdBy: userId },
    });
    return card;
  }

  async topUpGiftCard(tenantId: string, id: string, dto: { amount: number; notes?: string }, userId?: string) {
    const card = await this.p.posGiftCard.findFirst({ where: { id, tenantId, status: 'ACTIVE' } });
    if (!card) throw new NotFoundException('Active gift card not found');
    return this.p.$transaction(async (tx: any) => {
      const newBalance = Number(card.currentBalance) + dto.amount;
      await tx.posGiftCard.update({ where: { id }, data: { currentBalance: new Prisma.Decimal(newBalance) } });
      return tx.posGiftCardTransaction.create({
        data: { tenantId, giftCardId: id, type: 'TOP_UP', amount: new Prisma.Decimal(dto.amount), balance: new Prisma.Decimal(newBalance), notes: dto.notes || null, createdBy: userId },
      });
    });
  }

  async getGiftCardTransactions(tenantId: string, giftCardId: string) {
    return this.p.posGiftCardTransaction.findMany({ where: { tenantId, giftCardId }, orderBy: { createdAt: 'desc' } });
  }

  async checkGiftCardBalance(tenantId: string, code: string) {
    const card = await this.p.posGiftCard.findFirst({ where: { tenantId, code: code.toUpperCase(), status: 'ACTIVE' } });
    if (!card) throw new NotFoundException('Gift card not found');
    if (card.expiresAt && card.expiresAt < new Date()) throw new BadRequestException('Gift card has expired');
    return { id: card.id, code: card.code, balance: Number(card.currentBalance), currency: card.currency, expiresAt: card.expiresAt };
  }

  // ═══ ORDER TYPES ═══

  async getOrderTypes(tenantId: string) {
    return this.p.posOrderType.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: 'asc' } });
  }

  async createOrderType(tenantId: string, dto: any) {
    const existing = await this.p.posOrderType.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException('Order type with this code already exists');
    if (dto.isDefault) { await this.p.posOrderType.updateMany({ where: { tenantId }, data: { isDefault: false } }); }
    return this.p.posOrderType.create({ data: { tenantId, ...dto } });
  }

  async updateOrderType(tenantId: string, id: string, dto: any) {
    const ot = await this.p.posOrderType.findFirst({ where: { id, tenantId } });
    if (!ot) throw new NotFoundException('Order type not found');
    if (dto.isDefault) { await this.p.posOrderType.updateMany({ where: { tenantId, id: { not: id } }, data: { isDefault: false } }); }
    return this.p.posOrderType.update({ where: { id }, data: dto });
  }

  // ═══ DISCOUNT RULES ═══

  async getDiscountRules(tenantId: string, query: { status?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.p.posDiscountRule.findMany({ where, orderBy: [{ priority: 'asc' }, { name: 'asc' }], skip, take }),
      this.p.posDiscountRule.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async createDiscountRule(tenantId: string, orgId: string, dto: any) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return this.p.posDiscountRule.create({ data: { tenantId, orgId: resolvedOrgId, ...dto, value: new Prisma.Decimal(dto.value), minPurchase: dto.minPurchase ? new Prisma.Decimal(dto.minPurchase) : null, maxDiscount: dto.maxDiscount ? new Prisma.Decimal(dto.maxDiscount) : null } });
  }

  async updateDiscountRule(tenantId: string, id: string, dto: any) {
    const rule = await this.p.posDiscountRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Discount rule not found');
    return this.p.posDiscountRule.update({ where: { id }, data: dto });
  }

  async deleteDiscountRule(tenantId: string, id: string) {
    const rule = await this.p.posDiscountRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Discount rule not found');
    return this.p.posDiscountRule.delete({ where: { id } });
  }

  // ═══ TAX RULES ═══

  async getTaxRules(tenantId: string) {
    return this.p.posTaxRule.findMany({ where: { tenantId, isActive: true }, orderBy: { sortOrder: 'asc' } });
  }

  async createTaxRule(tenantId: string, dto: any) {
    if (dto.isDefault) { await this.p.posTaxRule.updateMany({ where: { tenantId }, data: { isDefault: false } }); }
    return this.p.posTaxRule.create({ data: { tenantId, ...dto, rate: new Prisma.Decimal(dto.rate) } });
  }

  async updateTaxRule(tenantId: string, id: string, dto: any) {
    const rule = await this.p.posTaxRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Tax rule not found');
    if (dto.isDefault) { await this.p.posTaxRule.updateMany({ where: { tenantId, id: { not: id } }, data: { isDefault: false } }); }
    return this.p.posTaxRule.update({ where: { id }, data: dto });
  }

  async deleteTaxRule(tenantId: string, id: string) {
    const rule = await this.p.posTaxRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Tax rule not found');
    return this.p.posTaxRule.delete({ where: { id } });
  }

  // ═══ KITCHEN DISPLAY ═══

  async getKitchenDisplays(tenantId: string) {
    return this.p.posKitchenDisplay.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async createKitchenDisplay(tenantId: string, dto: any) {
    const existing = await this.p.posKitchenDisplay.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException('Kitchen display with this code already exists');
    return this.p.posKitchenDisplay.create({ data: { tenantId, ...dto } });
  }

  async updateKitchenDisplay(tenantId: string, id: string, dto: any) {
    const kd = await this.p.posKitchenDisplay.findFirst({ where: { id, tenantId } });
    if (!kd) throw new NotFoundException('Kitchen display not found');
    return this.p.posKitchenDisplay.update({ where: { id }, data: dto });
  }

  async deleteKitchenDisplay(tenantId: string, id: string) {
    const kd = await this.p.posKitchenDisplay.findFirst({ where: { id, tenantId } });
    if (!kd) throw new NotFoundException('Kitchen display not found');
    return this.p.posKitchenDisplay.delete({ where: { id } });
  }

  async getKitchenOrders(tenantId: string, kitchenDisplayId: string, status?: string) {
    const where: any = { tenantId, kitchenDisplayId };
    if (status) where.status = status;
    return this.p.posKitchenOrder.findMany({ where, orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }] });
  }

  async updateKitchenOrderStatus(tenantId: string, id: string, dto: any) {
    const ko = await this.p.posKitchenOrder.findFirst({ where: { id, tenantId } });
    if (!ko) throw new NotFoundException('Kitchen order not found');
    const updateData: any = { status: dto.status };
    if (dto.status === 'PREPARING') updateData.startedAt = new Date();
    if (dto.status === 'READY' || dto.status === 'SERVED') updateData.completedAt = new Date();
    if (dto.preparedBy) updateData.preparedBy = dto.preparedBy;
    if (dto.note) updateData.note = dto.note;
    return this.p.posKitchenOrder.update({ where: { id }, data: updateData });
  }

  // ═══ SPLIT PAYMENTS ═══

  async processSplitPayment(tenantId: string, dto: { orderId: string; splits: Array<{ method: string; amount: number; reference?: string; cardLast4?: string; authCode?: string; giftCardId?: string }> }) {
    const order = await this.p.pOSOrder.findFirst({ where: { id: dto.orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');
    const totalSplit = dto.splits.reduce((s, sp) => s + sp.amount, 0);
    if (Math.abs(totalSplit - Number(order.grandTotal)) > 0.01) throw new BadRequestException('Split payment totals do not match order grand total');
    return this.p.$transaction(async (tx: any) => {
      for (const split of dto.splits) {
        await tx.posSplitPayment.create({
          data: { tenantId, orderId: dto.orderId, method: split.method, amount: new Prisma.Decimal(split.amount), reference: split.reference || null, cardLast4: split.cardLast4 || null, authCode: split.authCode || null, giftCardId: split.giftCardId || null, status: 'COMPLETED' },
        });
        if (split.giftCardId) {
          const gc = await tx.posGiftCard.findFirst({ where: { id: split.giftCardId, tenantId } });
          if (gc) {
            const nb = Number(gc.currentBalance) - split.amount;
            await tx.posGiftCard.update({ where: { id: split.giftCardId }, data: { currentBalance: new Prisma.Decimal(Math.max(0, nb)) } });
            await tx.posGiftCardTransaction.create({ data: { tenantId, giftCardId: split.giftCardId, orderId: dto.orderId, type: 'REDEEM', amount: new Prisma.Decimal(split.amount), balance: new Prisma.Decimal(Math.max(0, nb)) } });
          }
        }
      }
      return { orderId: dto.orderId, splits: dto.splits, total: totalSplit };
    });
  }

  async getSplitPayments(tenantId: string, orderId: string) {
    return this.p.posSplitPayment.findMany({ where: { tenantId, orderId }, orderBy: { createdAt: 'asc' } });
  }

  // ═══ HELPERS ═══

  private async deductInventory(tx: any, tenantId: string, orgId: string, productId: string, qty: number) {
    if (!tx.product || !tx.inventory) return;
    const inv = await tx.inventory.findFirst({ where: { tenantId, orgId, productId } });
    if (inv) { await tx.inventory.update({ where: { id: inv.id }, data: { quantity: { decrement: qty } } }); }
  }

  private async increaseInventory(tx: any, tenantId: string, orgId: string, productId: string, qty: number) {
    if (!tx.product || !tx.inventory) return;
    const inv = await tx.inventory.findFirst({ where: { tenantId, orgId, productId } });
    if (inv) { await tx.inventory.update({ where: { id: inv.id }, data: { quantity: { increment: qty } } }); }
  }
}
