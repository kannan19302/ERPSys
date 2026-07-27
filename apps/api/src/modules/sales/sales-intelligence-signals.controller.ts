import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SalesIntelligenceSignalsService } from "./sales-intelligence-signals.service";

@ApiTags("SalesIntelligenceSignals")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/intelligence-signals")
export class SalesIntelligenceSignalsController {
  constructor(
    private readonly intelligenceService: SalesIntelligenceSignalsService,
  ) {}

  @ApiOperation({ summary: "Get intelligence signals" })
  @Permissions("sales.intelligence.read")
  @Get()
  async getSignals(
    @Req() req: any,
    @Query("customerId") customerId?: string,
    @Query("severity") severity?: string,
    @Query("isActioned") isActioned?: string,
  ) {
    return this.intelligenceService.getSignals(req.user.tenantId, {
      customerId,
      severity,
      isActioned: isActioned !== undefined ? isActioned === "true" : undefined,
    });
  }

  @ApiOperation({ summary: "Get intelligence summary" })
  @Permissions("sales.intelligence.read")
  @Get("summary")
  async getSummary(@Req() req: any) {
    return this.intelligenceService.getSummary(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get signal by ID" })
  @Permissions("sales.intelligence.read")
  @Get(":id")
  async getSignalById(@Req() req: any, @Param("id") id: string) {
    return this.intelligenceService.getSignalById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create intelligence signal" })
  @Permissions("sales.intelligence.create")
  @Post()
  async createSignal(@Req() req: any, @Body() dto: any) {
    return this.intelligenceService.createSignal(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Mark signal as actioned" })
  @Permissions("sales.intelligence.update")
  @Put(":id/action")
  async markActioned(@Req() req: any, @Param("id") id: string) {
    return this.intelligenceService.markActioned(req.user.tenantId, id);
  }
}
