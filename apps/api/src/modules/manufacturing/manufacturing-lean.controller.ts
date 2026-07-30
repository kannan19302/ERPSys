// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ManufacturingLeanService } from "./manufacturing-lean.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("manufacturing")
@ApiBearerAuth()
@Controller("manufacturing/lean")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingLeanController {
  constructor(private readonly service: ManufacturingLeanService) {}

  @ApiOperation({ summary: "Create kanban board" })
  @Permissions("manufacturing.lean.create")
  @Post("kanban-boards")
  async createKanbanBoard(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createKanbanBoard(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get kanban boards" })
  @Permissions("manufacturing.lean.read")
  @Get("kanban-boards")
  async getKanbanBoards(@Req() req: AuthReq) {
    return this.service.getKanbanBoards(req.user.tenantId);
  }

  @ApiOperation({ summary: "Add kanban card" })
  @Permissions("manufacturing.lean.create")
  @Post("kanban-cards")
  async addKanbanCard(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.addKanbanCard(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Move kanban card" })
  @Permissions("manufacturing.lean.create")
  @Post("kanban-cards/:id/move")
  async moveKanbanCard(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(z.any()) body: any,
  ) {
    return this.service.moveKanbanCard(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Log improvement idea" })
  @Permissions("manufacturing.lean.create")
  @Post("improvements")
  async logImprovementIdea(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.logImprovementIdea(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get improvements" })
  @Permissions("manufacturing.lean.read")
  @Get("improvements")
  async getImprovements(@Req() req: AuthReq, @Query("status") status?: string) {
    return this.service.getImprovements(req.user.tenantId, status);
  }

  @ApiOperation({ summary: "Create value stream map" })
  @Permissions("manufacturing.lean.create")
  @Post("value-stream-maps")
  async createValueStreamMap(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.createValueStreamMap(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get value stream maps" })
  @Permissions("manufacturing.lean.read")
  @Get("value-stream-maps")
  async getValueStreamMaps(
    @Req() req: AuthReq,
    @Query("productId") productId?: string,
  ) {
    return this.service.getValueStreamMaps(req.user.tenantId, productId);
  }

  @ApiOperation({ summary: "Log waste" })
  @Permissions("manufacturing.lean.create")
  @Post("waste")
  async logWaste(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.service.logWaste(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get waste analysis" })
  @Permissions("manufacturing.lean.read")
  @Get("waste-analysis")
  async getWasteAnalysis(@Req() req: AuthReq) {
    return this.service.getWasteAnalysis(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get lean dashboard" })
  @Permissions("manufacturing.lean.read")
  @Get("dashboard")
  async getLeanDashboard(@Req() req: AuthReq) {
    return this.service.getLeanDashboard(req.user.tenantId);
  }
}
