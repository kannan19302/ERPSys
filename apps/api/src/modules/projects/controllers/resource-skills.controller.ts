import {
  Controller,
  Get,
  Post,
  Put,
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
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsResourceSkillsService } from "../services/projects-resource-skills.service";
import {
  AddEmployeeSkillSchema,
  CreateSkillSchema,
  TrackCertificationSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("projects-resource-skills")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ResourceSkillsController {
  constructor(private readonly service: ProjectsResourceSkillsService) {}

  @Get("skills")
  @Permissions("projects.skill.read")
  async getSkills(@Req() req: AuthenticatedRequest) {
    return this.service.getSkillCatalog(req.user.tenantId);
  }

  @Post("skills")
  @Permissions("projects.skill.create")
  async createSkill(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateSkillSchema) dto: unknown,
  ) {
    return this.service.createSkill(req.user.tenantId, dto as any);
  }

  @Post("employee-skills")
  @Permissions("projects.employee-skill.create")
  async addEmployeeSkill(
    @Req() req: AuthenticatedRequest,
    @ZodBody(AddEmployeeSkillSchema) dto: unknown,
  ) {
    return this.service.addEmployeeSkill(req.user.tenantId, dto as any);
  }

  @Put("employee-skills/:id")
  @Permissions("projects.employee-skill.update")
  async updateEmployeeSkill(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Query("proficiency") proficiency?: string,
  ) {
    return { updated: true, id, tenantId: req.user.tenantId };
  }

  @Get("employees/:employeeId/skills")
  @Permissions("projects.employee-skill.read")
  async getEmployeeSkills(
    @Req() req: AuthenticatedRequest,
    @Param("employeeId") employeeId: string,
  ) {
    return this.service.getEmployeeSkills(req.user.tenantId, employeeId);
  }

  @Get("skills/:skillName/resources")
  @Permissions("projects.skill.read")
  async findResourcesBySkill(
    @Req() req: AuthenticatedRequest,
    @Param("skillName") skillName: string,
    @Query("minProficiency") minProficiency?: string,
  ) {
    return this.service.findResourcesBySkill(
      req.user.tenantId,
      skillName,
      minProficiency ? parseInt(minProficiency) : undefined,
    );
  }

  @Post("certifications")
  @Permissions("projects.certification.create")
  async trackCertification(
    @Req() req: AuthenticatedRequest,
    @ZodBody(TrackCertificationSchema) dto: unknown,
  ) {
    return this.service.trackCertification(req.user.tenantId, dto as any);
  }

  @Get("certifications")
  @Permissions("projects.certification.read")
  async getCertifications(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.service.getCertifications(req.user.tenantId, employeeId);
  }

  @Get("skill-gaps")
  @Permissions("projects.skill-gap.read")
  async analyzeSkillGaps(
    @Req() req: AuthenticatedRequest,
    @Query("projectId") projectId?: string,
  ) {
    return { tenantId: req.user.tenantId, projectId };
  }

  @Post("skill-gaps")
  @Permissions("projects.skill-gap.create")
  async createSkillGapAnalysis(
    @Req() req: AuthenticatedRequest,
    @Query("description") description?: string,
  ) {
    return { created: true, tenantId: req.user.tenantId, description };
  }

  @Get("resource-matching-dashboard")
  @Permissions("projects.skill.read")
  async getResourceMatchingDashboard(
    @Req() req: AuthenticatedRequest,
    @Query("projectId") projectId?: string,
  ) {
    return this.service.getResourceMatchingDashboard(
      req.user.tenantId,
      projectId,
    );
  }
}
