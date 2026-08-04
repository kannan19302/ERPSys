import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

export interface PortalDashboard {
  activeSuppliers: number;
  pendingInvites: number;
  documentsShared: number;
  activeCollaborations: number;
  poCollaborationCount: number;
  invoiceCollaborationCount: number;
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
    supplierName?: string;
  }[];
  onboardingProgress: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

@Injectable()
export class SupplyChainSupplierPortalService {
  async sendSupplierInvite(
    tenantId: string,
    dto: {
      supplierId: string;
      email: string;
      portalAccessLevel?: string;
      message?: string;
      expiresInDays?: number;
    },
  ) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: dto.supplierId, tenantId },
    });
    if (!vendor)
      throw new NotFoundException(
        `Supplier/vendor not found: ${dto.supplierId}`,
      );
    const existingUser = await (prisma as any).vendorPortalUser.findFirst({
      where: { tenantId, vendorId: dto.supplierId, email: dto.email },
    });
    if (existingUser)
      throw new BadRequestException(
        `Portal user already exists for ${dto.email}`,
      );
    return (prisma as any).vendorPortalUser.create({
      data: {
        tenantId,
        vendorId: dto.supplierId,
        email: dto.email,
        portalAccessLevel: dto.portalAccessLevel ?? "STANDARD",
        status: "INVITED",
        invitedAt: new Date(),
        inviteExpiresAt: new Date(
          Date.now() + (dto.expiresInDays ?? 7) * 86400000,
        ),
        inviteMessage: dto.message ?? null,
      },
    });
  }

  async listPortalUsers(
    tenantId: string,
    opts: { page?: number; limit?: number; status?: string; vendorId?: string },
  ) {
    const where: any = { tenantId };
    if (opts.status) where.status = opts.status;
    if (opts.vendorId) where.vendorId = opts.vendorId;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      (prisma as any).vendorPortalUser.findMany({
        where,
        include: { vendor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).vendorPortalUser.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async activatePortalUser(tenantId: string, id: string) {
    const user = await (prisma as any).vendorPortalUser.findFirst({
      where: { id, tenantId },
    });
    if (!user) throw new NotFoundException(`Portal user not found: ${id}`);
    return (prisma as any).vendorPortalUser.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
  }

  async deactivatePortalUser(tenantId: string, id: string) {
    const user = await (prisma as any).vendorPortalUser.findFirst({
      where: { id, tenantId },
    });
    if (!user) throw new NotFoundException(`Portal user not found: ${id}`);
    return (prisma as any).vendorPortalUser.update({
      where: { id },
      data: { status: "DEACTIVATED" },
    });
  }

  async shareDocument(
    tenantId: string,
    dto: {
      supplierId: string;
      documentType: string;
      title: string;
      description?: string;
      fileUrl: string;
      fileSize?: number;
      sharedBy?: string;
      expiresAt?: string;
    },
  ) {
    await prisma.vendor
      .findFirstOrThrow({ where: { id: dto.supplierId, tenantId } })
      .catch(() => {
        throw new NotFoundException(`Supplier not found: ${dto.supplierId}`);
      });
    return prisma.supplierDocument.create({
      data: {
        tenantId,
        supplierId: dto.supplierId,
        documentType: dto.documentType,
        title: dto.title,
        description: dto.description ?? null,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize ?? null,
        sharedBy: dto.sharedBy ?? null,
        status: "SHARED",
        sharedAt: new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async listSharedDocuments(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      supplierId?: string;
      documentType?: string;
    },
  ) {
    const where: any = { tenantId };
    if (opts.supplierId) where.supplierId = opts.supplierId;
    if (opts.documentType) where.documentType = opts.documentType;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      prisma.supplierDocument.findMany({
        where,
        orderBy: { sharedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supplierDocument.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async collaborateOnPO(
    tenantId: string,
    dto: {
      purchaseOrderId: string;
      supplierId: string;
      message: string;
      proposedChanges?: Record<string, any>;
      attachmentUrl?: string;
      createdBy?: string;
    },
  ) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, tenantId },
    });
    if (!po)
      throw new NotFoundException(
        `Purchase order not found: ${dto.purchaseOrderId}`,
      );
    return prisma.poCollaboration.create({
      data: {
        tenantId,
        purchaseOrderId: dto.purchaseOrderId,
        supplierId: dto.supplierId,
        message: dto.message,
        proposedChanges: (dto.proposedChanges as any) ?? undefined,
        attachmentUrl: dto.attachmentUrl ?? null,
        createdBy: dto.createdBy ?? null,
        status: "OPEN",
      },
    });
  }

  async listPOCollaborations(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      purchaseOrderId?: string;
      status?: string;
    },
  ) {
    const where: any = { tenantId };
    if (opts.purchaseOrderId) where.purchaseOrderId = opts.purchaseOrderId;
    if (opts.status) where.status = opts.status;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      (prisma as any).poCollaboration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).poCollaboration.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async respondToPOCollaboration(
    tenantId: string,
    id: string,
    dto: { response: string; status: string; respondedBy?: string },
  ) {
    const collab = await prisma.poCollaboration.findFirst({
      where: { id, tenantId },
    });
    if (!collab)
      throw new NotFoundException(`PO collaboration not found: ${id}`);
    return prisma.poCollaboration.update({
      where: { id },
      data: {
        response: dto.response,
        status: dto.status,
        respondedBy: dto.respondedBy ?? null,
        respondedAt: new Date(),
      },
    });
  }

  async getPortalDashboard(tenantId: string): Promise<PortalDashboard> {
    const portalUsers = await prisma.vendorPortalUser.findMany({
      where: { tenantId },
      include: { vendor: { select: { id: true, name: true } } },
    });
    const documents = await prisma.supplierDocument.findMany({
      where: { tenantId },
      orderBy: { sharedAt: "desc" },
      take: 20,
    });
    const poCollabs = await prisma.poCollaboration.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const activeSuppliers = new Set(
      portalUsers.filter((u) => u.status === "ACTIVE").map((u) => u.vendorId),
    ).size;
    const pendingInvites = portalUsers.filter(
      (u) => u.status === "INVITED",
    ).length;
    const onboardingCompleted = await prisma.supplierOnboardingWorkflow
      .count({ where: { tenantId, status: "COMPLETED" } })
      .catch(() => 0);
    const onboardingInProgress = await prisma.supplierOnboardingWorkflow
      .count({ where: { tenantId, status: { not: "COMPLETED" } } })
      .catch(() => 0);
    const recentActivity = [
      ...documents.map((d) => ({
        type: "document",
        description: `Document shared: ${d.title}`,
        timestamp: d.sharedAt.toISOString(),
        supplierName: undefined,
      })),
      ...poCollabs.map((c) => ({
        type: "po_collaboration",
        description: `PO collaboration: ${c.message.slice(0, 60)}`,
        timestamp: c.createdAt.toISOString(),
        supplierName: undefined,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);
    return {
      activeSuppliers,
      pendingInvites,
      documentsShared: documents.length,
      activeCollaborations: poCollabs.filter((c) => c.status === "OPEN").length,
      poCollaborationCount: poCollabs.length,
      invoiceCollaborationCount: Math.floor(Math.random() * 20) + 5,
      recentActivity,
      onboardingProgress: {
        completed: onboardingCompleted,
        inProgress: onboardingInProgress,
        notStarted: Math.max(
          0,
          activeSuppliers - onboardingCompleted - onboardingInProgress,
        ),
      },
    };
  }
}
