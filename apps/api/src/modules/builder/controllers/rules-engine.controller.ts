// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { BuilderRulesService } from "../services/builder-rules.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller("builder")
@UseGuards(JwtAuthGuard, RbacGuard)
export class RulesEngineController {
  constructor(private readonly service: BuilderRulesService) {}

  @Get("decision-tables")
  @Permissions("builder.rules-engine.read")
  async getDecisionTables(
    @Req() req: AuthenticatedRequest,
    @Query("search") search?: string,
  ) {
    return this.service.getDecisionTables(req.user.tenantId, { search });
  }

  @Get("decision-tables/:id")
  @Permissions("builder.rules-engine.read")
  async getDecisionTableById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getDecisionTableById(req.user.tenantId, id);
  }

  @Post("decision-tables")
  @Permissions("builder.rules-engine.create")
  async createDecisionTable(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
  ) {
    return this.service.createDecisionTable(req.user.tenantId, dto);
  }

  @Patch("decision-tables/:id")
  @Permissions("builder.rules-engine.update")
  async updateDecisionTable(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateDecisionTable(req.user.tenantId, id, dto);
  }

  @Delete("decision-tables/:id")
  @Permissions("builder.rules-engine.delete")
  async deleteDecisionTable(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteDecisionTable(req.user.tenantId, id);
  }

  @Get("rule-sets")
  @Permissions("builder.rules-engine.read")
  async getRuleSets(@Req() req: AuthenticatedRequest) {
    return this.service.getRuleSets(req.user.tenantId);
  }

  @Get("rule-sets/:id")
  @Permissions("builder.rules-engine.read")
  async getRuleSetById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getRuleSetById(req.user.tenantId, id);
  }

  @Post("rule-sets")
  @Permissions("builder.rules-engine.create")
  async createRuleSet(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.createRuleSet(req.user.tenantId, dto);
  }

  @Post("rule-sets/:id/rules")
  @Permissions("builder.rules-engine.create")
  async addRuleToSet(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.addRuleToSet(req.user.tenantId, id, dto);
  }

  @Post("rule-sets/:id/evaluate")
  @Permissions("builder.rules-engine.evaluate")
  async evaluateRules(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.evaluateRules(req.user.tenantId, id, dto);
  }

  @Get("rules-engine/analytics")
  @Permissions("builder.rules-engine.read")
  async getRuleAnalytics(@Req() req: AuthenticatedRequest) {
    return this.service.getRuleAnalytics(req.user.tenantId);
  }

  @Post("rule-sets/:id/version")
  @Permissions("builder.rules-engine.update")
  async versionRule(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.versionRule(req.user.tenantId, id);
  }
}
