import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplierCertificationService } from "../services/supplier-certification.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createSchema = z.object({
  vendorId: z.string().min(1),
  certificationName: z.string().min(1),
  issuingBody: z.string().optional(),
  certificationNumber: z.string().optional(),
  issueDate: z.string(),
  expiryDate: z.string(),
  status: z.string().optional(),
  category: z.string().optional(),
  scope: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
});

const updateSchema = createSchema.partial();

const renewSchema = z.object({
  newExpiryDate: z.string(),
  certificationNumber: z.string().optional(),
  notes: z.string().optional(),
});

@ApiTags("supply-chain / supplier-certifications")
@ApiBearerAuth()
@Controller("supply-chain/supplier-certifications")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplierCertificationController {
  constructor(private readonly svc: SupplierCertificationService) {}

  @Get()
  @Permissions("supply-chain.certification.read")
  @ApiOperation({ summary: "List supplier certifications" })
  list(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("vendorId") vendorId?: string, @Query("status") status?: string, @Query("expiryBefore") expiryBefore?: string) {
    return this.svc.list(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, vendorId, status, expiryBefore });
  }

  @Get("expiring")
  @Permissions("supply-chain.certification.read")
  @ApiOperation({ summary: "Get certifications expiring within N days" })
  getExpiringCertifications(@Req() req: AuthRequest, @Query("days") days?: string) {
    return this.svc.getExpiringCertifications(req.user.tenantId, days ? Number(days) : 30);
  }

  @Get(":id")
  @Permissions("supply-chain.certification.read")
  @ApiOperation({ summary: "Get certification by id" })
  getById(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("supply-chain.certification.create")
  @ApiOperation({ summary: "Create supplier certification" })
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthRequest, @ZodBody(createSchema) body: z.infer<typeof createSchema>) {
    return this.svc.create(req.user.tenantId, body, req.user.userId);
  }

  @Patch(":id")
  @Permissions("supply-chain.certification.update")
  @ApiOperation({ summary: "Update supplier certification" })
  update(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(updateSchema) body: z.infer<typeof updateSchema>) {
    return this.svc.update(req.user.tenantId, id, body, req.user.userId);
  }

  @Delete(":id")
  @Permissions("supply-chain.certification.delete")
  @ApiOperation({ summary: "Delete supplier certification" })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.delete(req.user.tenantId, id);
  }

  @Post(":id/renew")
  @Permissions("supply-chain.certification.update")
  @ApiOperation({ summary: "Renew supplier certification" })
  renewCertification(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(renewSchema) body: z.infer<typeof renewSchema>) {
    return this.svc.renewCertification(req.user.tenantId, id, body, req.user.userId);
  }
}
