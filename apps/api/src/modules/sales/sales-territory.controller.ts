import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Req, Query, Body } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { SalesTerritoryService } from "./sales-territory.service";
import { createTerritorySchema, updateTerritorySchema, addTerritoryMemberSchema, createTerritoryRuleSchema, updateTerritoryRuleSchema, createTerritoryForecastSchema, updateTerritoryForecastSchema, realignTerritorySchema, assignEntitySchema, CreateTerritoryDto, UpdateTerritoryDto, AddTerritoryMemberDto, CreateTerritoryRuleDto, UpdateTerritoryRuleDto, CreateTerritoryForecastDto, UpdateTerritoryForecastDto, RealignTerritoryDto, AssignEntityDto } from "./dto/sales-extra.dto";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request { user: { tenantId: string; userId: string; orgId?: string } }

@ApiTags("sales")
@ApiBearerAuth()
@Controller("sales/territories")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesTerritoryController {
  constructor(private readonly service: SalesTerritoryService) {}

  @Get()
  @Permissions("sales.territory.read")
  @ApiOperation({ summary: "List territories" })
  async getAll(@Req() req: AuthReq) {
    return this.service.getTerritories(req.user.tenantId);
  }

  @Get("hierarchy")
  @Permissions("sales.territory.read")
  @ApiOperation({ summary: "Get territory hierarchy tree" })
  async getHierarchy(@Req() req: AuthReq) {
    return this.service.getTerritoryHierarchy(req.user.tenantId);
  }

  @Get("analytics")
  @Permissions("sales.territory.read")
  @ApiOperation({ summary: "Territory analytics" })
  async analytics(@Req() req: AuthReq) {
    return this.service.getTerritoryAnalytics(req.user.tenantId);
  }

  @Get("assignment-logs")
  @Permissions("sales.territory.read")
  @ApiOperation({ summary: "Get assignment logs" })
  async getAssignmentLogs(@Req() req: AuthReq, @Query("entityType") entityType?: string, @Query("entityId") entityId?: string) {
    return this.service.getAssignmentLogs(req.user.tenantId, entityType, entityId);
  }

  @Get(":id")
  @Permissions("sales.territory.read")
  @ApiOperation({ summary: "Get territory by id" })
  async getById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getTerritoryById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("sales.territory.create")
  @ApiOperation({ summary: "Create territory" })
  async create(@Req() req: AuthReq, @ZodBody(createTerritorySchema) dto: CreateTerritoryDto) {
    return this.service.createTerritory(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Patch(":id")
  @Permissions("sales.territory.update")
  @ApiOperation({ summary: "Update territory" })
  async update(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateTerritorySchema) dto: UpdateTerritoryDto) {
    return this.service.updateTerritory(req.user.tenantId, id, dto);
  }

  @Delete(":id")
  @Permissions("sales.territory.delete")
  @ApiOperation({ summary: "Delete territory" })
  async delete(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.deleteTerritory(req.user.tenantId, id);
  }

  @Post(":id/members")
  @Permissions("sales.territory.create")
  @ApiOperation({ summary: "Add member to territory" })
  async addMember(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(addTerritoryMemberSchema) dto: AddTerritoryMemberDto) {
    return this.service.addMember(req.user.tenantId, id, dto);
  }

  @Delete(":territoryId/members/:userId")
  @Permissions("sales.territory.delete")
  @ApiOperation({ summary: "Remove member from territory" })
  async removeMember(@Req() req: AuthReq, @Param("territoryId") territoryId: string, @Param("userId") userId: string) {
    return this.service.removeMember(req.user.tenantId, territoryId, userId);
  }

  @Patch(":territoryId/members/:userId")
  @Permissions("sales.territory.update")
  @ApiOperation({ summary: "Update member role" })
  async updateMemberRole(@Req() req: AuthReq, @Param("territoryId") territoryId: string, @Param("userId") userId: string, @Body() body: { role: string }) {
    return this.service.updateMemberRole(req.user.tenantId, territoryId, userId, body.role);
  }

  @Get(":id/rules")
  @Permissions("sales.territory.read")
  @ApiOperation({ summary: "List territory assignment rules" })
  async getRules(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getRules(req.user.tenantId, id);
  }

  @Post("rules")
  @Permissions("sales.territory.create")
  @ApiOperation({ summary: "Create assignment rule" })
  async createRule(@Req() req: AuthReq, @ZodBody(createTerritoryRuleSchema) dto: CreateTerritoryRuleDto) {
    return this.service.createRule(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Patch("rules/:id")
  @Permissions("sales.territory.update")
  @ApiOperation({ summary: "Update assignment rule" })
  async updateRule(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateTerritoryRuleSchema) dto: UpdateTerritoryRuleDto) {
    return this.service.updateRule(req.user.tenantId, id, dto);
  }

  @Delete("rules/:id")
  @Permissions("sales.territory.delete")
  @ApiOperation({ summary: "Delete assignment rule" })
  async deleteRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.deleteRule(req.user.tenantId, id);
  }

  @Post("assign")
  @Permissions("sales.territory.create")
  @ApiOperation({ summary: "Assign entity to territory" })
  async assignEntity(@Req() req: AuthReq, @ZodBody(assignEntitySchema) dto: AssignEntityDto) {
    return this.service.assignEntity(req.user.tenantId, dto);
  }

  @Get(":id/forecasts")
  @Permissions("sales.territory.read")
  @ApiOperation({ summary: "List territory forecasts" })
  async getForecasts(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getForecasts(req.user.tenantId, id);
  }

  @Post("forecasts")
  @Permissions("sales.territory.create")
  @ApiOperation({ summary: "Create territory forecast" })
  async createForecast(@Req() req: AuthReq, @ZodBody(createTerritoryForecastSchema) dto: CreateTerritoryForecastDto) {
    return this.service.createForecast(req.user.tenantId, req.user.orgId || "org-system-default", dto);
  }

  @Patch("forecasts/:id")
  @Permissions("sales.territory.update")
  @ApiOperation({ summary: "Update territory forecast" })
  async updateForecast(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateTerritoryForecastSchema) dto: UpdateTerritoryForecastDto) {
    return this.service.updateForecast(req.user.tenantId, id, dto);
  }

  @Delete("forecasts/:id")
  @Permissions("sales.territory.delete")
  @ApiOperation({ summary: "Delete territory forecast" })
  async deleteForecast(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.deleteForecast(req.user.tenantId, id);
  }

  @Post("realign")
  @Permissions("sales.territory.update")
  @ApiOperation({ summary: "Realign territory (change manager/parent)" })
  async realign(@Req() req: AuthReq, @ZodBody(realignTerritorySchema) dto: RealignTerritoryDto) {
    return this.service.realignTerritory(req.user.tenantId, req.user.orgId || "org-system-default", dto, req.user.userId);
  }
}
