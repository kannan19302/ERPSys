import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
} from "@nestjs/common";
import { z } from "zod";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ProjectAccountingService } from "./project-accounting.service";

const costSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(["LABOR", "MATERIAL", "OVERHEAD", "OTHER"]),
  amount: z.number().positive(),
  description: z.string().optional(),
  recordedBy: z.string().optional(),
});

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("finance/project-accounting")
@ApiBearerAuth()
@Controller("finance/project-accounting")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProjectAccountingController {
  constructor(
    private readonly projectAccountingService: ProjectAccountingService,
  ) {}

  @Get("budgets")
  @Permissions("finance.fpa.read")
  async getProjectBudgets(@Req() req: AuthReq, @Query() query: any) {
    return this.projectAccountingService.getProjectBudgets(
      req.user.tenantId,
      query,
    );
  }

  @Get("projects/:projectId/costs")
  @Permissions("finance.fpa.read")
  async getProjectCosts(
    @Req() req: AuthReq,
    @Param("projectId") projectId: string,
    @Query() query: any,
  ) {
    return this.projectAccountingService.getProjectCosts(
      req.user.tenantId,
      projectId,
      query,
    );
  }

  @Post("costs")
  @Permissions("finance.fpa.manage")
  async recordCost(@Req() req: AuthReq, @Body() body: any) {
    const parsed = costSchema.parse(body);
    return this.projectAccountingService.recordProjectCost(
      req.user.tenantId,
      parsed,
    );
  }

  @Get("projects/:projectId/profitability")
  @Permissions("finance.fpa.read")
  async getProjectProfitability(
    @Req() req: AuthReq,
    @Param("projectId") projectId: string,
  ) {
    return this.projectAccountingService.getProjectProfitability(
      req.user.tenantId,
      projectId,
    );
  }

  @Get("projects/:projectId/wip")
  @Permissions("finance.fpa.read")
  async getProjectWip(
    @Req() req: AuthReq,
    @Param("projectId") projectId: string,
  ) {
    return this.projectAccountingService.getProjectWip(
      req.user.tenantId,
      projectId,
    );
  }

  @Get("analytics")
  @Permissions("finance.fpa.read")
  async getAnalytics(@Req() req: AuthReq) {
    return this.projectAccountingService.getProjectAnalytics(req.user.tenantId);
  }

  @Get("resource-allocation")
  @Permissions("finance.fpa.read")
  async getResourceAllocation(@Req() req: AuthReq, @Query() query: any) {
    return this.projectAccountingService.getProjectResourceAllocation(
      req.user.tenantId,
      query,
    );
  }
}
