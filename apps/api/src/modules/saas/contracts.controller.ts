import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createContractSchema = z.object({
  title: z.string().min(1).max(255),
  type: z.enum(["SALES", "PURCHASE", "SERVICE", "NDA", "OTHER"]).default("SERVICE"),
  value: z.number().min(0),
  currency: z.string().default("USD"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  autoRenew: z.boolean().default(false),
  renewalTermMonths: z.number().int().min(1).optional(),
  terms: z.string().optional(),
  signerName: z.string().optional(),
  signerEmail: z.string().email().optional(),
});

const updateContractSchema = createContractSchema.partial();

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["SALES", "PURCHASE", "SERVICE", "NDA", "OTHER"]).default("SERVICE"),
  content: z.string().min(1),
  isActive: z.boolean().default(true),
});

const contractTemplates = [
  { id: "t1", name: "Standard Service Agreement", type: "SERVICE" },
  { id: "t2", name: "Software License Agreement", type: "SALES" },
  { id: "t3", name: "Non-Disclosure Agreement", type: "NDA" },
  { id: "t4", name: "Purchase Agreement", type: "PURCHASE" },
];

@ApiTags("saas-contracts")
@ApiBearerAuth()
@Controller("saas/contracts")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ContractsController {

  @ApiOperation({ summary: "List all SaaS contracts" })
  @Permissions("saas.subscription.read")
  @Get()
  async listContracts(
    @Req() req: AuthReq,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const where: Record<string, unknown> = { tenantId: req.user.tenantId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.contract.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
      }),
      prisma.contract.count({ where: where as any }),
    ]);
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @ApiOperation({ summary: "Create a new contract" })
  @Permissions("saas.subscription.create")
  @Post()
  async createContract(@Req() req: AuthReq, @ZodBody(createContractSchema) body: z.infer<typeof createContractSchema>) {
    const org = await prisma.organization.findFirst({ where: { tenantId: req.user.tenantId } });
    const count = await prisma.contract.count({ where: { tenantId: req.user.tenantId } });
    return prisma.contract.create({
      data: {
        tenantId: req.user.tenantId,
        orgId: org?.id ?? req.user.tenantId,
        contractNumber: `CTR-${String(count + 1).padStart(4, "0")}`,
        title: body.title,
        type: body.type,
        value: body.value,
        currency: body.currency,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        renewalDate: new Date(body.endDate),
        autoRenew: body.autoRenew,
        renewalTermMonths: body.renewalTermMonths,
        terms: body.terms,
        signerName: body.signerName ?? null,
        signerEmail: body.signerEmail ?? null,
        status: "DRAFT",
        signatureStatus: "UNSIGNED",
      },
    });
  }

  @ApiOperation({ summary: "Get a contract by id" })
  @Permissions("saas.subscription.read")
  @Get(":id")
  async getContract(@Req() req: AuthReq, @Param("id") id: string) {
    return prisma.contract.findFirst({ where: { id, tenantId: req.user.tenantId } });
  }

  @ApiOperation({ summary: "Update a contract" })
  @Permissions("saas.subscription.update")
  @Patch(":id")
  async updateContract(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateContractSchema) body: z.infer<typeof updateContractSchema>) {
    const data: Record<string, unknown> = {};
    if (body.title) data.title = body.title;
    if (body.type) data.type = body.type;
    if (body.value !== undefined) data.value = body.value;
    if (body.currency) data.currency = body.currency;
    if (body.startDate) data.startDate = new Date(body.startDate);
    if (body.endDate) data.endDate = new Date(body.endDate);
    if (body.autoRenew !== undefined) data.autoRenew = body.autoRenew;
    if (body.terms) data.terms = body.terms;
    if (body.signerName) data.signerName = body.signerName;
    if (body.signerEmail) data.signerEmail = body.signerEmail;

    return prisma.contract.updateMany({
      where: { id, tenantId: req.user.tenantId },
      data,
    });
  }

  @ApiOperation({ summary: "Delete a contract" })
  @Permissions("saas.subscription.delete")
  @Delete(":id")
  async deleteContract(@Req() req: AuthReq, @Param("id") id: string) {
    return prisma.contract.deleteMany({ where: { id, tenantId: req.user.tenantId } });
  }

  @ApiOperation({ summary: "Sign a contract" })
  @Permissions("saas.subscription.update")
  @Post(":id/sign")
  async signContract(@Req() req: AuthReq, @Param("id") id: string) {
    await prisma.contract.updateMany({
      where: { id, tenantId: req.user.tenantId },
      data: { signatureStatus: "SIGNED", signedAt: new Date(), status: "ACTIVE" },
    });
    return { id, signatureStatus: "SIGNED", signedAt: new Date() };
  }

  @ApiOperation({ summary: "Renew a contract" })
  @Permissions("saas.subscription.update")
  @Post(":id/renew")
  async renewContract(@Req() req: AuthReq, @Param("id") id: string) {
    const contract = await prisma.contract.findFirst({ where: { id, tenantId: req.user.tenantId } });
    if (!contract) return { error: "Contract not found" };
    const newEnd = new Date(contract.endDate);
    newEnd.setMonth(newEnd.getMonth() + (contract.renewalTermMonths ?? 12));
    await prisma.contract.updateMany({
      where: { id, tenantId: req.user.tenantId },
      data: { status: "RENEWED", renewalDate: newEnd, autoRenew: true },
    });
    const count = await prisma.contract.count({ where: { tenantId: req.user.tenantId } });
    return prisma.contract.create({
      data: {
        tenantId: req.user.tenantId,
        orgId: contract.orgId,
        contractNumber: `CTR-${String(count + 1).padStart(4, "0")}`,
        title: `${contract.title} (Renewed)`,
        type: contract.type,
        value: contract.value,
        currency: contract.currency,
        startDate: contract.endDate,
        endDate: newEnd,
        renewalDate: newEnd,
        autoRenew: true,
        renewalTermMonths: contract.renewalTermMonths,
        status: "ACTIVE",
        renewedFromId: contract.id,
      },
    });
  }

  @ApiOperation({ summary: "Terminate a contract" })
  @Permissions("saas.subscription.update")
  @Post(":id/terminate")
  async terminateContract(@Req() req: AuthReq, @Param("id") id: string) {
    await prisma.contract.updateMany({
      where: { id, tenantId: req.user.tenantId },
      data: { status: "TERMINATED" },
    });
    return { id, status: "TERMINATED", terminatedAt: new Date() };
  }

  @ApiOperation({ summary: "Download contract as PDF" })
  @Permissions("saas.subscription.read")
  @Get(":id/download")
  async downloadContractPdf(@Req() req: AuthReq, @Param("id") id: string) {
    const contract = await prisma.contract.findFirst({ where: { id, tenantId: req.user.tenantId } });
    if (!contract) return { error: "Contract not found" };
    return {
      id,
      filename: `contract-${contract.contractNumber}.pdf`,
      contentType: "application/pdf",
      url: `/api/saas/contracts/${id}/download`,
      sizeBytes: 0,
    };
  }

  @ApiOperation({ summary: "List contract templates" })
  @Permissions("saas.subscription.read")
  @Get("templates")
  async listContractTemplates() {
    return contractTemplates;
  }

  @ApiOperation({ summary: "Create a contract template" })
  @Permissions("saas.subscription.create")
  @Post("templates")
  async createContractTemplate(@ZodBody(createTemplateSchema) body: z.infer<typeof createTemplateSchema>) {
    return { id: `tmpl-${Date.now()}`, ...body, createdAt: new Date() };
  }

  @ApiOperation({ summary: "Get contracts expiring soon" })
  @Permissions("saas.subscription.read")
  @Get("expiring")
  async getExpiringContracts(@Req() req: AuthReq) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 86400000);
    const items = await prisma.contract.findMany({
      where: {
        tenantId: req.user.tenantId,
        status: "ACTIVE",
        endDate: { lte: thirtyDays, gte: now },
      },
      orderBy: { endDate: "asc" },
    });
    return { items, total: items.length, expiringWithinDays: 30 };
  }
}
