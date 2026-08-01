import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ManufacturingContractMfgService {
  async registerContractMfg(
    tenantId: string,
    data: {
      code: string;
      name: string;
      vendorId: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      capabilities?: string[];
      certifications?: string[];
      notes?: string;
    },
  ) {
    return prisma.contractManufacturer.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        vendorId: data.vendorId,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        capabilities: data.capabilities || [],
        certifications: data.certifications || [],
        notes: data.notes,
      },
    });
  }

  async getContractManufacturers(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return prisma.contractManufacturer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createOutsourcingPO(
    tenantId: string,
    data: {
      contractMfgId: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        bomId?: string;
        notes?: string;
      }>;
      expectedDate?: string;
      shippingTerms?: string;
      paymentTerms?: string;
      notes?: string;
    },
  ) {
    const mfg = await prisma.contractManufacturer.findFirst({
      where: { id: data.contractMfgId, tenantId },
    });
    if (!mfg) throw new NotFoundException("Contract manufacturer not found");
    const totalAmount = data.items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0,
    );
    return prisma.outsourcingPurchaseOrder.create({
      data: {
        tenantId,
        orderNo: `OSP-${Date.now()}`,
        contractMfgId: data.contractMfgId,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        shippingTerms: data.shippingTerms,
        paymentTerms: data.paymentTerms,
        totalAmount,
        notes: data.notes,
        items: {
          create: data.items.map((i) => ({
            tenantId,
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.quantity * i.unitPrice,
            bomId: i.bomId,
            notes: i.notes,
          })),
        },
      },
      include: { items: true },
    });
  }

  async getOutsourcingPOs(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return prisma.outsourcingPurchaseOrder.findMany({
      where,
      include: { items: true, contractMfg: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async receiveSubcontractedGoods(
    tenantId: string,
    data: {
      poId: string;
      items: Array<{ poItemId: string; receivedQty: number }>;
      notes?: string;
    },
  ) {
    const po = await prisma.outsourcingPurchaseOrder.findFirst({
      where: { id: data.poId, tenantId },
    });
    if (!po) throw new NotFoundException("Outsourcing PO not found");
    const receipt = await prisma.subcontractedReceipt.create({
      data: {
        tenantId,
        receiptNo: `SR-${Date.now()}`,
        poId: data.poId,
        contractMfgId: po.contractMfgId,
        notes: data.notes,
      },
    });
    for (const item of data.items) {
      await prisma.outsourcingPoItem.update({
        where: { id: item.poItemId },
        data: { receivedQty: { increment: item.receivedQty } },
      });
    }
    const allItems = await prisma.outsourcingPoItem.findMany({
      where: { poId: data.poId },
    });
    const allReceived = allItems.every(
      (i) => Number(i.receivedQty) >= Number(i.quantity),
    );
    if (allReceived) {
      await prisma.outsourcingPurchaseOrder.update({
        where: { id: data.poId },
        data: { status: "RECEIVED", receivedDate: new Date() },
      });
    }
    return receipt;
  }

  async getContractMfgDashboard(tenantId: string) {
    const [manufacturers, activePOs, recentReceipts] = await Promise.all([
      prisma.contractManufacturer.count({
        where: { tenantId, status: "ACTIVE" },
      }),
      prisma.outsourcingPurchaseOrder.findMany({
        where: {
          tenantId,
          status: { in: ["SENT", "CONFIRMED", "IN_PRODUCTION", "SHIPPED"] },
        },
        include: { contractMfg: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subcontractedReceipt.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { contractMfg: true, po: true },
      }),
    ]);
    const totalPoValue = activePOs.reduce(
      (sum, po) => sum + Number(po.totalAmount),
      0,
    );
    return {
      activeManufacturers: manufacturers,
      activePOCount: activePOs.length,
      totalPoValue: Math.round(totalPoValue * 100) / 100,
      activePOs,
      recentReceipts,
    };
  }

  async approveContractMfg(tenantId: string, mfgId: string) {
    const mfg = await prisma.contractManufacturer.findFirst({
      where: { id: mfgId, tenantId },
    });
    if (!mfg) throw new NotFoundException("Contract manufacturer not found");
    return prisma.contractManufacturer.update({
      where: { id: mfgId },
      data: { isApproved: true, approvedAt: new Date(), status: "ACTIVE" },
    });
  }
}
