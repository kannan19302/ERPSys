import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateQuotationInput, CreateSalesOrderInput, CreateDeliveryNoteInput, CreateSalesReturnInput } from '@unerp/shared';
import { Quotation, QuotationItem, SalesOrder, SalesOrderItem, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SalesService {
  constructor(private readonly eventEmitter?: EventEmitter2) { }

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
   * Fetch all sales orders scoped to tenantId. Supports optional filtering by channel and status.
   */
  async getSalesOrders(tenantId: string, channel?: string, status?: string) {
    const whereClause: Prisma.SalesOrderWhereInput = { tenantId, deletedAt: null };
    if (channel) {
      whereClause.salesChannel = channel;
    }
    if (status) {
      whereClause.status = status;
    }

    const orders = (await prisma.salesOrder.findMany({
      where: whereClause,
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
      salesChannel: so.salesChannel,
      paymentMethod: so.paymentMethod,
      paymentStatus: so.paymentStatus,
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
   * Create new sales order with multi-channel and B2B credit validations.
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

    const salesChannel = dto.salesChannel || 'B2B';
    const paymentMethod = dto.paymentMethod || null;
    const paymentStatus = dto.paymentStatus || 'UNPAID';

    // Calculate total order amount
    let orderSubtotal = 0;
    let orderTax = 0;
    dto.lineItems.forEach((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      orderSubtotal += lineSubtotal;
      orderTax += lineSubtotal * (item.taxRate / 100);
    });
    const orderTotal = orderSubtotal + orderTax;

    let initialStatus = 'DRAFT';

    // B2B Credit Limit Check
    if (salesChannel === 'B2B' && customer.creditLimit !== undefined && customer.creditLimit !== null) {
      const creditLimit = Number(customer.creditLimit);

      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          customerId: dto.customerId,
          status: { not: 'PAID' },
          deletedAt: null,
        },
      });

      const outstandingBalance = unpaidInvoices.reduce(
        (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)),
        0
      );

      if (outstandingBalance + orderTotal > creditLimit) {
        initialStatus = 'CREDIT_HOLD';
      }
    }

    // Auto-confirm B2C/D2C orders if fully paid
    if ((salesChannel === 'B2C' || salesChannel === 'D2C') && paymentStatus === 'PAID') {
      initialStatus = 'CONFIRMED';
    }

    return prisma.$transaction(async (tx) => {
      const linesData = dto.lineItems.map((item, index) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineTax = lineSubtotal * (item.taxRate / 100);
        const lineTotal = lineSubtotal + lineTax;

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
          subtotal: new Prisma.Decimal(orderSubtotal),
          taxAmount: new Prisma.Decimal(orderTax),
          totalAmount: new Prisma.Decimal(orderTotal),
          salesChannel,
          paymentMethod,
          paymentStatus,
          shippingAddress: dto.shippingAddress ? (dto.shippingAddress as Prisma.InputJsonObject) : Prisma.JsonNull,
          notes: dto.notes || null,
          quotationId: dto.quotationId || null,
          status: initialStatus,
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

  /**
   * Approve a credit hold on a B2B sales order.
   */
  async approveCreditHold(tenantId: string, orderId: string, _userId: string) {
    const so = await prisma.salesOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!so) throw new NotFoundException('Sales order not found');
    if (so.status !== 'CREDIT_HOLD') {
      throw new BadRequestException('Sales order is not on credit hold');
    }

    const updated = await prisma.salesOrder.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit('sales.order.confirmed', {
        tenantId,
        salesOrderId: orderId,
        orderNumber: so.orderNumber,
      });
    }

    return updated;
  }

  /**
   * Record payment for B2C/D2C or general orders.
   */
  async recordOrderPayment(tenantId: string, orderId: string, amount: number, method: string, _userId: string) {
    const so = await prisma.salesOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!so) throw new NotFoundException('Sales order not found');

    const newPaymentStatus = amount >= Number(so.totalAmount) ? 'PAID' : 'PARTIALLY_PAID';

    const updateData: Prisma.SalesOrderUpdateInput = {
      paymentStatus: newPaymentStatus,
      paymentMethod: method,
    };
    if (so.status === 'DRAFT' && newPaymentStatus === 'PAID') {
      updateData.status = 'CONFIRMED';
    }

    const updated = await prisma.salesOrder.update({
      where: { id: orderId },
      data: updateData,
    });

    if (updateData.status === 'CONFIRMED' && this.eventEmitter) {
      this.eventEmitter.emit('sales.order.confirmed', {
        tenantId,
        salesOrderId: orderId,
        orderNumber: so.orderNumber,
      });
    }

    return updated;
  }

  /**
   * Convert customer quotation to Sales Order.
   */
  async convertQuotationToOrder(tenantId: string, quotationId: string, createdBy: string) {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId, deletedAt: null },
      include: { lineItems: true, customer: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    if (quotation.status === 'CONVERTED') {
      throw new BadRequestException('Quotation has already been converted to an order');
    }

    const orderNumber = `SO-QT-${quotation.quotationNumber.replace('QT-', '')}-${Math.floor(Math.random() * 1000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const salesOrder = await tx.salesOrder.create({
        data: {
          tenantId,
          orgId: quotation.orgId,
          customerId: quotation.customerId,
          orderNumber,
          deliveryDate: quotation.validUntil,
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          salesChannel: 'B2B',
          paymentStatus: 'UNPAID',
          quotationId: quotation.id,
          status: 'CONFIRMED',
          createdBy,
        },
      });

      for (const line of quotation.lineItems) {
        await tx.salesOrderItem.create({
          data: {
            tenantId,
            salesOrderId: salesOrder.id,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            deliveredQty: new Prisma.Decimal(0),
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            taxAmount: line.taxAmount,
            totalAmount: line.totalAmount,
            sortOrder: line.sortOrder,
          },
        });
      }

      await tx.quotation.update({
        where: { id: quotationId },
        data: {
          status: 'CONVERTED',
          convertedToOrderId: salesOrder.id,
        },
      });

      return salesOrder;
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit('sales.order.confirmed', {
        tenantId,
        salesOrderId: result.id,
        orderNumber: result.orderNumber,
      });
    }

    return result;
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

  // ── SALES RETURNS ──────────────────────────────

  async getSalesReturns(tenantId: string) {
    const returns = await prisma.salesReturn.findMany({
      where: { tenantId },
      include: { customer: true, salesOrder: true, lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
    return returns.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      status: r.status,
      returnDate: r.returnDate,
      totalAmount: Number(r.totalAmount),
      customerName: r.customer.name,
      orderNumber: r.salesOrder.orderNumber,
      lineItemCount: r.lineItems.length,
    }));
  }

  async createSalesReturn(tenantId: string, orgId: string, dto: CreateSalesReturnInput, createdBy: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    const order = await prisma.salesOrder.findFirst({
      where: { id: dto.salesOrderId, tenantId },
    });
    if (!order) throw new NotFoundException('Sales Order not found');

    const existing = await prisma.salesReturn.findFirst({
      where: { tenantId, returnNumber: dto.returnNumber },
    });
    if (existing) throw new BadRequestException(`Return number ${dto.returnNumber} already exists.`);

    let subtotal = 0;
    let taxAmount = 0;
    dto.lineItems.forEach((item) => {
      const lineSub = item.quantity * item.unitPrice;
      subtotal += lineSub;
      taxAmount += lineSub * (item.taxRate / 100);
    });
    const totalAmount = subtotal + taxAmount;

    return prisma.$transaction(async (tx) => {
      // 1. Create Credit Note
      const creditNoteNumber = `CN-SR-${dto.returnNumber.replace('SR-', '')}-${Math.floor(Math.random() * 1000)}`;
      const creditNote = await tx.creditNote.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          customerId: order.customerId,
          invoiceId: order.invoiceId || null,
          noteNumber: creditNoteNumber,
          amount: new Prisma.Decimal(totalAmount),
          reason: dto.reason || 'Customer Return',
          status: 'CONFIRMED',
        },
      });

      // 2. Create Sales Return
      const sr = await tx.salesReturn.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          customerId: order.customerId,
          salesOrderId: dto.salesOrderId,
          deliveryNoteId: dto.deliveryNoteId || null,
          returnNumber: dto.returnNumber,
          status: 'COMPLETED',
          returnDate: new Date(),
          subtotal: new Prisma.Decimal(subtotal),
          taxAmount: new Prisma.Decimal(taxAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          reason: dto.reason || null,
          creditNoteId: creditNote.id,
          createdBy,
        },
      });

      // 3. Create Sales Return Items
      for (const item of dto.lineItems) {
        const itemSub = item.quantity * item.unitPrice;
        const itemTax = itemSub * (item.taxRate / 100);
        await tx.salesReturnItem.create({
          data: {
            tenantId,
            salesReturnId: sr.id,
            productId: item.productId,
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity),
            unitPrice: new Prisma.Decimal(item.unitPrice),
            taxRate: new Prisma.Decimal(item.taxRate),
            taxAmount: new Prisma.Decimal(itemTax),
            totalAmount: new Prisma.Decimal(itemSub + itemTax),
          },
        });
      }

      // 4. Update Sales Order status
      await tx.salesOrder.update({
        where: { id: dto.salesOrderId },
        data: { status: 'RETURNED' },
      });

      // 5. Emit stock restock event
      if (this.eventEmitter) {
        let whId = 'WH-MAIN';
        // deliveryNoteId is optional on the return DTO
        const dnId = (dto as any).deliveryNoteId;
        if (dnId) {
          const dnObj = await tx.deliveryNote.findFirst({ where: { id: dnId } });
          if (dnObj && dnObj.warehouseId) {
            whId = dnObj.warehouseId;
          }
        }
        this.eventEmitter.emit('sales.return.created', {
          tenantId,
          salesReturnId: sr.id,
          warehouseId: whId,
          lineItems: dto.lineItems.map((li) => ({
            productId: li.productId,
            quantity: li.quantity,
          })),
        });
      }

      return sr;
    });
  }
}
