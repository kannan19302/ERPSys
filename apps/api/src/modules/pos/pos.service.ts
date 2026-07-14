import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { buildPaginationValues, buildOrderBy, paginatedResult, resolveOrgId, PaginatedResult } from '../../common/utils/pagination.util';
import { PosOrderCreatedEvent } from './events/pos-order-created.event';
import { PosOrderVoidedEvent } from './events/pos-order-voided.event';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { QueryPosOrdersDto } from './dto/query-pos-orders.dto';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { CreateLoyaltyProgramDto } from './dto/create-loyalty-program.dto';

@Injectable()
export class PosService {
  constructor(private readonly eventEmitter?: EventEmitter2) { }

  private get p(): any { return prisma; }

  // ═══════════════════════════════════════════════════════════════
  // TERMINAL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async getTerminals(tenantId: string) {
    return this.p.pOSTerminal.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async getTerminalById(tenantId: string, id: string) {
    const term = await this.p.pOSTerminal.findFirst({ where: { id, tenantId } });
    if (!term) throw new NotFoundException('POS Terminal not found');
    return term;
  }

  async createTerminal(tenantId: string, orgId: string, dto: { name: string; code: string; warehouseId?: string }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const existing = await this.p.pOSTerminal.findFirst({ where: { tenantId, orgId: resolvedOrgId, code: dto.code } });
    if (existing) throw new BadRequestException(`POS Terminal with code ${dto.code} already exists.`);
    return this.p.pOSTerminal.create({
      data: { tenantId, orgId: resolvedOrgId, name: dto.name, code: dto.code, warehouseId: dto.warehouseId || null, status: 'ACTIVE' },
    });
  }

  async updateTerminal(tenantId: string, id: string, dto: Partial<{ name: string; status: string; warehouseId: string; defaultCustomerId: string; enableTipping: boolean; allowDiscount: boolean; maxDiscountPercent: number; currency: string; taxProfileId: string; priceListId: string; posProfile: any }>) {
    const term = await this.p.pOSTerminal.findFirst({ where: { id, tenantId } });
    if (!term) throw new NotFoundException('POS Terminal not found');
    return this.p.pOSTerminal.update({ where: { id }, data: dto });
  }

  async deleteTerminal(tenantId: string, id: string) {
    const term = await this.p.pOSTerminal.findFirst({ where: { id, tenantId } });
    if (!term) throw new NotFoundException('POS Terminal not found');
    return this.p.pOSTerminal.update({ where: { id }, data: { status: 'INACTIVE' } });
  }

