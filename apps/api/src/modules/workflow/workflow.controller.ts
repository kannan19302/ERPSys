// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { WorkflowService } from "./workflow.service";
import {
  createDefinitionSchema,
  updateDefinitionSchema,
  createSlaRuleSchema,
  createEscalationSchema,
  executeDefinitionSchema,
  createStepSchema,
  completeTaskSchema,
} from "./workflow.dtos";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("workflow")
@ApiBearerAuth()
@Controller("workflow")
@UseGuards(JwtAuthGuard, RbacGuard)
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Get("definitions")
  @Permissions("workflow.definition.read")
  @ApiOperation({ summary: "List workflow definitions" })
  async getDefinitions(@Req() req: AuthenticatedRequest) {
    return this.service.getDefinitions(req.user.tenantId);
  }

  @Get("definitions/:id")
  @Permissions("workflow.definition.read")
  @ApiOperation({ summary: "Get workflow definition by ID" })
  async getDefinitionById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getDefinitionById(req.user.tenantId, id);
  }

  @Post("definitions")
  @Permissions("workflow.definition.create")
  @ApiOperation({ summary: "Create workflow definition" })
  async createDefinition(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDefinitionSchema) body: any,
  ) {
    return this.service.createDefinition(req.user.tenantId, body);
  }

  @Put("definitions/:id")
  @Permissions("workflow.definition.update")
  @ApiOperation({ summary: "Update workflow definition" })
  async updateDefinition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateDefinitionSchema) body: any,
  ) {
    return this.service.updateDefinition(req.user.tenantId, id, body);
  }

  @Delete("definitions/:id")
  @Permissions("workflow.definition.delete")
  @ApiOperation({ summary: "Delete workflow definition" })
  async deleteDefinition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteDefinition(req.user.tenantId, id);
  }

  @Post("definitions/:id/activate")
  @Permissions("workflow.definition.update")
  @ApiOperation({ summary: "Activate workflow definition" })
  async activateDefinition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.activateDefinition(req.user.tenantId, id);
  }

  @Post("definitions/:id/deactivate")
  @Permissions("workflow.definition.update")
  @ApiOperation({ summary: "Deactivate workflow definition" })
  async deactivateDefinition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deactivateDefinition(req.user.tenantId, id);
  }

  @Post("steps")
  @Permissions("workflow.definition.update")
  @ApiOperation({ summary: "Create workflow step" })
  async createStep(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createStepSchema) body: any,
  ) {
    return this.service.createStep(req.user.tenantId, body);
  }

  @Delete("steps/:id")
  @Permissions("workflow.definition.update")
  @ApiOperation({ summary: "Delete workflow step" })
  async deleteStep(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.deleteStep(req.user.tenantId, id);
  }

  @Get("instances")
  @Permissions("workflow.instance.read")
  @ApiOperation({ summary: "List workflow instances" })
  async getInstances(
    @Req() req: AuthenticatedRequest,
    @Query("definitionId") definitionId?: string,
  ) {
    return this.service.getInstances(req.user.tenantId, definitionId);
  }

  @Post("instances")
  @Permissions("workflow.instance.create")
  @ApiOperation({ summary: "Execute workflow definition" })
  async executeDefinition(
    @Req() req: AuthenticatedRequest,
    @ZodBody(executeDefinitionSchema) body: any,
  ) {
    return this.service.executeDefinition(req.user.tenantId, body);
  }

  @Post("instances/:id/cancel")
  @Permissions("workflow.instance.update")
  @ApiOperation({ summary: "Cancel workflow instance" })
  async cancelInstance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.cancelInstance(req.user.tenantId, id);
  }

  @Get("tasks")
  @Permissions("workflow.task.read")
  @ApiOperation({ summary: "List workflow tasks" })
  async getTasks(
    @Req() req: AuthenticatedRequest,
    @Query("assigneeId") assigneeId?: string,
  ) {
    return this.service.getTasks(req.user.tenantId, assigneeId);
  }

  @Get("tasks/:id")
  @Permissions("workflow.task.read")
  @ApiOperation({ summary: "Get task by ID" })
  async getTaskById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.getTaskById(req.user.tenantId, id);
  }

  @Put("tasks/:id/complete")
  @Permissions("workflow.task.update")
  @ApiOperation({ summary: "Complete workflow task" })
  async completeTask(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(completeTaskSchema) body: any,
  ) {
    return this.service.completeTask(
      req.user.tenantId,
      id,
      body,
      req.user.userId,
    );
  }

  @Post("tasks/:id/reassign")
  @Permissions("workflow.task.update")
  @ApiOperation({ summary: "Reassign task" })
  async reassignTask(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ assigneeId: z.string() })) body: { assigneeId: string },
  ) {
    return this.service.reassignTask(req.user.tenantId, id, body.assigneeId);
  }

  @Get("sla-rules")
  @Permissions("workflow.definition.read")
  @ApiOperation({ summary: "List SLA rules" })
  async getSlaRules(@Req() req: AuthenticatedRequest) {
    return this.service.getSlaRules(req.user.tenantId);
  }

  @Post("sla-rules")
  @Permissions("workflow.definition.create")
  @ApiOperation({ summary: "Create SLA rule" })
  async createSlaRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createSlaRuleSchema) body: any,
  ) {
    return this.service.createSlaRule(req.user.tenantId, body);
  }

  @Delete("sla-rules/:id")
  @Permissions("workflow.definition.delete")
  @ApiOperation({ summary: "Delete SLA rule" })
  async deleteSlaRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteSlaRule(req.user.tenantId, id);
  }

  @Get("escalations")
  @Permissions("workflow.definition.read")
  @ApiOperation({ summary: "List escalation rules" })
  async getEscalations(@Req() req: AuthenticatedRequest) {
    return this.service.getEscalations(req.user.tenantId);
  }

  @Post("escalations")
  @Permissions("workflow.definition.create")
  @ApiOperation({ summary: "Create escalation rule" })
  async createEscalation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createEscalationSchema) body: any,
  ) {
    return this.service.createEscalation(req.user.tenantId, body);
  }

  @Delete("escalations/:id")
  @Permissions("workflow.definition.delete")
  @ApiOperation({ summary: "Delete escalation rule" })
  async deleteEscalation(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteEscalation(req.user.tenantId, id);
  }

  @Post("sla-check")
  @Permissions("workflow.definition.update")
  @ApiOperation({ summary: "Check SLA breaches" })
  async checkSlaBreaches(@Req() req: AuthenticatedRequest) {
    return this.service.checkSlaBreaches(req.user.tenantId);
  }

  @Get("audit-log")
  @Permissions("workflow.instance.read")
  @ApiOperation({ summary: "Get workflow audit logs" })
  async getAuditLogs(
    @Req() req: AuthenticatedRequest,
    @Query("instanceId") instanceId?: string,
  ) {
    return this.service.getAuditLogs(req.user.tenantId, instanceId);
  }

  @Get()
  @Permissions("workflow.definition.read")
  @ApiOperation({ summary: "Get legacy workflows" })
  async getWorkflows(@Req() req: AuthenticatedRequest) {
    return this.service.getWorkflows(req.user.tenantId);
  }

  @Post()
  @Permissions("workflow.definition.create")
  @ApiOperation({ summary: "Create legacy workflow" })
  async createWorkflow(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: any,
  ) {
    return this.service.createWorkflow(req.user.tenantId, body);
  }

  @Get("approvals")
  @Permissions("workflow.instance.read")
  @ApiOperation({ summary: "Get approval chains" })
  async getApprovalChains(@Req() req: AuthenticatedRequest) {
    return this.service.getApprovalChains(req.user.tenantId);
  }

  @Put("approvals/:id")
  @Permissions("workflow.instance.update")
  @ApiOperation({ summary: "Submit approval action" })
  async submitApprovalAction(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        status: z.enum(["APPROVED", "REJECTED"]),
        comments: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.service.submitApprovalAction(
      req.user.tenantId,
      id,
      body,
      req.user.userId,
    );
  }

  @Post("simulate")
  @Permissions("workflow.definition.read")
  @ApiOperation({ summary: "Simulate workflow" })
  async simulateWorkflow(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        triggerType: z.string(),
        entityType: z.string(),
        entityId: z.string(),
      }),
    )
    body: any,
  ) {
    return this.service.simulateWorkflow(
      req.user.tenantId,
      body.triggerType,
      body.entityType,
      body.entityId,
    );
  }
}
