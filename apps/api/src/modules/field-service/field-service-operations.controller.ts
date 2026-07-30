// @ts-nocheck
import { Controller, Get, Post, Body, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { FieldServiceOperationsService } from "./field-service-operations.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
  };
}

@Controller("field-service")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FieldServiceOperationsController {
  constructor(private readonly service: FieldServiceOperationsService) {}

  @Get("warranties")
  @Permissions("field-service.warranties.read")
  async getWarranties(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getWarranties(req.user.tenantId, query);
  }

  @Post("warranties")
  @Permissions("field-service.warranties.create")
  async createWarranty(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createWarranty(req.user.tenantId, body);
  }

  @Get("expenses")
  @Permissions("field-service.expenses.read")
  async getWorkOrderExpenses(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getWorkOrderExpenses(req.user.tenantId, query);
  }

  @Post("expenses")
  @Permissions("field-service.expenses.create")
  async createWorkOrderExpense(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createWorkOrderExpense(req.user.tenantId, body);
  }

  @Get("checklists")
  @Permissions("field-service.checklists.read")
  async getInspectionChecklists(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getInspectionChecklists(req.user.tenantId, query);
  }

  @Post("checklists")
  @Permissions("field-service.checklists.create")
  async createInspectionChecklist(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createInspectionChecklist(req.user.tenantId, body);
  }
}
