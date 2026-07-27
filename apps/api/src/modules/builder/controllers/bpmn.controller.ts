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
import { BuilderBpmnService } from "../services/builder-bpmn.service";

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
export class BpmnController {
  constructor(private readonly service: BuilderBpmnService) {}

  @Get("bpmn/processes")
  @Permissions("builder.bpmn.read")
  async getBpmnProcesses(
    @Req() req: AuthenticatedRequest,
    @Query("search") search?: string,
  ) {
    return this.service.getBpmnProcesses(req.user.tenantId, { search });
  }

  @Get("bpmn/processes/:id")
  @Permissions("builder.bpmn.read")
  async getBpmnProcessById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getBpmnProcessById(req.user.tenantId, id);
  }

  @Post("bpmn/processes")
  @Permissions("builder.bpmn.create")
  async createBpmnProcess(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.createBpmnProcess(req.user.tenantId, dto);
  }

  @Patch("bpmn/processes/:id")
  @Permissions("builder.bpmn.update")
  async updateBpmnProcess(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateBpmnProcess(req.user.tenantId, id, dto);
  }

  @Delete("bpmn/processes/:id")
  @Permissions("builder.bpmn.delete")
  async deleteBpmnProcess(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteBpmnProcess(req.user.tenantId, id);
  }

  @Post("bpmn/processes/:id/gateways")
  @Permissions("builder.bpmn.update")
  async addGateway(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.addGateway(req.user.tenantId, id, dto);
  }

  @Post("bpmn/processes/:id/timers")
  @Permissions("builder.bpmn.update")
  async addTimerEvent(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.addTimerEvent(req.user.tenantId, id, dto);
  }

  @Post("bpmn/processes/:id/execute")
  @Permissions("builder.bpmn.create")
  async executeWorkflowInstance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.executeWorkflowInstance(req.user.tenantId, id, dto);
  }

  @Get("bpmn/processes/:id/instances")
  @Permissions("builder.bpmn.read")
  async getBpmnInstances(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getBpmnInstances(req.user.tenantId, id);
  }

  @Get("bpmn/dashboard")
  @Permissions("builder.bpmn.read")
  async getBpmnDashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getBpmnDashboard(req.user.tenantId);
  }

  @Post("bpmn/instances/:id/escalate")
  @Permissions("builder.bpmn.update")
  async escalateProcess(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.escalateProcess(req.user.tenantId, id, dto);
  }
}
