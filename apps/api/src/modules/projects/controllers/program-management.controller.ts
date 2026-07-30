// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsProgramService } from "../services/projects-program.service";
import {
  CreateProgramSchema,
  AddProgramProjectSchema,
  TrackProgramBenefitSchema,
  AddProgramFinancialSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("projects-program")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProgramManagementController {
  constructor(private readonly service: ProjectsProgramService) {}

  @Get("programs")
  @Permissions("projects.program.read")
  async getPrograms(@Req() req: AuthenticatedRequest) {
    return this.service.getPrograms(req.user.tenantId);
  }

  @Get("programs/:id")
  @Permissions("projects.program.read")
  async getProgramById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getProgramById(req.user.tenantId, id);
  }

  @Post("programs")
  @Permissions("projects.program.create")
  async createProgram(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateProgramSchema) dto: unknown,
  ) {
    const orgId = req.user.orgId || "org-system-default";
    return this.service.createProgram(req.user.tenantId, orgId, dto as any);
  }

  @Post("programs/:id/projects")
  @Permissions("projects.program.update")
  async addProgramProject(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(AddProgramProjectSchema) dto: unknown,
  ) {
    return this.service.addProgramProject(req.user.tenantId, id, dto as any);
  }

  @Delete("programs/projects/:linkId")
  @Permissions("projects.program.update")
  async removeProgramProject(
    @Req() req: AuthenticatedRequest,
    @Param("linkId") linkId: string,
  ) {
    return this.service.removeProgramProject(req.user.tenantId, linkId);
  }

  @Post("programs/:id/benefits")
  @Permissions("projects.program.create")
  async trackProgramBenefit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(TrackProgramBenefitSchema) dto: unknown,
  ) {
    return this.service.trackProgramBenefit(req.user.tenantId, id, dto as any);
  }

  @Put("programs/benefits/:benefitId/status")
  @Permissions("projects.program.update")
  async updateBenefitStatus(
    @Req() req: AuthenticatedRequest,
    @Param("benefitId") benefitId: string,
    @Query("status") status: string,
    @Query("actualValue") actualValue?: string,
  ) {
    return this.service.updateBenefitStatus(
      req.user.tenantId,
      benefitId,
      status,
      actualValue ? parseFloat(actualValue) : undefined,
    );
  }

  @Get("programs/:id/financials")
  @Permissions("projects.program.read")
  async getProgramFinancials(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getProgramFinancials(req.user.tenantId, id);
  }

  @Post("programs/:id/financials")
  @Permissions("projects.program.create")
  async addProgramFinancial(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(AddProgramFinancialSchema) dto: unknown,
  ) {
    return this.service.addProgramFinancial(req.user.tenantId, id, dto as any);
  }

  @Get("programs/:id/dashboard")
  @Permissions("projects.program.read")
  async getProgramDashboard(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getProgramDashboard(req.user.tenantId, id);
  }
}
