import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplierAssessmentService } from "../services/supplier-assessment.service";

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createSchema = z.object({
  vendorId: z.string().min(1),
  assessmentType: z.string().min(1),
  assessorName: z.string().optional(),
  assessmentDate: z.string(),
  score: z.number().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  overallRating: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

const completeSchema = z.object({
  score: z.number(),
  findings: z.string(),
  recommendations: z.string(),
  overallRating: z.string(),
});

@ApiTags("supply-chain / supplier-assessments")
@ApiBearerAuth()
@Controller("supply-chain/supplier-assessments")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplierAssessmentController {
  constructor(private readonly svc: SupplierAssessmentService) {}

  @Get()
  @Permissions("supply-chain.assessment.read")
  @ApiOperation({ summary: "List supplier assessments" })
  list(
    @Req() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("vendorId") vendorId?: string,
    @Query("status") status?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.svc.list(req.user.tenantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      vendorId,
      status,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    });
  }

  @Get(":id")
  @Permissions("supply-chain.assessment.read")
  @ApiOperation({ summary: "Get assessment by id" })
  getById(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("supply-chain.assessment.create")
  @ApiOperation({ summary: "Create supplier assessment" })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthRequest,
    @ZodBody(createSchema) body: z.infer<typeof createSchema>,
  ) {
    return this.svc.create(req.user.tenantId, body as any);
  }

  @Patch(":id")
  @Permissions("supply-chain.assessment.update")
  @ApiOperation({ summary: "Update supplier assessment" })
  update(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(updateSchema) body: z.infer<typeof updateSchema>,
  ) {
    return this.svc.update(req.user.tenantId, id, body as any);
  }

  @Delete(":id")
  @Permissions("supply-chain.assessment.delete")
  @ApiOperation({ summary: "Delete supplier assessment" })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.delete(req.user.tenantId, id);
  }

  @Post(":id/complete")
  @Permissions("supply-chain.assessment.update")
  @ApiOperation({
    summary: "Complete a supplier assessment with score and rating",
  })
  complete(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @ZodBody(completeSchema) body: z.infer<typeof completeSchema>,
  ) {
    return this.svc.complete(req.user.tenantId, id, body);
  }
}
