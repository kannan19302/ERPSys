// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsAdvancedEvmService } from "../services/projects-advanced-evm.service";
import {
  CreateEvmForecastSchema,
  SetEvmKpiTargetSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("projects-advanced-evm")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AdvancedEvmController {
  constructor(private readonly service: ProjectsAdvancedEvmService) {}

  @ApiOperation({ summary: "Calculate advanced EVM metrics" })
  @Get(":projectId/advanced-evm")
  @Permissions("projects.evm.read")
  async calculateAdvancedEVM(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.calculateAdvancedEVM(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Get EVM forecast history" })
  @Get(":projectId/evm-forecasts")
  @Permissions("projects.evm.read")
  async getEVMForecast(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getEVMForecast(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Create EVM forecast" })
  @Post("evm-forecasts")
  @Permissions("projects.evm.create")
  async createEvmForecast(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateEvmForecastSchema) dto: unknown,
  ) {
    return this.service.createEvmForecast(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: "Get TCPI analysis" })
  @Get(":projectId/tcpi")
  @Permissions("projects.evm.read")
  async getTCPI(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getTCPI(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Get EAC breakdown" })
  @Get(":projectId/eac-breakdown")
  @Permissions("projects.evm.read")
  async getEACBreakdown(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getEACBreakdown(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Create EVM snapshot" })
  @Post(":projectId/evm-snapshots")
  @Permissions("projects.evm.create")
  async createEvmSnapshot(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.createEvmSnapshot(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Get EVM snapshots" })
  @Get(":projectId/evm-snapshots")
  @Permissions("projects.evm.read")
  async getEvmSnapshots(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getEvmSnapshots(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Set EVM KPI target" })
  @Post("evm-kpi-targets")
  @Permissions("projects.evm.create")
  async setKpiTarget(
    @Req() req: AuthenticatedRequest,
    @ZodBody(SetEvmKpiTargetSchema) dto: unknown,
  ) {
    return this.service.setKpiTarget(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: "Get EVM KPI targets" })
  @Get(":projectId/evm-kpi-targets")
  @Permissions("projects.evm.read")
  async getKpiTargets(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    const { prisma } = require("@unerp/database");
    return prisma.evmKpiTarget.findMany({
      where: { tenantId: req.user.tenantId, projectId },
    });
  }

  @ApiOperation({ summary: "Get EVM dashboard" })
  @Get(":projectId/evm-dashboard")
  @Permissions("projects.evm.read")
  async getEVMDashboard(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getEVMDashboard(req.user.tenantId, projectId);
  }
}
