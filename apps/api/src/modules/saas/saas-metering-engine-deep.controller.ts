import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasMeteringEngineDeepService } from "./saas-metering-engine-deep.service";

@ApiTags("SaasMeteringEngineDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/metering-engine-deep")
export class SaasMeteringEngineDeepController {
  constructor(
    private readonly meteringService: SaasMeteringEngineDeepService,
  ) {}

  @ApiOperation({ summary: "Get SaaS metering rules" })
  @Permissions("saas.metering.read")
  @Get("rules")
  async getMeteringRules(@Req() req: any) {
    return this.meteringService.getMeteringRules(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create SaaS metering rule" })
  @Permissions("saas.metering.create")
  @Post("rules")
  async createMeteringRule(@Req() req: any, @Body() dto: any) {
    return this.meteringService.createMeteringRule(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Process usage event batch" })
  @Permissions("saas.metering.update")
  @Post("process-batch")
  async processUsageBatch(
    @Req() req: any,
    @Body() dto: { batchRef: string; events: any[] },
  ) {
    return this.meteringService.processUsageBatch(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get usage batch history" })
  @Permissions("saas.metering.read")
  @Get("batches")
  async getBatchHistory(@Req() req: any) {
    return this.meteringService.getBatchHistory(req.user.tenantId);
  }
}
