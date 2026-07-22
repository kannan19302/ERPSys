import { Controller, Get, Post, Patch, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplierQualityService } from "../services/supplier-quality.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createSchema = z.object({
  vendorId: z.string().min(1),
  productId: z.string().optional(),
  inspectionDate: z.string(),
  inspectorName: z.string().optional(),
  severity: z.enum(["CRITICAL", "MAJOR", "MINOR", "OBSERVATION"]),
  defectType: z.string().optional(),
  description: z.string().min(1),
  quantityInspected: z.number().optional(),
  quantityDefective: z.number().optional(),
  status: z.string().optional(),
  disposition: z.string().optional(),
  correctiveAction: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

const raiseCarSchema = z.object({
  rootCause: z.string().min(1),
  correctiveAction: z.string().min(1),
  dueDate: z.string(),
});

@ApiTags("supply-chain / supplier-quality")
@ApiBearerAuth()
@Controller("supply-chain/supplier-quality")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplierQualityController {
  constructor(private readonly svc: SupplierQualityService) {}

  @Get()
  @Permissions("supply-chain.quality.read")
  @ApiOperation({ summary: "List supplier quality records" })
  list(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("vendorId") vendorId?: string, @Query("status") status?: string, @Query("severity") severity?: string, @Query("sortBy") sortBy?: string, @Query("sortOrder") sortOrder?: string) {
    return this.svc.list(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, vendorId, status, severity, sortBy, sortOrder });
  }

  @Get(":id")
  @Permissions("supply-chain.quality.read")
  @ApiOperation({ summary: "Get quality record by id" })
  getById(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("supply-chain.quality.create")
  @ApiOperation({ summary: "Create supplier quality record" })
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: AuthRequest, @ZodBody(createSchema) body: z.infer<typeof createSchema>) {
    return this.svc.create(req.user.tenantId, body, req.user.userId);
  }

  @Patch(":id")
  @Permissions("supply-chain.quality.update")
  @ApiOperation({ summary: "Update supplier quality record" })
  update(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(updateSchema) body: z.infer<typeof updateSchema>) {
    return this.svc.update(req.user.tenantId, id, body, req.user.userId);
  }

  @Delete(":id")
  @Permissions("supply-chain.quality.delete")
  @ApiOperation({ summary: "Delete supplier quality record" })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.delete(req.user.tenantId, id);
  }

  @Post(":id/raise-car")
  @Permissions("supply-chain.quality.update")
  @ApiOperation({ summary: "Raise corrective action request (CAR) for a quality record" })
  @HttpCode(HttpStatus.CREATED)
  raiseCar(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(raiseCarSchema) body: z.infer<typeof raiseCarSchema>) {
    return this.svc.raiseCar(req.user.tenantId, id, body, req.user.userId);
  }
}
