import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateQuotationInput, CreateSalesOrderInput, CreateDeliveryNoteInput } from '@unerp/shared';
import { Quotation, QuotationItem, SalesOrder, SalesOrderItem, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SalesService {
  constructor(private readonly eventEmitter?: EventEmitter2) {}

  // ─── QUOTATION METHODS ─────────────────────────────


  /**
   * Fetch all quotations scoped to tenantId.
   */
  async getQuotations(tenantId: string) {
    const quotations = (await prisma.quotation.findMany({
      where: { tenantId, deletedAt: null },
      include: { customer: true, lineItems: true },
      orderBy: { createdAt: 'desc' },
    })) as unknown as Array<Quotation & { customer: { name: string }; lineItems: QuotationItem[] }>;

    return quotations.map((q) => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      status: q.status,
      issueDate: q.issueDate,
      validUntil: q.validUntil,
      subtotal: Number(q.subtotal),
      taxAmount: Number(q.taxAmount),
      totalAmount: Number(q.totalAmount),
      currency: q.currency,
      customerName: q.customer.name,
      lineItemCount: q.lineItems.length,
    }));
  }

  /**
   * Create new quotation.
   */
  async createQuotation(tenantId: string, orgId: string, dto: CreateQuotationInput, createdBy: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found for this Tenant.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.quotation.findFirst({
      where: { tenantId, orgId: resolvedOrgId, quotationNumber: dto.quotationNumber },
    });
    if (existing) throw new BadRequestException(`Quotation number ${dto.quotationNumber} already exists.`);

    const customer = await prisma.customer.findFirst({ where: { id: dto.customerId, tenantId } });
    if (!customer) throw new NotFoundException('Customer not found');

    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;

      const linesData = dto.lineItems.map((item, index) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineTax = lineSubtotal * (item.taxRate / 100);
        const lineTotal = lineSubtotal + lineTax;
        subtotal += lineSubtotal;
        totalTax += lineTax;

        return {
          tenantId,
          description: item.description,
          productId: item.productId || null,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          taxRate: new Prisma.Decimal(item.taxRate),
          taxAmount: new Prisma.Decimal(lineTax),
          totalAmount: new Prisma.Decimal(lineTotal),
          sortOrder: index,
        };
      });

      const quotation = await tx.quotation.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          customerId: dto.customerId,
          quotationNumber: dto.quotationNumber,
          validUntil: new Date(dto.validUntil),
          subtotal: new Prisma.Decimal(subtotal),
          taxAmount: new Prisma.Decimal(totalTax),
          totalAmount: new Prisma.Decimal(subtotal + totalTax),
          notes: dto.notes || null,
          termsConditions: dto.termsConditions || null,
          status: 'DRAFT',
          createdBy,
        },
      });

      for (const line of linesData) {
        await tx.quotationItem.create({ data: { ...line, quotationId: quotation.id } });
      }

      return quotation;
    });
  }

  // ─── SALES ORDER METHODS ───────────────────────────

  /**
   * Fetch all sales orders scoped to tenantId.
   */
  async getSalesOrders(tenantId: string) {
    const orders = (await prisma.salesOrder.findMany({
      where: { tenantId, deletedAt: null },
      include: { customer: true, lineItems: true, deliveryNotes: true },
      orderBy: { createdAt: 'desc' },
    })) as unknown as Array<
      SalesOrder & { customer: { name: string }; lineItems: SalesOrderItem[]; deliveryNotes: Array<{ id: string }> }
    >;

    return orders.map((so) => ({
      id: so.id,
      orderNumber: so.orderNumber,
      status: so.status,
      orderDate: so.orderDate,
      deliveryDate: so.deliveryDate,
      subtotal: Number(so.subtotal),
      taxAmount: Number(so.taxAmount),
      totalAmount: Number(so.totalAmount),
      currency: so.currency,
      customerName: so.customer.name,
      lineItemCount: so.lineItems.length,
      deliveryNotesCount: so.deliveryNotes.length,
    }));
  }

  /**
   * Get single sales order by ID.
   */
  async getSalesOrderById(tenantId: string, id: string) {
    const so = await prisma.salesOrder.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        customer: true,
        lineItems: { include: { product: true }, orderBy: { sortOrder: 'asc' } },
        deliveryNotes: { include: { lineItems: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!so) throw new NotFoundException('Sales order not found');
    return so;
  }

  /**
   * Create new sales order.
   */
  async createSalesOrder(tenantId: string, orgId: string, dto: CreateSalesOrderInput, createdBy: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found for this Tenant.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.salesOrder.findFirst({
      where: { tenantId, orgId: resolvedOrgId, orderNumber: dto.orderNumber },
    });
    if (existing) throw new BadRequestException(`Order number ${dto.orderNumber} already exists.`);

    const customer = await prisma.customer.findFirst({ where: { id: dto.customerId, tenantId } });
    if (!customer) throw new NotFoundException('Customer not found');

    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;

      const linesData = dto.lineItems.map((item, index) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineTax = lineSubtotal * (item.taxRate / 100);
        const lineTotal = lineSubtotal + lineTax;
        subtotal += lineSubtotal;
        totalTax += lineTax;

        return {
          tenantId,
          description: item.description,
          productId: item.productId || null,
          quantity: new Prisma.Decimal(item.quantity),
          deliveredQty: new Prisma.Decimal(0),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          taxRate: new Prisma.Decimal(item.taxRate),
          taxAmount: new Prisma.Decimal(lineTax),
          totalAmount: new Prisma.Decimal(lineTotal),
          sortOrder: index,
        };
      });

      const salesOrder = await tx.salesOrder.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          customerId: dto.customerId,
          orderNumber: dto.orderNumber,
          deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
          subtotal: new Prisma.Decimal(subtotal),
          taxAmount: new Prisma.Decimal(totalTax),
          totalAmount: new Prisma.Decimal(subtotal + totalTax),
          shippingAddress: dto.shippingAddress ? (dto.shippingAddress as Prisma.InputJsonObject) : Prisma.JsonNull,
          notes: dto.notes || null,
          quotationId: dto.quotationId || null,
          status: 'DRAFT',
          createdBy,
        },
      });

      for (const line of linesData) {
        await tx.salesOrderItem.create({ data: { ...line, salesOrderId: salesOrder.id } });
      }

      return salesOrder;
    });
  }

  /**
   * Update sales order status.
   */
  async updateSalesOrderStatus(tenantId: string, id: string, status: string) {
    const so = await prisma.salesOrder.findFirst({ where: { id, tenantId } });
    if (!so) throw new NotFoundException('Sales order not found');

    const updated = await prisma.salesOrder.update({ where: { id }, data: { status } });
    if (status === 'CONFIRMED' && this.eventEmitter) {
      this.eventEmitter.emit('sales.order.confirmed', {
        tenantId,
        salesOrderId: id,
        orderNumber: so.orderNumber,
      });
    }
    return updated;
  }

  // ─── DELIVERY NOTE METHODS ─────────────────────────

  /**
   * Create delivery note against a sales order.
   */
  async createDeliveryNote(tenantId: string, dto: CreateDeliveryNoteInput, createdBy: string) {
    const so = await prisma.salesOrder.findFirst({
      where: { id: dto.salesOrderId, tenantId },
      include: { lineItems: true },
    });
    if (!so) throw new NotFoundException('Sales order not found');

    const existingDN = await prisma.deliveryNote.findFirst({
      where: { tenantId, deliveryNumber: dto.deliveryNumber },
    });
    if (existingDN) throw new BadRequestException(`Delivery number ${dto.deliveryNumber} already exists.`);

    const result = await prisma.$transaction(async (tx) => {
      const dn = await tx.deliveryNote.create({
        data: {
          tenantId,
          salesOrderId: dto.salesOrderId,
          deliveryNumber: dto.deliveryNumber,
          warehouseId: dto.warehouseId || null,
          carrierName: dto.carrierName || null,
          trackingNumber: dto.trackingNumber || null,
          notes: dto.notes || null,
          status: 'PENDING',
          createdBy,
        },
      });

      for (const item of dto.lineItems) {
        await tx.deliveryNoteItem.create({
          data: {
            tenantId,
            deliveryNoteId: dn.id,
            productId: item.productId || null,
            description: item.description,
            deliveredQty: new Prisma.Decimal(item.deliveredQty),
          },
        });
      }

      // Update SO status
      const allSOItems = so.lineItems;
      const totalOrdered = allSOItems.reduce((sum, li) => sum + Number(li.quantity), 0);
      const previouslyDelivered = allSOItems.reduce((sum, li) => sum + Number(li.deliveredQty), 0);
      const newlyDelivered = dto.lineItems.reduce((sum, li) => sum + li.deliveredQty, 0);
      const totalDelivered = previouslyDelivered + newlyDelivered;

      const newStatus = totalDelivered >= totalOrdered ? 'DELIVERED' : 'PARTIALLY_DELIVERED';

      await tx.salesOrder.update({
        where: { id: dto.salesOrderId },
        data: { status: newStatus },
      });

      return dn;
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit('sales.delivery.created', {
        tenantId,
        salesOrderId: dto.salesOrderId,
        deliveryNumber: dto.deliveryNumber,
        warehouseId: dto.warehouseId,
        lineItems: dto.lineItems,
      });
    }

    return result;
  }
}
