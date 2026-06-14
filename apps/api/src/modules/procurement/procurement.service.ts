import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import {
  CreatePurchaseOrderInput,
  CreatePurchaseReceiptInput,
  CreateRFQInput,
  CreateSupplierQuotationInput,
  CreatePurchaseReturnInput,
} from '@unerp/shared';
import { PurchaseOrder, PurchaseOrderItem, PurchaseReceipt, Prisma } from '@prisma/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ProcurementService {
  constructor(private readonly eventEmitter?: EventEmitter2) {}

  /**
   * Fetch all purchase orders scoped to tenantId.
   */
  async getPurchaseOrders(tenantId: string) {
    const orders = (await prisma.purchaseOrder.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        vendor: true,
        lineItems: true,
        receipts: true,
      },
      orderBy: { createdAt: 'desc' },
    })) as unknown as Array<
      PurchaseOrder & { vendor: { name: string }; lineItems: PurchaseOrderItem[]; receipts: PurchaseReceipt[] }
    >;

    return orders.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      orderDate: po.orderDate,
      expectedDate: po.expectedDate,
      subtotal: Number(po.subtotal),
      taxAmount: Number(po.taxAmount),
      totalAmount: Number(po.totalAmount),
      currency: po.currency,
      vendorName: po.vendor.name,
      notes: po.notes,
      lineItems: po.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: Number(li.quantity),
        receivedQty: Number(li.receivedQty),
        unitPrice: Number(li.unitPrice),
        taxRate: Number(li.taxRate),
        totalAmount: Number(li.totalAmount),
      })),
      receiptsCount: po.receipts.length,
    }));
  }

  /**
   * Get single purchase order by ID.
   */
  async getPurchaseOrderById(tenantId: string, id: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        vendor: true,
        lineItems: { include: { product: true }, orderBy: { sortOrder: 'asc' } },
        receipts: { include: { lineItems: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    return po;
  }

  /**
   * Create new purchase order under tenantId & orgId.
   */
  async createPurchaseOrder(tenantId: string, orgId: string, dto: CreatePurchaseOrderInput, createdBy: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) {
        throw new BadRequestException('No Organization found for this Tenant.');
      }
      resolvedOrgId = org.id;
    }

    // Check if PO number already exists
    const existing = await prisma.purchaseOrder.findFirst({
      where: { tenantId, orgId: resolvedOrgId, poNumber: dto.poNumber },
    });
    if (existing) {
      throw new BadRequestException(`PO number ${dto.poNumber} already exists.`);
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findFirst({
      where: { id: dto.vendorId, tenantId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found in this tenant context');
    }

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
          receivedQty: new Prisma.Decimal(0),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          taxRate: new Prisma.Decimal(item.taxRate),
          taxAmount: new Prisma.Decimal(lineTax),
          totalAmount: new Prisma.Decimal(lineTotal),
          sortOrder: index,
        };
      });

      const totalAmount = subtotal + totalTax;

      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          vendorId: dto.vendorId,
          poNumber: dto.poNumber,
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
          subtotal: new Prisma.Decimal(subtotal),
          taxAmount: new Prisma.Decimal(totalTax),
          totalAmount: new Prisma.Decimal(totalAmount),
          shippingAddress: dto.shippingAddress ? (dto.shippingAddress as Prisma.InputJsonObject) : Prisma.JsonNull,
          notes: dto.notes || null,
          status: 'DRAFT',
          createdBy,
        },
      });

      for (const line of linesData) {
        await tx.purchaseOrderItem.create({
          data: { ...line, purchaseOrderId: purchaseOrder.id },
        });
      }

      return purchaseOrder;
    });
  }

  /**
   * Update purchase order status.
   */
  async updatePurchaseOrderStatus(tenantId: string, id: string, status: string, userId: string) {
    const po = await prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'APPROVED') {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Record a purchase receipt against a purchase order.
   */
  async createPurchaseReceipt(tenantId: string, dto: CreatePurchaseReceiptInput, createdBy: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, tenantId },
      include: { lineItems: true },
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    // Check receipt number uniqueness
    const existingReceipt = await prisma.purchaseReceipt.findFirst({
      where: { tenantId, receiptNumber: dto.receiptNumber },
    });
    if (existingReceipt) {
      throw new BadRequestException(`Receipt number ${dto.receiptNumber} already exists.`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.purchaseReceipt.create({
        data: {
          tenantId,
          purchaseOrderId: dto.purchaseOrderId,
          receiptNumber: dto.receiptNumber,
          warehouseId: dto.warehouseId || null,
          notes: dto.notes || null,
          createdBy,
        },
      });

      for (const item of dto.lineItems) {
        await tx.purchaseReceiptItem.create({
          data: {
            tenantId,
            purchaseReceiptId: receipt.id,
            productId: item.productId || null,
            description: item.description,
            receivedQty: new Prisma.Decimal(item.receivedQty),
            acceptedQty: new Prisma.Decimal(item.acceptedQty),
            rejectedQty: new Prisma.Decimal(item.rejectedQty),
          },
        });
      }

      // Update received quantities on PO line items
      // Simplified: mark PO as PARTIALLY_RECEIVED or RECEIVED
      const allPOItems = po.lineItems;
      const totalOrdered = allPOItems.reduce((sum, li) => sum + Number(li.quantity), 0);
      const previouslyReceived = allPOItems.reduce((sum, li) => sum + Number(li.receivedQty), 0);
      const newlyReceived = dto.lineItems.reduce((sum, li) => sum + li.acceptedQty, 0);
      const totalReceived = previouslyReceived + newlyReceived;

      const newStatus = totalReceived >= totalOrdered ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      await tx.purchaseOrder.update({
        where: { id: dto.purchaseOrderId },
        data: { status: newStatus },
      });

      return receipt;
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit('procurement.receipt.created', {
        tenantId,
        purchaseOrderId: dto.purchaseOrderId,
        receiptNumber: dto.receiptNumber,
        warehouseId: dto.warehouseId,
        lineItems: dto.lineItems,
      });
    }

    return result;
  }

  /**
   * RFQ SOURCING METHODS
   */

  async getRFQs(tenantId: string) {
    const rfqs = await prisma.rFQ.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        lineItems: { include: { product: true } },
        supplierQuotations: { include: { vendor: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rfqs.map((rfq) => ({
      id: rfq.id,
      rfqNumber: rfq.rfqNumber,
      status: rfq.status,
      expectedDate: rfq.expectedDate,
      notes: rfq.notes,
      createdAt: rfq.createdAt,
      itemsCount: rfq.lineItems.length,
      quotesCount: rfq.supplierQuotations.length,
      lineItems: rfq.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: Number(li.quantity),
        productId: li.productId,
        product: li.product,
      })),
    }));
  }

  async getRFQById(tenantId: string, id: string) {
    const rfq = await prisma.rFQ.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        lineItems: { include: { product: true } },
        supplierQuotations: { include: { vendor: true, lineItems: true } },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async createRFQ(tenantId: string, orgId: string, dto: CreateRFQInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found for this Tenant.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.rFQ.findFirst({
      where: { tenantId, orgId: resolvedOrgId, rfqNumber: dto.rfqNumber },
    });
    if (existing) throw new BadRequestException(`RFQ number ${dto.rfqNumber} already exists.`);

    return prisma.$transaction(async (tx) => {
      const rfq = await tx.rFQ.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          rfqNumber: dto.rfqNumber,
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
          notes: dto.notes || null,
          status: 'DRAFT',
        },
      });

      for (const item of dto.lineItems) {
        await tx.rFQItem.create({
          data: {
            tenantId,
            rfqId: rfq.id,
            productId: item.productId || null,
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity),
          },
        });
      }

      return rfq;
    });
  }

  /**
   * SUPPLIER QUOTATION METHODS
   */

  async getSupplierQuotations(tenantId: string) {
    const quotes = await prisma.supplierQuotation.findMany({
      where: { tenantId },
      include: {
        vendor: true,
        rfq: true,
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return quotes.map((q) => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      status: q.status,
      validUntil: q.validUntil,
      subtotal: Number(q.subtotal),
      taxAmount: Number(q.taxAmount),
      totalAmount: Number(q.totalAmount),
      currency: q.currency,
      vendorName: q.vendor.name,
      rfqNumber: q.rfq?.rfqNumber,
      notes: q.notes,
      createdAt: q.createdAt,
    }));
  }

  async getSupplierQuotationById(tenantId: string, id: string) {
    const quote = await prisma.supplierQuotation.findFirst({
      where: { id, tenantId },
      include: {
        vendor: true,
        rfq: { include: { lineItems: true } },
        lineItems: { include: { product: true } },
      },
    });
    if (!quote) throw new NotFoundException('Supplier quotation not found');
    return quote;
  }

  async createSupplierQuotation(tenantId: string, orgId: string, dto: CreateSupplierQuotationInput) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.supplierQuotation.findFirst({
      where: { tenantId, orgId: resolvedOrgId, quotationNumber: dto.quotationNumber },
    });
    if (existing) throw new BadRequestException(`Quotation number ${dto.quotationNumber} already exists.`);

    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;

      const linesData = dto.lineItems.map((item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineTax = lineSubtotal * ((item.taxRate || 0) / 100);
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        totalTax += lineTax;

        return {
          tenantId,
          productId: item.productId || null,
          description: item.description,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          taxRate: new Prisma.Decimal(item.taxRate || 0),
          taxAmount: new Prisma.Decimal(lineTax),
          totalAmount: new Prisma.Decimal(lineTotal),
        };
      });

      const totalAmount = subtotal + totalTax;

      const quote = await tx.supplierQuotation.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          rfqId: dto.rfqId || null,
          vendorId: dto.vendorId,
          quotationNumber: dto.quotationNumber,
          validUntil: new Date(dto.validUntil),
          subtotal: new Prisma.Decimal(subtotal),
          taxAmount: new Prisma.Decimal(totalTax),
          totalAmount: new Prisma.Decimal(totalAmount),
          notes: dto.notes || null,
          status: 'DRAFT',
        },
      });

      for (const line of linesData) {
        await tx.supplierQuotationItem.create({
          data: { ...line, supplierQuotationId: quote.id },
        });
      }

      if (dto.rfqId) {
        await tx.rFQ.update({
          where: { id: dto.rfqId },
          data: { status: 'SENT' },
        });
      }

      return quote;
    });
  }

  async updateSupplierQuotationStatus(tenantId: string, id: string, status: string) {
    const quote = await prisma.supplierQuotation.findFirst({ where: { id, tenantId } });
    if (!quote) throw new NotFoundException('Supplier quotation not found');

    return prisma.supplierQuotation.update({
      where: { id },
      data: { status },
    });
  }

  async convertSupplierQuotationToPO(tenantId: string, id: string, createdBy: string) {
    const quote = await prisma.supplierQuotation.findFirst({
      where: { id, tenantId },
      include: { lineItems: true },
    });
    if (!quote) throw new NotFoundException('Supplier quotation not found');

    // Generate PO Number automatically
    const poNumber = `PO-QUOTE-${Math.floor(100000 + Math.random() * 900000)}`;

    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          tenantId,
          orgId: quote.orgId,
          vendorId: quote.vendorId,
          poNumber,
          status: 'DRAFT',
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          currency: quote.currency,
          notes: `Converted from Supplier Quotation ${quote.quotationNumber}. ${quote.notes || ''}`,
          rfqId: quote.rfqId,
          supplierQuotationId: quote.id,
          createdBy,
        },
      });

      for (const [index, item] of quote.lineItems.entries()) {
        await tx.purchaseOrderItem.create({
          data: {
            tenantId,
            purchaseOrderId: po.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            receivedQty: new Prisma.Decimal(0),
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            totalAmount: item.totalAmount,
            sortOrder: index,
          },
        });
      }

      await tx.supplierQuotation.update({
        where: { id },
        data: { status: 'CONVERTED' },
      });

      return po;
    });
  }

  /**
   * Fetch all purchase receipts scoped to tenantId.
   */
  async getPurchaseReceipts(tenantId: string) {
    const receipts = await prisma.purchaseReceipt.findMany({
      where: { tenantId },
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
          },
        },
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return receipts.map((r) => ({
      id: r.id,
      receiptNumber: r.receiptNumber,
      receivedDate: r.receivedDate,
      notes: r.notes,
      purchaseOrder: r.purchaseOrder
        ? {
            poNumber: r.purchaseOrder.poNumber,
            vendorName: r.purchaseOrder.vendor.name,
          }
        : null,
      itemsCount: r.lineItems.length,
    }));
  }

  // ─── Purchase Returns ──────────────────────────────

  async getPurchaseReturns(tenantId: string) {
    const returns = await prisma.purchaseReturn.findMany({
      where: { tenantId },
      include: { vendor: true, purchaseOrder: true, lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
    return returns.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      status: r.status,
      returnDate: r.returnDate,
      totalAmount: Number(r.totalAmount),
      vendorName: r.vendor.name,
      poNumber: r.purchaseOrder.poNumber,
      lineItemCount: r.lineItems.length,
    }));
  }

  async createPurchaseReturn(tenantId: string, orgId: string, dto: CreatePurchaseReturnInput, createdBy: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    const order = await prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, tenantId },
    });
    if (!order) throw new NotFoundException('Purchase Order not found');

    const existing = await prisma.purchaseReturn.findFirst({
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
      // 1. Create Debit Note
      const debitNoteNumber = `DN-PR-${dto.returnNumber.replace('PR-', '')}-${Math.floor(Math.random() * 1000)}`;
      const debitNote = await tx.debitNote.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          vendorId: order.vendorId,
          purchaseOrderId: dto.purchaseOrderId,
          noteNumber: debitNoteNumber,
          amount: new Prisma.Decimal(totalAmount),
          reason: dto.reason || 'Supplier Return',
          status: 'CONFIRMED',
        },
      });

      // 2. Create Purchase Return
      const pr = await tx.purchaseReturn.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          vendorId: order.vendorId,
          purchaseOrderId: dto.purchaseOrderId,
          purchaseReceiptId: dto.purchaseReceiptId || null,
          returnNumber: dto.returnNumber,
          status: 'COMPLETED',
          returnDate: new Date(),
          subtotal: new Prisma.Decimal(subtotal),
          taxAmount: new Prisma.Decimal(taxAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          reason: dto.reason || null,
          debitNoteId: debitNote.id,
          createdBy,
        },
      });

      // 3. Create Purchase Return Items
      for (const item of dto.lineItems) {
        const itemSub = item.quantity * item.unitPrice;
        const itemTax = itemSub * (item.taxRate / 100);
        await tx.purchaseReturnItem.create({
          data: {
            tenantId,
            purchaseReturnId: pr.id,
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

      // 4. Update PO status
      await tx.purchaseOrder.update({
        where: { id: dto.purchaseOrderId },
        data: { status: 'RETURNED' },
      });

      // 5. Emit stock return event
      if (this.eventEmitter) {
        let whId = 'WH-MAIN';
        if (dto.purchaseReceiptId) {
          const prObj = await tx.purchaseReceipt.findFirst({ where: { id: dto.purchaseReceiptId } });
          if (prObj && prObj.warehouseId) {
            whId = prObj.warehouseId;
          }
        }
        this.eventEmitter.emit('procurement.return.created', {
          tenantId,
          purchaseReturnId: pr.id,
          warehouseId: whId,
          lineItems: dto.lineItems.map((li) => ({
            productId: li.productId,
            quantity: li.quantity,
          })),
        });
      }

      return pr;
    });
  }

  // ─── Auto-Reorder Event Listener ───────────────────

  @OnEvent('procurement.order.reorder')
  async handleReorderEvent(event: {
    tenantId: string;
    productId: string;
    warehouseId: string;
    reorderQty: number;
  }) {
    const { tenantId, productId, reorderQty } = event;

    // Find the product
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) return;

    // Get an organization
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    if (!org) return;

    // Find a vendor to purchase from (select the first active vendor or fallback to any)
    const vendor = await prisma.vendor.findFirst({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
    });
    if (!vendor) return;

    // Create a new draft PO
    const poNumber = `PO-AUTO-${Math.floor(100000 + Math.random() * 900000)}`;

    const dto: CreatePurchaseOrderInput = {
      vendorId: vendor.id,
      poNumber,
      notes: `Auto-generated due to low stock level for product ${product.name} (SKU: ${product.sku}).`,
      lineItems: [
        {
          productId,
          description: product.description || product.name,
          quantity: reorderQty,
          unitPrice: Number(product.costPrice),
          taxRate: 0,
        },
      ],
    };

    await this.createPurchaseOrder(tenantId, org.id, dto, 'system-auto');
  }
}