  // ═══════════════════════════════════════════════════════════════
  // REGISTER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async getRegisters(tenantId: string) {
    return this.p.pOSRegister.findMany({ where: { tenantId }, include: { terminal: true }, orderBy: { openedAt: 'desc' } });
  }

  async openRegister(tenantId: string, dto: { terminalId: string; startingCash: number }, userId: string) {
    const active = await this.p.pOSRegister.findFirst({ where: { tenantId, terminalId: dto.terminalId, status: 'OPEN' } });
    if (active) throw new BadRequestException('This terminal already has an open register session.');
    return this.p.pOSRegister.create({
      data: { tenantId, terminalId: dto.terminalId, openedById: userId, startingCash: new Prisma.Decimal(dto.startingCash), status: 'OPEN' },
    });
  }

  async closeRegister(tenantId: string, id: string, dto: { endingCash: number; actualCash: number }) {
    const reg = await this.p.pOSRegister.findFirst({ where: { id, tenantId } });
    if (!reg) throw new NotFoundException('Register session not found');
    if (reg.status === 'CLOSED') throw new BadRequestException('Register session is already closed');
    return this.p.pOSRegister.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), endingCash: new Prisma.Decimal(dto.endingCash), actualCash: new Prisma.Decimal(dto.actualCash) },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SHIFT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async getShifts(tenantId: string, registerId: string) {
    return this.p.pOSShift.findMany({ where: { tenantId, registerId }, orderBy: { startTime: 'desc' } });
  }

  async startShift(tenantId: string, registerId: string, dto: { employeeId: string }) {
    const activeShift = await this.p.pOSShift.findFirst({ where: { tenantId, registerId, status: 'OPEN' } });
    if (activeShift) throw new BadRequestException('There is already an active shift on this register.');
    return this.p.pOSShift.create({ data: { tenantId, registerId, employeeId: dto.employeeId, status: 'OPEN' } });
  }

  async endShift(tenantId: string, shiftId: string) {
    const shift = await this.p.pOSShift.findFirst({ where: { id: shiftId, tenantId } });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status === 'CLOSED') throw new BadRequestException('Shift is already closed');
    return this.p.pOSShift.update({ where: { id: shiftId }, data: { status: 'CLOSED', endTime: new Date() } });
  }

  // ═══════════════════════════════════════════════════════════════
  // CASH ENTRIES
  // ═══════════════════════════════════════════════════════════════

  async getCashEntries(tenantId: string, registerId: string) {
    return prisma.cashEntry.findMany({ where: { tenantId, registerId }, orderBy: { createdAt: 'desc' } });
  }

  async addCashEntry(tenantId: string, registerId: string, dto: { type: 'IN' | 'OUT'; amount: number; reason?: string }, createdBy: string) {
    const register = await this.p.pOSRegister.findFirst({ where: { id: registerId, tenantId } });
    if (!register) throw new NotFoundException('Register session not found');
    return prisma.cashEntry.create({ data: { tenantId, registerId, type: dto.type, amount: new Prisma.Decimal(dto.amount), reason: dto.reason || null, createdBy } });
  }

  // ═══════════════════════════════════════════════════════════════
  // CORE TRANSACTION ENGINE — ORDERS (Phase A)
  // ═══════════════════════════════════════════════════════════════

  async createOrder(tenantId: string, orgId: string, dto: CreatePosOrderDto, cashierId: string, cashierName?: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const orderNumber = await this.generateOrderNumber(tenantId, resolvedOrgId);

    const order = await prisma.$transaction(async (tx) => {
      const ptx = tx as any;
      const newOrder = await ptx.posOrder.create({
        data: {
          tenantId, orgId: resolvedOrgId, orderNumber, type: dto.type || 'SALE', status: 'COMPLETED',
          terminalId: dto.terminalId, registerId: dto.registerId || null, shiftId: dto.shiftId || null,
          customerId: dto.customerId || null, customerName: dto.customerName || null, cashierId, cashierName: cashierName || null,
          subtotal: new Prisma.Decimal(dto.items.reduce((sum: number, i) => sum + i.lineTotal, 0)),
          discountType: dto.discountType || null, discountValue: new Prisma.Decimal(dto.discountValue || 0),
          discountAmount: new Prisma.Decimal(dto.discountAmount || 0), taxAmount: new Prisma.Decimal(dto.taxAmount || 0),
          roundingAmount: new Prisma.Decimal(dto.roundingAmount || 0), grandTotal: new Prisma.Decimal(dto.grandTotal),
          paidAmount: new Prisma.Decimal(dto.paidAmount), changeAmount: new Prisma.Decimal(dto.changeAmount || 0),
          tipAmount: new Prisma.Decimal(dto.tipAmount || 0), couponCode: dto.couponCode || null, notes: dto.notes || null, receiptData: dto.receiptData || null,
        },
      });

      for (const item of dto.items) {
        await ptx.posOrderItem.create({
          data: {
            tenantId, orderId: newOrder.id, productId: item.productId || null, productName: item.productName, sku: item.sku || '',
            barcode: item.barcode || null, qty: new Prisma.Decimal(item.qty), unitPrice: new Prisma.Decimal(item.unitPrice),
            discountType: item.discountType || null, discountPercent: new Prisma.Decimal(item.discountPercent || 0),
            discountAmount: new Prisma.Decimal(item.discountAmount || 0), taxRate: new Prisma.Decimal(item.taxRate || 0),
            taxAmount: new Prisma.Decimal(item.taxAmount || 0), lineTotal: new Prisma.Decimal(item.lineTotal),
            serialNumberId: item.serialNumberId || null, batchId: item.batchId || null, notes: item.notes || null,
          },
        });
        if (dto.type !== 'RETURN' && item.productId) {
          await this.deductInventory(ptx, tenantId, resolvedOrgId, item.productId, item.qty);
        }
      }

      for (const payment of dto.payments) {
        await ptx.posPayment.create({
          data: { tenantId, orderId: newOrder.id, method: payment.method, amount: new Prisma.Decimal(payment.amount), reference: payment.reference || null, cardLast4: payment.cardLast4 || null, authCode: payment.authCode || null, giftCardId: payment.giftCardId || null, status: 'COMPLETED' },
        });
        if (payment.method === 'GIFT_CARD' && payment.giftCardId) {
          const giftCard = await ptx.posGiftCard.findFirst({ where: { id: payment.giftCardId, tenantId } });
          if (giftCard) {
            const newBalance = Number(giftCard.currentBalance) - payment.amount;
            await ptx.posGiftCard.update({ where: { id: payment.giftCardId }, data: { currentBalance: new Prisma.Decimal(Math.max(0, newBalance)) } });
            await ptx.posGiftCardTransaction.create({ data: { tenantId, giftCardId: payment.giftCardId, orderId: newOrder.id, type: 'REDEEM', amount: new Prisma.Decimal(payment.amount), balance: new Prisma.Decimal(Math.max(0, newBalance)) } });
          }
        }
      }

      if (dto.registerId) {
        await ptx.posRegister.update({ where: { id: dto.registerId }, data: { totalSales: { increment: dto.grandTotal }, totalTransactions: { increment: 1 } } });
      }
      if (dto.shiftId) {
        await ptx.posShift.update({ where: { id: dto.shiftId }, data: { totalSales: { increment: dto.grandTotal } } });
      }
      if (dto.customerId && dto.type === 'SALE') {
        await this.earnLoyaltyPoints(ptx, tenantId, dto.customerId, dto.grandTotal, newOrder.id);
      }
      if (dto.couponCode) {
        const coupon = await ptx.posCoupon.findFirst({ where: { tenantId, code: dto.couponCode } });
        if (coupon) { await ptx.posCoupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } }); }
      }
      return newOrder;
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit('pos.order.created', new PosOrderCreatedEvent(order.id, tenantId, resolvedOrgId, orderNumber, dto.terminalId, cashierId, dto.customerId || null, dto.grandTotal, dto.items.map(i => ({ productId: i.productId || null, productName: i.productName, sku: i.sku, qty: i.qty, unitPrice: i.unitPrice, lineTotal: i.lineTotal }))));
    }
    return this.getOrderById(tenantId, order.id);
  }

  async voidOrder(tenantId: string, orderId: string, reason: string, voidedBy: string) {
    const order = await prisma.pOSOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'VOIDED') throw new BadRequestException('Order is already voided');
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const ptx = tx as any;
      const voided = await ptx.posOrder.update({ where: { id: orderId }, data: { status: 'VOIDED', notes: reason } });
      if (order.type === 'SALE') {
        const items = await ptx.posOrderItem.findMany({ where: { orderId } });
        for (const item of items) { if (item.productId) { await this.increaseInventory(ptx, tenantId, order.orgId, item.productId, Number(item.qty)); } }
      }
      return voided;
    });
    if (this.eventEmitter) { this.eventEmitter.emit('pos.order.voided', new PosOrderVoidedEvent(orderId, tenantId, order.orgId, order.orderNumber, reason, voidedBy)); }
    return updatedOrder;
  }

  async getOrders(tenantId: string, query: QueryPosOrdersDto): Promise<PaginatedResult<any>> {
    const { skip, take } = buildPaginationValues(query);
    const orderBy = buildOrderBy(query.sortBy);
    const where: any = { tenantId };
    if (query.terminalId) where.terminalId = query.terminalId;
    if (query.cashierId) where.cashierId = query.cashierId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) { where.OR = [{ orderNumber: { contains: query.search, mode: 'insensitive' } }, { customerName: { contains: query.search, mode: 'insensitive' } }]; }
    if (query.dateFrom || query.dateTo) { where.createdAt = {}; if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom); if (query.dateTo) where.createdAt.lte = new Date(query.dateTo); }
    const [data, total] = await Promise.all([
      prisma.pOSOrder.findMany({ where, include: { items: true, payments: true }, orderBy, skip, take }),
      prisma.pOSOrder.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async getOrderById(tenantId: string, id: string) {
    const order = await prisma.pOSOrder.findFirst({ where: { id, tenantId }, include: { items: true, payments: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getOrderByNumber(tenantId: string, orderNumber: string) {
    const order = await prisma.pOSOrder.findFirst({ where: { tenantId, orderNumber }, include: { items: true, payments: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async generateReceipt(tenantId: string, orderId: string) {
    const order = await this.getOrderById(tenantId, orderId);
    return {
      receiptHeader: 'UNIVERSAL ERP', receiptFooter: 'Thank you for your business!',
      orderNumber: order.orderNumber, date: order.createdAt, cashier: order.cashierName || order.cashierId,
      customer: order.customerName || 'Walk-in Customer',
      items: (order as any).items.map((i: any) => ({ name: i.productName, qty: Number(i.qty), price: Number(i.unitPrice), total: Number(i.lineTotal) })),
      subtotal: Number(order.subtotal), discountAmount: Number(order.discountAmount), taxAmount: Number(order.taxAmount),
      grandTotal: Number(order.grandTotal), paidAmount: Number(order.paidAmount), changeAmount: Number(order.changeAmount),
      payments: (order as any).payments.map((p: any) => ({ method: p.method, amount: Number(p.amount) })),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT SEARCH
  // ═══════════════════════════════════════════════════════════════

  async searchProducts(tenantId: string, orgId: string, query: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.product.findMany({
      where: { tenantId, orgId: resolvedOrgId, isActive: true, OR: [{ name: { contains: query, mode: 'insensitive' } }, { sku: { contains: query, mode: 'insensitive' } }, { barcode: { contains: query, mode: 'insensitive' } }] },
      take: 50, orderBy: { name: 'asc' },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // DISCOUNTS & COUPONS
  // ═══════════════════════════════════════════════════════════════

  async createDiscount(tenantId: string, orgId: string, dto: CreateDiscountDto) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.pOSDiscount.create({
      data: { tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description || null, type: dto.type, value: new Prisma.Decimal(dto.value), appliesTo: dto.appliesTo || 'ORDER', categoryId: dto.categoryId || null, productId: dto.productId || null, minPurchase: dto.minPurchase ? new Prisma.Decimal(dto.minPurchase) : null, maxDiscount: dto.maxDiscount ? new Prisma.Decimal(dto.maxDiscount) : null, validFrom: dto.validFrom ? new Date(dto.validFrom) : null, validTo: dto.validTo ? new Date(dto.validTo) : null, usageLimit: dto.usageLimit || null, status: 'ACTIVE' },
    });
  }

  async getDiscounts(tenantId: string) { return prisma.pOSDiscount.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }); }
  async getDiscountById(tenantId: string, id: string) { const d = await prisma.pOSDiscount.findFirst({ where: { id, tenantId } }); if (!d) throw new NotFoundException('Discount not found'); return d; }

  async validateCoupon(tenantId: string, code: string, orderAmount: number) {
    const coupon = await prisma.pOSCoupon.findFirst({ where: { tenantId, code, status: 'ACTIVE' }, include: { discount: true } });
    if (!coupon) throw new BadRequestException('Invalid coupon code');
    if (coupon.validFrom && new Date(coupon.validFrom) > new Date()) throw new BadRequestException('Coupon not yet valid');
    if (coupon.validTo && new Date(coupon.validTo) < new Date()) throw new BadRequestException('Coupon has expired');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Coupon usage limit reached');
    const discount = coupon.discount;
    if (!discount || discount.status !== 'ACTIVE') throw new BadRequestException('Associated discount is not active');
    if (discount.validFrom && new Date(discount.validFrom) > new Date()) throw new BadRequestException('Discount not yet valid');
    if (discount.validTo && new Date(discount.validTo) < new Date()) throw new BadRequestException('Discount has expired');
    if (discount.minPurchase && orderAmount < Number(discount.minPurchase)) throw new BadRequestException(`Minimum purchase of $${Number(discount.minPurchase)} required`);
    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE') { discountAmount = (orderAmount * Number(discount.value)) / 100; if (discount.maxDiscount) discountAmount = Math.min(discountAmount, Number(discount.maxDiscount)); }
    else if (discount.type === 'FIXED') { discountAmount = Number(discount.value); }
    return { valid: true, coupon, discount, discountAmount, description: discount.description || `${discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value}`} off` };
  }

  async createCoupon(tenantId: string, dto: { code: string; discountId: string; maxUses?: number; validFrom?: string; validTo?: string }) {
    const existing = await prisma.pOSCoupon.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException('Coupon code already exists');
    return prisma.pOSCoupon.create({ data: { tenantId, code: dto.code.toUpperCase(), discountId: dto.discountId, maxUses: dto.maxUses || null, validFrom: dto.validFrom ? new Date(dto.validFrom) : null, validTo: dto.validTo ? new Date(dto.validTo) : null, status: 'ACTIVE' } });
  }

  async getCoupons(tenantId: string) { return prisma.pOSCoupon.findMany({ where: { tenantId }, include: { discount: true }, orderBy: { createdAt: 'desc' } }); }

  // ═══════════════════════════════════════════════════════════════
  // TAX PROFILES
  // ═══════════════════════════════════════════════════════════════

  async createTaxProfile(tenantId: string, orgId: string, dto: { name: string; rates: any[]; isDefault?: boolean; isInclusive?: boolean }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    if (dto.isDefault) { await prisma.pOSTaxProfile.updateMany({ where: { tenantId, orgId: resolvedOrgId }, data: { isDefault: false } }); }
    return prisma.pOSTaxProfile.create({ data: { tenantId, orgId: resolvedOrgId, name: dto.name, rates: dto.rates, isDefault: dto.isDefault || false, isInclusive: dto.isInclusive || false } });
  }

  async getTaxProfiles(tenantId: string) { return prisma.pOSTaxProfile.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }); }

  // ═══════════════════════════════════════════════════════════════
  // QUICK KEYS
  // ═══════════════════════════════════════════════════════════════

  async getQuickKeys(tenantId: string, terminalId: string) { return prisma.pOSQuickKey.findMany({ where: { tenantId, terminalId }, orderBy: { position: 'asc' } }); }

  async saveQuickKeys(tenantId: string, terminalId: string, keys: Array<{ productId?: string; label: string; color?: string; position: number; categoryGroup?: string }>) {
    await prisma.pOSQuickKey.deleteMany({ where: { tenantId, terminalId } });
    if (keys.length > 0) { return prisma.pOSQuickKey.createMany({ data: keys.map(k => ({ tenantId, terminalId, productId: k.productId || null, label: k.label, color: k.color || '#6366f1', position: k.position, categoryGroup: k.categoryGroup || null })) }); }
    return { count: 0 };
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER & LOYALTY (Phase B)
  // ═══════════════════════════════════════════════════════════════

  async searchCustomers(tenantId: string, query: string) {
    return prisma.customer.findMany({ where: { tenantId, OR: [{ name: { contains: query, mode: 'insensitive' } }, { email: { contains: query, mode: 'insensitive' } }, { phone: { contains: query, mode: 'insensitive' } }] }, take: 20, orderBy: { name: 'asc' } });
  }

  async createWalkInCustomer(tenantId: string, orgId: string, dto: { name: string; email?: string; phone?: string }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.customer.create({ data: { tenantId, orgId: resolvedOrgId, type: 'INDIVIDUAL', name: dto.name, email: dto.email || null, phone: dto.phone || null, status: 'ACTIVE' } });
  }

  async createLoyaltyProgram(tenantId: string, orgId: string, dto: CreateLoyaltyProgramDto) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.pOSLoyaltyProgram.create({ data: { tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description || null, pointsPerUnit: new Prisma.Decimal(dto.pointsPerUnit), redeemRate: new Prisma.Decimal(dto.redeemRate), minRedeemPoints: dto.minRedeemPoints, expiryDays: dto.expiryDays || null, tiers: dto.tiers, status: 'ACTIVE' } });
  }

  async getLoyaltyPrograms(tenantId: string) { return prisma.pOSLoyaltyProgram.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }); }

  async getLoyaltyBalance(tenantId: string, customerId: string) {
    const member = await prisma.pOSLoyaltyMember.findFirst({ where: { tenantId, customerId } });
    if (!member) return { points: 0, tier: 'BRONZE', lifetimePoints: 0, lifetimeSpent: 0 };
    return { points: member.points, tier: member.tier, lifetimePoints: member.lifetimePoints, lifetimeSpent: Number(member.lifetimeSpent), visitCount: member.visitCount, lastVisit: member.lastVisit };
  }

  async getLoyaltyMembers(tenantId: string, programId: string) { return prisma.pOSLoyaltyMember.findMany({ where: { tenantId, programId }, orderBy: { points: 'desc' } }); }

  async redeemLoyaltyPoints(tenantId: string, customerId: string, points: number, orderId: string) {
    const member = await prisma.pOSLoyaltyMember.findFirst({ where: { tenantId, customerId } });
    if (!member) throw new BadRequestException('Customer is not a loyalty member');
    if (member.points < points) throw new BadRequestException('Insufficient loyalty points');
    const program = await prisma.pOSLoyaltyProgram.findFirst({ where: { id: member.programId } });
    if (!program) throw new BadRequestException('Loyalty program not found');
    if (points < program.minRedeemPoints) throw new BadRequestException(`Minimum ${program.minRedeemPoints} points required for redemption`);
    return prisma.$transaction(async (tx) => {
      const ptx = tx as any;
      const updated = await ptx.posLoyaltyMember.update({ where: { id: member.id }, data: { points: { decrement: points } } });
      await ptx.posLoyaltyTransaction.create({ data: { tenantId, programId: member.programId, memberId: member.id, orderId, type: 'REDEEM', points: -points, balance: updated.points, notes: `Redeemed ${points} points` } });
      return updated;
    });
  }

  async issueGiftCard(tenantId: string, orgId: string, dto: { code: string; initialBalance: number; currency?: string; issuedTo?: string; expiresAt?: string }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const existing = await prisma.pOSGiftCard.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException('Gift card code already exists');
    return prisma.pOSGiftCard.create({ data: { tenantId, orgId: resolvedOrgId, code: dto.code.toUpperCase(), initialBalance: new Prisma.Decimal(dto.initialBalance), currentBalance: new Prisma.Decimal(dto.initialBalance), currency: dto.currency || 'USD', issuedTo: dto.issuedTo || null, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null, status: 'ACTIVE' } });
  }

  async checkGiftCardBalance(tenantId: string, code: string) {
    const card = await prisma.pOSGiftCard.findFirst({ where: { tenantId, code, status: 'ACTIVE' } });
    if (!card) throw new NotFoundException('Gift card not found');
    if (card.expiresAt && card.expiresAt < new Date()) throw new BadRequestException('Gift card has expired');
    return { code: card.code, balance: Number(card.currentBalance), currency: card.currency, expiresAt: card.expiresAt };
  }

  async getGiftCards(tenantId: string) { return prisma.pOSGiftCard.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }); }

  async getStoreCredit(tenantId: string, customerId: string) {
    const credit = await prisma.pOSStoreCredit.findFirst({ where: { tenantId, customerId } });
    return credit ? { balance: Number(credit.balance), currency: credit.currency } : { balance: 0, currency: 'USD' };
  }

  // ═══════════════════════════════════════════════════════════════
  // RETURNS & EXCHANGES (Phase C)
  // ═══════════════════════════════════════════════════════════════

  async processReturn(tenantId: string, orgId: string, dto: { originalOrderId: string; type: 'RETURN' | 'EXCHANGE'; reason?: string; refundMethod?: string; items: Array<{ orderItemId: string; qty: number; refundAmount: number; restock?: boolean; reason?: string }>; exchangeOrderId?: string; processedBy: string }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const originalOrder = await prisma.pOSOrder.findFirst({ where: { id: dto.originalOrderId, tenantId }, include: { items: true } });
    if (!originalOrder) throw new NotFoundException('Original order not found');
    const returnNumber = `RET-${Date.now().toString(36).toUpperCase()}`;
    const totalRefund = dto.items.reduce((sum: number, i) => sum + i.refundAmount, 0);
    return prisma.$transaction(async (tx) => {
      const ptx = tx as any;
      const posReturn = await ptx.posReturn.create({ data: { tenantId, orgId: resolvedOrgId, returnNumber, originalOrderId: dto.originalOrderId, type: dto.type, status: 'APPROVED', reason: dto.reason || null, refundMethod: dto.refundMethod || null, refundAmount: new Prisma.Decimal(totalRefund), exchangeOrderId: dto.exchangeOrderId || null, processedBy: dto.processedBy, processedAt: new Date() } });
      for (const item of dto.items) {
        await ptx.posReturnItem.create({ data: { tenantId, returnId: posReturn.id, orderItemId: item.orderItemId, productId: null, productName: '', qty: new Prisma.Decimal(item.qty), unitPrice: new Prisma.Decimal(0), refundAmount: new Prisma.Decimal(item.refundAmount), restock: item.restock !== false, reason: item.reason || null } });
        if (item.restock !== false) { const orderItem = (originalOrder as any).items.find((oi: any) => oi.id === item.orderItemId); if (orderItem?.productId) { await this.increaseInventory(ptx, tenantId, resolvedOrgId, orderItem.productId, item.qty); } }
      }
      await ptx.posOrder.update({ where: { id: dto.originalOrderId }, data: { status: dto.type === 'RETURN' ? 'RETURNED' : 'EXCHANGED' } });
      return posReturn;
    });
  }

  async getReturns(tenantId: string) { return prisma.pOSReturn.findMany({ where: { tenantId }, include: { items: true }, orderBy: { createdAt: 'desc' } }); }
  async getReturnById(tenantId: string, id: string) { const r = await prisma.pOSReturn.findFirst({ where: { id, tenantId }, include: { items: true } }); if (!r) throw new NotFoundException('Return not found'); return r; }
  async approveReturn(tenantId: string, id: string) { const r = await prisma.pOSReturn.findFirst({ where: { id, tenantId } }); if (!r) throw new NotFoundException('Return not found'); return prisma.pOSReturn.update({ where: { id }, data: { status: 'APPROVED', processedAt: new Date() } }); }

  // ═══════════════════════════════════════════════════════════════
  // HELD ORDERS (Phase D)
  // ═══════════════════════════════════════════════════════════════

  async holdOrder(tenantId: string, orgId: string, dto: { terminalId: string; customerId?: string; customerName?: string; cashierId: string; label?: string; items: any[]; subtotal: number; notes?: string; expiresInMinutes?: number }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.pOSHeldOrder.create({ data: { tenantId, orgId: resolvedOrgId, terminalId: dto.terminalId, customerId: dto.customerId || null, customerName: dto.customerName || null, cashierId: dto.cashierId, label: dto.label || null, items: dto.items, subtotal: new Prisma.Decimal(dto.subtotal), notes: dto.notes || null, status: 'HELD', expiresAt: dto.expiresInMinutes ? new Date(Date.now() + dto.expiresInMinutes * 60 * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000) } });
  }

  async getHeldOrders(tenantId: string, terminalId?: string) { const where: any = { tenantId, status: 'HELD' }; if (terminalId) where.terminalId = terminalId; return prisma.pOSHeldOrder.findMany({ where, orderBy: { createdAt: 'desc' } }); }
  async resumeHeldOrder(tenantId: string, id: string) { const held = await prisma.pOSHeldOrder.findFirst({ where: { id, tenantId } }); if (!held) throw new NotFoundException('Held order not found'); if (held.status !== 'HELD') throw new BadRequestException('Order is not in HELD status'); if (held.expiresAt && held.expiresAt < new Date()) throw new BadRequestException('Held order has expired'); return held; }
  async discardHeldOrder(tenantId: string, id: string) { const held = await prisma.pOSHeldOrder.findFirst({ where: { id, tenantId } }); if (!held) throw new NotFoundException('Held order not found'); return prisma.pOSHeldOrder.update({ where: { id }, data: { status: 'DISCARDED' } }); }

  // ═══════════════════════════════════════════════════════════════
  // PRICE LISTS (Phase D)
  // ═══════════════════════════════════════════════════════════════

  async createPriceList(tenantId: string, orgId: string, dto: { name: string; description?: string; currency?: string; isDefault?: boolean; validFrom?: string; validTo?: string; items?: Array<{ productId: string; price: number; minQty?: number }> }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    if (dto.isDefault) { await prisma.pOSPriceList.updateMany({ where: { tenantId, orgId: resolvedOrgId }, data: { isDefault: false } }); }
    return prisma.pOSPriceList.create({ data: { tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description || null, currency: dto.currency || 'USD', isDefault: dto.isDefault || false, validFrom: dto.validFrom ? new Date(dto.validFrom) : null, validTo: dto.validTo ? new Date(dto.validTo) : null, status: 'ACTIVE', items: dto.items ? { create: dto.items.map(i => ({ tenantId, productId: i.productId, price: new Prisma.Decimal(i.price), minQty: new Prisma.Decimal(i.minQty || 1) })) } : undefined }, include: { items: true } });
  }

  async getPriceLists(tenantId: string) { return prisma.pOSPriceList.findMany({ where: { tenantId }, include: { items: true }, orderBy: { name: 'asc' } }); }

  // ═══════════════════════════════════════════════════════════════
  // PROMOTIONS (Phase D)
  // ═══════════════════════════════════════════════════════════════

  async createPromotion(tenantId: string, orgId: string, dto: { name: string; description?: string; type: string; conditions: any; rewards: any; priority?: number; stackable?: boolean; validFrom?: string; validTo?: string; usageLimit?: number }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.pOSPromotion.create({ data: { tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description || null, type: dto.type, conditions: dto.conditions, rewards: dto.rewards, priority: dto.priority || 10, stackable: dto.stackable || false, validFrom: dto.validFrom ? new Date(dto.validFrom) : null, validTo: dto.validTo ? new Date(dto.validTo) : null, usageLimit: dto.usageLimit || null, status: 'ACTIVE' } });
  }

  async getPromotions(tenantId: string) { return prisma.pOSPromotion.findMany({ where: { tenantId }, orderBy: [{ priority: 'asc' }, { name: 'asc' }] }); }

  // ═══════════════════════════════════════════════════════════════
  // OPEN TABS (Phase D)
  // ═══════════════════════════════════════════════════════════════

  async createOpenTab(tenantId: string, orgId: string, dto: { terminalId: string; customerId?: string; customerName?: string; cashierId: string; items?: any[]; notes?: string }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const tabNumber = `TAB-${Date.now().toString(36).toUpperCase()}`;
    return prisma.pOSOpenTab.create({ data: { tenantId, orgId: resolvedOrgId, terminalId: dto.terminalId, tabNumber, customerId: dto.customerId || null, customerName: dto.customerName || null, cashierId: dto.cashierId, items: dto.items || [], subtotal: new Prisma.Decimal(0), notes: dto.notes || null, status: 'OPEN' } });
  }

  async getOpenTabs(tenantId: string) { return prisma.pOSOpenTab.findMany({ where: { tenantId, status: 'OPEN' }, orderBy: { openedAt: 'desc' } }); }
  async closeOpenTab(tenantId: string, id: string) { const tab = await prisma.pOSOpenTab.findFirst({ where: { id, tenantId } }); if (!tab) throw new NotFoundException('Open tab not found'); return prisma.pOSOpenTab.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date() } }); }

  // ═══════════════════════════════════════════════════════════════
  // LAYAWAY (Phase D)
  // ═══════════════════════════════════════════════════════════════

  async createLayaway(tenantId: string, orgId: string, dto: { customerId?: string; customerName: string; customerEmail?: string; customerPhone?: string; items: any[]; totalAmount: number; depositAmount: number; dueDate?: string; notes?: string }) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const layawayNumber = `LA-${Date.now().toString(36).toUpperCase()}`;
    const remainingAmount = dto.totalAmount - dto.depositAmount;
    return prisma.pOSLayaway.create({ data: { tenantId, orgId: resolvedOrgId, layawayNumber, customerId: dto.customerId || null, customerName: dto.customerName, customerEmail: dto.customerEmail || null, customerPhone: dto.customerPhone || null, items: dto.items, totalAmount: new Prisma.Decimal(dto.totalAmount), depositAmount: new Prisma.Decimal(dto.depositAmount), paidAmount: new Prisma.Decimal(dto.depositAmount), remainingAmount: new Prisma.Decimal(remainingAmount), dueDate: dto.dueDate ? new Date(dto.dueDate) : null, status: 'ACTIVE', notes: dto.notes || null } });
  }

  async getLayaways(tenantId: string) { return prisma.pOSLayaway.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }); }

  async recordLayawayPayment(tenantId: string, layawayId: string, dto: { amount: number; method: string; reference?: string; notes?: string; createdBy: string }) {
    const layaway = await prisma.pOSLayaway.findFirst({ where: { id: layawayId, tenantId } });
    if (!layaway) throw new NotFoundException('Layaway not found');
    if (layaway.status !== 'ACTIVE') throw new BadRequestException('Layaway is not active');
    return prisma.$transaction(async (tx) => {
      const ptx = tx as any;
      const newPaid = Number(layaway.paidAmount) + dto.amount;
      const newRemaining = Number(layaway.remainingAmount) - dto.amount;
      const newStatus = newRemaining <= 0 ? 'COMPLETED' : 'ACTIVE';
      await ptx.posLayaway.update({ where: { id: layawayId }, data: { paidAmount: new Prisma.Decimal(newPaid), remainingAmount: new Prisma.Decimal(Math.max(0, newRemaining)), status: newStatus } });
      return ptx.posLayawayPayment.create({ data: { tenantId, layawayId, amount: new Prisma.Decimal(dto.amount), method: dto.method, reference: dto.reference || null, notes: dto.notes || null, createdBy: dto.createdBy } });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER DISPLAY (Phase D)
  // ═══════════════════════════════════════════════════════════════

  async getCustomerDisplayConfig(tenantId: string, terminalId: string) {
    try { const config = await (prisma as any).pOSCustomerDisplay.findFirst({ where: { tenantId, terminalId } }); return config || { enabled: false, template: 'default', showCart: true, showTotal: true, showPromo: false }; }
    catch { return { enabled: false, template: 'default', showCart: true, showTotal: true, showPromo: false }; }
  }

  async updateCustomerDisplayConfig(tenantId: string, terminalId: string, dto: { enabled: boolean; template?: string; showCart?: boolean; showTotal?: boolean; showPromo?: boolean }) {
    try {
      const prismaAny = prisma as any;
      const existing = await prismaAny.pOSCustomerDisplay.findFirst({ where: { tenantId, terminalId } });
      if (existing) { return prismaAny.pOSCustomerDisplay.update({ where: { id: existing.id }, data: dto }); }
      return prismaAny.pOSCustomerDisplay.create({ data: { tenantId, terminalId, enabled: dto.enabled, template: dto.template || 'default', showCart: dto.showCart ?? true, showTotal: dto.showTotal ?? true, showPromo: dto.showPromo ?? false } });
    } catch { return { enabled: dto.enabled, template: dto.template || 'default', showCart: dto.showCart ?? true, showTotal: dto.showTotal ?? true, showPromo: dto.showPromo ?? false }; }
  }

  // ═══════════════════════════════════════════════════════════════
  // REPORTING & ANALYTICS (Phase E)
  // ═══════════════════════════════════════════════════════════════

  async getDailySummary(tenantId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);
    const orders = await prisma.pOSOrder.findMany({ where: { tenantId, createdAt: { gte: startOfDay, lte: endOfDay }, status: { not: 'VOIDED' } }, include: { payments: true } });
    const totalSales = orders.filter((o: any) => o.type === 'SALE').reduce((sum: number, o: any) => sum + Number(o.grandTotal), 0);
    const totalReturns = orders.filter((o: any) => o.type === 'RETURN').reduce((sum: number, o: any) => sum + Number(o.grandTotal), 0);
    const totalTransactions = orders.length;
    const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const paymentBreakdown: Record<string, number> = {};
    for (const order of orders) { for (const payment of (order as any).payments) { paymentBreakdown[payment.method] = (paymentBreakdown[payment.method] || 0) + Number(payment.amount); } }
    return { date: targetDate.toISOString().split('T')[0], totalSales, totalReturns, netSales: totalSales - totalReturns, totalTransactions, averageOrderValue, paymentBreakdown };
  }

  async getShiftReport(tenantId: string, shiftId: string) {
    const shift = await prisma.pOSShift.findFirst({ where: { id: shiftId, tenantId } });
    if (!shift) throw new NotFoundException('Shift not found');
    const orders = await prisma.pOSOrder.findMany({ where: { tenantId, shiftId, status: { not: 'VOIDED' } }, include: { payments: true } });
    const sales = orders.filter((o: any) => o.type === 'SALE');
    const returns = orders.filter((o: any) => o.type === 'RETURN');
    const paymentBreakdown: Record<string, number> = {};
    for (const order of orders) { for (const payment of (order as any).payments) { paymentBreakdown[payment.method] = (paymentBreakdown[payment.method] || 0) + Number(payment.amount); } }
    return { shiftId: shift.id, employeeId: shift.employeeId, startTime: shift.startTime, endTime: shift.endTime, status: shift.status, totalSales: sales.reduce((s: number, o: any) => s + Number(o.grandTotal), 0), totalReturns: returns.reduce((s: number, o: any) => s + Number(o.grandTotal), 0), totalTransactions: orders.length, paymentBreakdown, orderCount: orders.length };
  }

  async getSalesByProduct(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { tenantId, type: 'SALE', status: { not: 'VOIDED' } };
    if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
    const orders = await prisma.pOSOrder.findMany({ where, include: { items: true } });
    const productMap: Record<string, any> = {};
    for (const order of orders) { for (const item of (order as any).items) { const key = item.productId || item.sku; if (!key) continue; if (!productMap[key]) { productMap[key] = { productId: item.productId || '', productName: item.productName, sku: item.sku, totalQty: 0, totalRevenue: 0, orderCount: 0 }; } productMap[key].totalQty += Number(item.qty); productMap[key].totalRevenue += Number(item.lineTotal); productMap[key].orderCount += 1; } }
    return Object.values(productMap).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
  }

  async getSalesByCashier(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { tenantId, type: 'SALE', status: { not: 'VOIDED' } };
    if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
    const orders = await prisma.pOSOrder.findMany({ where });
    const cashierMap: Record<string, any> = {};
    for (const order of orders) { const key = order.cashierId; if (!cashierMap[key]) { cashierMap[key] = { cashierId: key, cashierName: order.cashierName || key, totalSales: 0, orderCount: 0, avgOrderValue: 0 }; } cashierMap[key].totalSales += Number(order.grandTotal); cashierMap[key].orderCount += 1; }
    return Object.values(cashierMap).map((c: any) => ({ ...c, avgOrderValue: c.orderCount > 0 ? c.totalSales / c.orderCount : 0 })).sort((a: any, b: any) => b.totalSales - a.totalSales);
  }

  async getSalesByHour(tenantId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);
    const orders = await prisma.pOSOrder.findMany({ where: { tenantId, createdAt: { gte: startOfDay, lte: endOfDay }, type: 'SALE', status: { not: 'VOIDED' } } });
    const hourlyData: Record<number, { hour: number; sales: number; count: number }> = {};
    for (let i = 0; i < 24; i++) { hourlyData[i] = { hour: i, sales: 0, count: 0 }; }
    for (const order of orders) { const hour = order.createdAt.getHours(); if (hourlyData[hour]) { hourlyData[hour].sales += Number(order.grandTotal); hourlyData[hour].count += 1; } }
    return Object.values(hourlyData);
  }

  async getSalesByPaymentMethod(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { tenantId, status: { not: 'VOIDED' } };
    if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
    const orders = await prisma.pOSOrder.findMany({ where, include: { payments: true } });
    const methodMap: Record<string, { method: string; total: number; count: number }> = {};
    for (const order of orders) { for (const payment of (order as any).payments) { const m = payment.method; if (!methodMap[m]) { methodMap[m] = { method: m, total: 0, count: 0 }; } methodMap[m].total += Number(payment.amount); methodMap[m].count += 1; } }
    return Object.values(methodMap).sort((a, b) => b.total - a.total);
  }

  async getDiscountUsage(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { tenantId, status: { not: 'VOIDED' } };
    if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
    const orders = await prisma.pOSOrder.findMany({ where, select: { discountType: true, discountValue: true, discountAmount: true, couponCode: true, grandTotal: true } });
    const ordersWithDiscount = orders.filter((o: any) => Number(o.discountAmount) > 0);
    const totalDiscountAmount = ordersWithDiscount.reduce((s: number, o: any) => s + Number(o.discountAmount), 0);
    const couponUsage: Record<string, number> = {};
    for (const o of orders) { if (o.couponCode) { couponUsage[o.couponCode] = (couponUsage[o.couponCode] || 0) + 1; } }
    return { totalOrdersWithDiscount: ordersWithDiscount.length, totalDiscountAmount, averageDiscountPerOrder: ordersWithDiscount.length > 0 ? totalDiscountAmount / ordersWithDiscount.length : 0, couponUsage };
  }

  async getCustomerInsights(tenantId: string) {
    const members = await prisma.pOSLoyaltyMember.findMany({ where: { tenantId }, orderBy: { lifetimeSpent: 'desc' }, take: 20 });
    return members.map((m: any) => ({ name: m.name, email: m.email, tier: m.tier, points: m.points, lifetimeSpent: Number(m.lifetimeSpent), visitCount: m.visitCount, lastVisit: m.lastVisit }));
  }

  async getRegisterSummary(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: any = { tenantId };
    if (dateFrom || dateTo) { where.openedAt = {}; if (dateFrom) where.openedAt.gte = new Date(dateFrom); if (dateTo) where.openedAt.lte = new Date(dateTo); }
    return prisma.pOSRegister.findMany({ where, include: { terminal: true }, orderBy: { openedAt: 'desc' } });
  }

  // ═══════════════════════════════════════════════════════════════
  // RECEIPT TEMPLATE & DIAGNOSTICS
  // ═══════════════════════════════════════════════════════════════

  async updateTerminalReceiptTemplate(tenantId: string, id: string, dto: { receiptTemplate: string; layoutFormat: string }) {
    const term = await prisma.pOSTerminal.findFirst({ where: { id, tenantId } });
    if (!term) throw new NotFoundException('POS Terminal not found');
    return prisma.pOSTerminal.update({ where: { id }, data: { receiptTemplate: dto.receiptTemplate, layoutFormat: dto.layoutFormat } });
  }

  async getTerminalDiagnostics(tenantId: string, id: string) {
    const term = await prisma.pOSTerminal.findFirst({ where: { id, tenantId } });
    if (!term) throw new NotFoundException('POS Terminal not found');
    return { terminalId: id, name: term.name, code: term.code, diagnostics: term.diagnosticData || { printerStatus: 'ONLINE', cashDrawerStatus: 'CLOSED', scannerConnection: 'CONNECTED', lastChecked: new Date() } };
  }

  async updateTerminalDiagnostics(tenantId: string, id: string, dto: { diagnosticData: any }) {
    const term = await prisma.pOSTerminal.findFirst({ where: { id, tenantId } });
    if (!term) throw new NotFoundException('POS Terminal not found');
    return prisma.pOSTerminal.update({ where: { id }, data: { diagnosticData: dto.diagnosticData } });
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private async generateOrderNumber(tenantId: string, orgId: string): Promise<string> {
    const date = new Date();
    const prefix = `POS-${date.getFullYear()}-`;
    const count = await prisma.pOSOrder.count({ where: { tenantId, orgId, createdAt: { gte: new Date(date.getFullYear(), 0, 1), lte: new Date(date.getFullYear(), 11, 31, 23, 59, 59) } } });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private async deductInventory(tx: any, tenantId: string, _orgId: string, productId: string, qty: number) {
    const inventory = await tx.inventoryItem.findFirst({ where: { tenantId, productId } });
    if (!inventory) return;
    const newQty = Number(inventory.quantity) - qty;
    if (newQty < 0) {
      throw new BadRequestException(`Insufficient stock for product ${productId}: requested ${qty}, available ${Number(inventory.quantity)}`);
    }
    await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantity: newQty } });
  }

  private async increaseInventory(tx: any, tenantId: string, _orgId: string, productId: string, qty: number) {
    const inventory = await tx.inventoryItem.findFirst({ where: { tenantId, productId } });
    if (inventory) { await tx.inventoryItem.update({ where: { id: inventory.id }, data: { quantity: { increment: qty } } }); }
  }

  private async earnLoyaltyPoints(tx: any, tenantId: string, customerId: string, amount: number, orderId: string) {
    const program = await tx.posLoyaltyProgram.findFirst({ where: { tenantId, status: 'ACTIVE' } });
    if (!program) return;
    let member = await tx.posLoyaltyMember.findFirst({ where: { tenantId, customerId } });
    const pointsEarned = Math.floor(amount * Number(program.pointsPerUnit));
    if (member) {
      const newPoints = member.points + pointsEarned;
      const newVisitCount = member.visitCount + 1;
      let tier = member.tier;
      const tiers: Array<{ name: string; minPoints: number }> = program.tiers || [];
      for (const t of [...tiers].sort((a, b) => b.minPoints - a.minPoints)) { if (newPoints >= t.minPoints) { tier = t.name; break; } }
      member = await tx.posLoyaltyMember.update({ where: { id: member.id }, data: { points: newPoints, lifetimePoints: { increment: pointsEarned }, lifetimeSpent: { increment: amount }, visitCount: newVisitCount, lastVisit: new Date(), tier } });
    } else {
      const customer = await tx.customer.findFirst({ where: { id: customerId } });
      member = await tx.posLoyaltyMember.create({ data: { tenantId, programId: program.id, customerId, name: customer?.name || 'Unknown', email: customer?.email || null, points: pointsEarned, lifetimePoints: pointsEarned, lifetimeSpent: new Prisma.Decimal(amount), visitCount: 1, tier: 'BRONZE', lastVisit: new Date(), status: 'ACTIVE' } });
    }
    await tx.posLoyaltyTransaction.create({ data: { tenantId, programId: program.id, memberId: member.id, orderId, type: 'EARN', points: pointsEarned, balance: member.points, notes: 'Earned from order' } });
  }
}