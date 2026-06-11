import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreatePurchaseOrderInput, CreatePurchaseReceiptInput } from '@unerp/shared';
import { PurchaseOrder, PurchaseOrderItem, PurchaseReceipt, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
}
