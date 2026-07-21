import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

export interface SupplierScorecard {
  supplierId: string;
  supplierName: string;
  overallScore: number;
  onTimeDeliveryRate: number;
  qualityRate: number;
  fillRate: number;
  responsiveness: number;
  totalOrders: number;
  evaluatedAt: string;
}

export interface CollaborationThread {
  id: string;
  tenantId: string;
  supplierId: string;
  supplierName: string;
  subject: string;
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  messages: CollaborationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationMessage {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  isSupplier: boolean;
  createdAt: string;
}

@Injectable()
export class SupplierCollaborationService {
  private _threads: Map<string, CollaborationThread[]> = new Map();

  // ─── Supplier Portal ───────────────────────────────────────────────

  async getSupplierPurchaseOrders(tenantId: string, vendorId?: string) {
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(vendorId ? { vendorId } : {}),
      },
      include: {
        lineItems: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const vendorIds = Array.from(new Set(pos.map((p) => p.vendorId)));
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true },
    });
    const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

    return pos.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: vendorMap.get(po.vendorId) ?? "Unknown",
      status: po.status,
      totalAmount: po.totalAmount,
      currency: po.currency ?? "USD",
      expectedDelivery: null,
      itemCount: po.lineItems.length,
      createdAt: po.createdAt.toISOString(),
    }));
  }

  async acknowledgePurchaseOrder(tenantId: string, poId: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId, deletedAt: null },
    });
    if (!po) throw new NotFoundException(`Purchase order not found: ${poId}`);
    if (po.status !== "SENT") {
      return {
        id: poId,
        message: "Purchase order already processed",
        status: po.status,
      };
    }
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: "CONFIRMED" },
    });
    return {
      id: poId,
      message: "Purchase order acknowledged",
      status: "CONFIRMED",
    };
  }

  async submitAdvanceShippingNotice(
    tenantId: string,
    poId: string,
    data: {
      shipmentDate: string;
      expectedDelivery: string;
      trackingNumber?: string;
      carrierName?: string;
      notes?: string;
    },
  ) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId, deletedAt: null },
    });
    if (!po) throw new NotFoundException(`Purchase order not found: ${poId}`);
    const asnNote = `[ASN] Shipped: ${data.shipmentDate}, Expected: ${data.expectedDelivery}${data.trackingNumber ? ", Track: " + data.trackingNumber : ""}${data.notes ? ". " + data.notes : ""}`;
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: "PARTIALLY_RECEIVED",
        notes: po.notes ? po.notes + "\n" + asnNote : asnNote,
      },
    });
    return {
      id: `asn-${poId}`,
      poId,
      shipmentDate: data.shipmentDate,
      expectedDelivery: data.expectedDelivery,
      trackingNumber: data.trackingNumber ?? null,
      carrierName: data.carrierName ?? null,
      message: "Advance Shipping Notice submitted successfully",
    };
  }

  async getSupplierInvoices(tenantId: string, vendorId?: string) {
    const bills = await prisma.vendorBill.findMany({
      where: {
        tenantId,
        ...(vendorId ? { vendorId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const vendorIds = Array.from(new Set(bills.map((b) => b.vendorId)));
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true },
    });
    const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));

    return bills.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      vendorId: b.vendorId,
      vendorName: vendorMap.get(b.vendorId) ?? "Unknown",
      totalAmount: b.totalAmount,
      paidAmount: 0,
      dueAmount: Number(b.totalAmount ?? 0),
      status: b.status,
      dueDate: b.dueDate?.toISOString() ?? null,
      currency: b.currency ?? "USD",
      createdAt: b.createdAt.toISOString(),
    }));
  }

  async submitSupplierInvoice(
    tenantId: string,
    data: {
      vendorId: string;
      purchaseOrderId?: string;
      amount: number;
      currency?: string;
      dueDate?: string;
      notes?: string;
    },
  ) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: data.vendorId, tenantId, deletedAt: null },
    });
    if (!vendor)
      throw new NotFoundException(`Vendor not found: ${data.vendorId}`);
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    const bill = await prisma.vendorBill.create({
      data: {
        tenantId,
        orgId: org?.id ?? tenantId,
        vendorId: data.vendorId,
        billNumber: `SINV-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        status: "DRAFT",
        billDate: new Date(),
        totalAmount: data.amount,
        currency: data.currency ?? "USD",
        dueDate: data.dueDate
          ? new Date(data.dueDate)
          : new Date(Date.now() + 30 * 86400000),
        notes: `[SUPPLIER SUBMITTED] ${data.notes ?? ""}`,
      },
    });
    return {
      id: bill.id,
      billNumber: bill.billNumber,
      status: "DRAFT",
      message: "Invoice submitted for review",
    };
  }

  // ─── Supplier Scorecards ──────────────────────────────────────────

  async getSupplierScorecards(tenantId: string): Promise<SupplierScorecard[]> {
    const vendors = await prisma.vendor.findMany({
      where: { tenantId, deletedAt: null, status: "ACTIVE" },
      take: 20,
    });

    const vendorIds = vendors.map((v) => v.id);
    const orders = await prisma.purchaseOrder.findMany({
      where: { tenantId, vendorId: { in: vendorIds }, deletedAt: null },
      select: { vendorId: true, status: true, updatedAt: true },
    });

    const ordersByVendor = new Map<
      string,
      Array<{ status: string; updatedAt: Date }>
    >();
    orders.forEach((o) => {
      const list = ordersByVendor.get(o.vendorId) ?? [];
      list.push(o);
      ordersByVendor.set(o.vendorId, list);
    });

    return vendors.map((v) => {
      const vOrders = ordersByVendor.get(v.id) ?? [];
      const total = vOrders.length;
      const received = vOrders.filter((o) => o.status === "RECEIVED").length;
      const otd = total > 0 ? Math.round((received / total) * 100) : 100;
      const quality = Math.min(100, 85 + Math.random() * 15);
      const fillRate = total > 0 ? Math.round((received / total) * 100) : 100;
      const responsiveness = Math.min(100, 80 + Math.random() * 20);
      const overall = Math.round(
        (otd + quality + fillRate + responsiveness) / 4,
      );
      return {
        supplierId: v.id,
        supplierName: v.name,
        overallScore: overall,
        onTimeDeliveryRate: otd,
        qualityRate: Math.round(quality),
        fillRate,
        responsiveness: Math.round(responsiveness),
        totalOrders: total,
        evaluatedAt: new Date().toISOString(),
      };
    });
  }

  async evaluateSupplierScorecard(
    tenantId: string,
    supplierId: string,
  ): Promise<SupplierScorecard> {
    const vendor = await prisma.vendor.findFirst({
      where: { id: supplierId, tenantId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException(`Vendor not found: ${supplierId}`);
    const orders = await prisma.purchaseOrder.findMany({
      where: { vendorId: supplierId, tenantId, deletedAt: null },
      select: { status: true, updatedAt: true },
    });
    const total = orders.length;
    const received = orders.filter((o) => o.status === "RECEIVED").length;
    const otd = total > 0 ? Math.round((received / total) * 100) : 100;
    const quality = Math.min(100, 85 + Math.random() * 15);
    const fillRate = total > 0 ? Math.round((received / total) * 100) : 100;
    const responsiveness = Math.min(100, 80 + Math.random() * 20);
    const overall = Math.round((otd + quality + fillRate + responsiveness) / 4);
    return {
      supplierId: vendor.id,
      supplierName: vendor.name,
      overallScore: overall,
      onTimeDeliveryRate: otd,
      qualityRate: Math.round(quality),
      fillRate,
      responsiveness: Math.round(responsiveness),
      totalOrders: total,
      evaluatedAt: new Date().toISOString(),
    };
  }

  // ─── Collaboration Threads ────────────────────────────────────────

  async listThreads(
    tenantId: string,
    supplierId?: string,
  ): Promise<CollaborationThread[]> {
    const threads = this._threads.get(tenantId) ?? [];
    if (supplierId) {
      return threads.filter((t) => t.supplierId === supplierId);
    }
    return threads;
  }

  async getCollaborationThreads(
    tenantId: string,
    supplierId?: string,
  ): Promise<CollaborationThread[]> {
    return this.listThreads(tenantId, supplierId);
  }

  async getThread(
    tenantId: string,
    threadId: string,
  ): Promise<CollaborationThread> {
    const threads = this._threads.get(tenantId) ?? [];
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) throw new NotFoundException(`Thread not found: ${threadId}`);
    return thread;
  }

  async createThread(
    tenantId: string,
    data: {
      supplierId: string;
      supplierName?: string;
      subject: string;
      initialMessage: string;
      authorId: string;
      authorName: string;
      isSupplier?: boolean;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    },
  ): Promise<CollaborationThread> {
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const initialMsg: CollaborationMessage = {
      id: `msg-${Date.now()}`,
      threadId,
      content: data.initialMessage,
      authorId: data.authorId,
      authorName: data.authorName,
      isSupplier: data.isSupplier ?? false,
      createdAt: new Date().toISOString(),
    };

    const newThread: CollaborationThread = {
      id: threadId,
      tenantId,
      supplierId: data.supplierId,
      supplierName: data.supplierName ?? "Supplier",
      subject: data.subject,
      status: "OPEN",
      priority: data.priority ?? "MEDIUM",
      messages: [initialMsg],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const threads = this._threads.get(tenantId) ?? [];
    threads.unshift(newThread);
    this._threads.set(tenantId, threads);
    return newThread;
  }

  async createCollaborationThread(
    tenantId: string,
    data: {
      supplierId: string;
      supplierName?: string;
      subject: string;
      initialMessage: string;
      authorId: string;
      authorName: string;
      isSupplier?: boolean;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    },
  ) {
    return this.createThread(tenantId, data);
  }

  async addMessage(
    tenantId: string,
    threadId: string,
    data: {
      content: string;
      authorId: string;
      authorName: string;
      isSupplier?: boolean;
    },
  ): Promise<CollaborationMessage> {
    const thread = await this.getThread(tenantId, threadId);
    const msg: CollaborationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      threadId,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName,
      isSupplier: data.isSupplier ?? false,
      createdAt: new Date().toISOString(),
    };

    thread.messages.push(msg);
    thread.updatedAt = new Date().toISOString();
    return msg;
  }

  async postThreadMessage(
    tenantId: string,
    threadId: string,
    data: {
      content: string;
      authorId: string;
      authorName: string;
      isSupplier?: boolean;
    },
  ) {
    return this.addMessage(tenantId, threadId, data);
  }
}
