import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WorkflowAdvancedService } from "./workflow-advanced.service";
import {
  createTemplateSchema,
  updateTemplateSchema,
  createCategorySchema,
  updateCategorySchema,
  createVersionSchema,
  createConditionSchema,
  updateConditionSchema,
  createLoopSchema,
  updateLoopSchema,
  createSubprocessSchema,
  createErrorHandlerSchema,
  updateErrorHandlerSchema,
  createNotificationSchema,
  updateNotificationSchema,
  createWebhookSchema,
  updateWebhookSchema,
  createTagSchema,
  updateTagSchema,
  assignTagsSchema,
  exportWorkflowSchema,
  importWorkflowSchema,
  testWorkflowSchema,
  delegatedTaskSchema,
  setPrioritySchema,
} from "./workflow-advanced.dtos";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; orgId?: string };
}

@ApiTags("workflow-advanced")
@ApiBearerAuth()
@Controller("workflow")
@UseGuards(JwtAuthGuard, RbacGuard)
export class WorkflowAdvancedController {
  constructor(private readonly svc: WorkflowAdvancedService) {}

  // ── Templates ──
  @Get("templates")
  @Permissions("workflow.template.read")
  @ApiOperation({ summary: "List workflow templates" })
  async getTemplates(
    @Req() req: AuthReq,
    @Query("category") category?: string,
  ) {
    return this.svc.getTemplates(req.user.tenantId, category);
  }

  @Post("templates")
  @Permissions("workflow.template.create")
  @ApiOperation({ summary: "Create workflow template" })
  async createTemplate(
    @Req() req: AuthReq,
    @ZodBody(createTemplateSchema) body: any,
  ) {
    return this.svc.createTemplate(req.user.tenantId, body, req.user.userId);
  }

  @Patch("templates/:id")
  @Permissions("workflow.template.update")
  @ApiOperation({ summary: "Update workflow template" })
  async updateTemplate(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateTemplateSchema) body: any,
  ) {
    return this.svc.updateTemplate(req.user.tenantId, id, body);
  }

  @Delete("templates/:id")
  @Permissions("workflow.template.delete")
  @ApiOperation({ summary: "Delete workflow template" })
  async deleteTemplate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteTemplate(req.user.tenantId, id);
  }

  // ── Categories ──
  @Get("categories")
  @Permissions("workflow.category.read")
  @ApiOperation({ summary: "List workflow categories" })
  async getCategories(@Req() req: AuthReq) {
    return this.svc.getCategories(req.user.tenantId);
  }

  @Post("categories")
  @Permissions("workflow.category.create")
  @ApiOperation({ summary: "Create workflow category" })
  async createCategory(
    @Req() req: AuthReq,
    @ZodBody(createCategorySchema) body: any,
  ) {
    return this.svc.createCategory(req.user.tenantId, body, req.user.userId);
  }

  @Patch("categories/:id")
  @Permissions("workflow.category.update")
  @ApiOperation({ summary: "Update workflow category" })
  async updateCategory(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateCategorySchema) body: any,
  ) {
    return this.svc.updateCategory(req.user.tenantId, id, body);
  }

  @Delete("categories/:id")
  @Permissions("workflow.category.delete")
  @ApiOperation({ summary: "Delete workflow category" })
  async deleteCategory(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteCategory(req.user.tenantId, id);
  }

  // ── Versions ──
  @Get("definitions/:definitionId/versions")
  @Permissions("workflow.version.read")
  @ApiOperation({ summary: "List workflow versions" })
  async getVersions(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
  ) {
    return this.svc.getVersions(req.user.tenantId, definitionId);
  }

  @Post("definitions/:definitionId/versions")
  @Permissions("workflow.version.create")
  @ApiOperation({ summary: "Create workflow version" })
  async createVersion(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
    @ZodBody(createVersionSchema) body: any,
  ) {
    return this.svc.createVersion(
      req.user.tenantId,
      definitionId,
      body.changeLog,
      req.user.userId,
    );
  }

  @Post("versions/:id/restore")
  @Permissions("workflow.version.restore")
  @ApiOperation({ summary: "Restore workflow version" })
  async restoreVersion(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.restoreVersion(req.user.tenantId, id);
  }

  @Delete("versions/:id")
  @Permissions("workflow.version.create")
  @ApiOperation({ summary: "Delete workflow version" })
  async deleteVersion(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteVersion(req.user.tenantId, id);
  }

  // ── Conditions ──
  @Get("definitions/:definitionId/conditions")
  @Permissions("workflow.condition.read")
  @ApiOperation({ summary: "List workflow conditions" })
  async getConditions(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
  ) {
    return this.svc.getConditions(req.user.tenantId, definitionId);
  }

  @Post("conditions")
  @Permissions("workflow.condition.create")
  @ApiOperation({ summary: "Create workflow condition" })
  async createCondition(
    @Req() req: AuthReq,
    @ZodBody(createConditionSchema) body: any,
  ) {
    return this.svc.createCondition(req.user.tenantId, body, req.user.userId);
  }

  @Patch("conditions/:id")
  @Permissions("workflow.condition.update")
  @ApiOperation({ summary: "Update workflow condition" })
  async updateCondition(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateConditionSchema) body: any,
  ) {
    return this.svc.updateCondition(req.user.tenantId, id, body);
  }

  @Delete("conditions/:id")
  @Permissions("workflow.condition.delete")
  @ApiOperation({ summary: "Delete workflow condition" })
  async deleteCondition(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteCondition(req.user.tenantId, id);
  }

  // ── Loops ──
  @Get("definitions/:definitionId/loops")
  @Permissions("workflow.loop.read")
  @ApiOperation({ summary: "List workflow loops" })
  async getLoops(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
  ) {
    return this.svc.getLoops(req.user.tenantId, definitionId);
  }

  @Post("loops")
  @Permissions("workflow.loop.create")
  @ApiOperation({ summary: "Create workflow loop" })
  async createLoop(@Req() req: AuthReq, @ZodBody(createLoopSchema) body: any) {
    return this.svc.createLoop(req.user.tenantId, body, req.user.userId);
  }

  @Patch("loops/:id")
  @Permissions("workflow.loop.update")
  @ApiOperation({ summary: "Update workflow loop" })
  async updateLoop(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateLoopSchema) body: any,
  ) {
    return this.svc.updateLoop(req.user.tenantId, id, body);
  }

  @Delete("loops/:id")
  @Permissions("workflow.loop.delete")
  @ApiOperation({ summary: "Delete workflow loop" })
  async deleteLoop(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteLoop(req.user.tenantId, id);
  }

  // ── Subprocesses ──
  @Get("definitions/:definitionId/subprocesses")
  @Permissions("workflow.subprocess.read")
  @ApiOperation({ summary: "List subprocesses" })
  async getSubprocesses(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
  ) {
    return this.svc.getSubprocesses(req.user.tenantId, definitionId);
  }

  @Post("subprocesses")
  @Permissions("workflow.subprocess.create")
  @ApiOperation({ summary: "Create subprocess" })
  async createSubprocess(
    @Req() req: AuthReq,
    @ZodBody(createSubprocessSchema) body: any,
  ) {
    return this.svc.createSubprocess(req.user.tenantId, body, req.user.userId);
  }

  @Delete("subprocesses/:id")
  @Permissions("workflow.subprocess.delete")
  @ApiOperation({ summary: "Delete subprocess" })
  async deleteSubprocess(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteSubprocess(req.user.tenantId, id);
  }

  // ── Error Handlers ──
  @Get("definitions/:definitionId/error-handlers")
  @Permissions("workflow.error-handler.read")
  @ApiOperation({ summary: "List error handlers" })
  async getErrorHandlers(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
  ) {
    return this.svc.getErrorHandlers(req.user.tenantId, definitionId);
  }

  @Post("error-handlers")
  @Permissions("workflow.error-handler.create")
  @ApiOperation({ summary: "Create error handler" })
  async createErrorHandler(
    @Req() req: AuthReq,
    @ZodBody(createErrorHandlerSchema) body: any,
  ) {
    return this.svc.createErrorHandler(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Patch("error-handlers/:id")
  @Permissions("workflow.error-handler.update")
  @ApiOperation({ summary: "Update error handler" })
  async updateErrorHandler(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateErrorHandlerSchema) body: any,
  ) {
    return this.svc.updateErrorHandler(req.user.tenantId, id, body);
  }

  @Delete("error-handlers/:id")
  @Permissions("workflow.error-handler.delete")
  @ApiOperation({ summary: "Delete error handler" })
  async deleteErrorHandler(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteErrorHandler(req.user.tenantId, id);
  }

  // ── Notifications ──
  @Get("definitions/:definitionId/notifications")
  @Permissions("workflow.notification.read")
  @ApiOperation({ summary: "List workflow notifications" })
  async getNotifications(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
  ) {
    return this.svc.getNotifications(req.user.tenantId, definitionId);
  }

  @Post("notifications")
  @Permissions("workflow.notification.create")
  @ApiOperation({ summary: "Create workflow notification" })
  async createNotification(
    @Req() req: AuthReq,
    @ZodBody(createNotificationSchema) body: any,
  ) {
    return this.svc.createNotification(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Patch("notifications/:id")
  @Permissions("workflow.notification.update")
  @ApiOperation({ summary: "Update workflow notification" })
  async updateNotification(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateNotificationSchema) body: any,
  ) {
    return this.svc.updateNotification(req.user.tenantId, id, body);
  }

  @Delete("notifications/:id")
  @Permissions("workflow.notification.delete")
  @ApiOperation({ summary: "Delete workflow notification" })
  async deleteNotification(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteNotification(req.user.tenantId, id);
  }

  // ── Webhooks ──
  @Get("definitions/:definitionId/webhooks")
  @Permissions("workflow.webhook.read")
  @ApiOperation({ summary: "List workflow webhooks" })
  async getWebhooks(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
  ) {
    return this.svc.getWebhooks(req.user.tenantId, definitionId);
  }

  @Post("webhooks")
  @Permissions("workflow.webhook.create")
  @ApiOperation({ summary: "Create workflow webhook" })
  async createWebhook(
    @Req() req: AuthReq,
    @ZodBody(createWebhookSchema) body: any,
  ) {
    return this.svc.createWebhook(req.user.tenantId, body, req.user.userId);
  }

  @Patch("webhooks/:id")
  @Permissions("workflow.webhook.update")
  @ApiOperation({ summary: "Update workflow webhook" })
  async updateWebhook(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateWebhookSchema) body: any,
  ) {
    return this.svc.updateWebhook(req.user.tenantId, id, body);
  }

  @Delete("webhooks/:id")
  @Permissions("workflow.webhook.delete")
  @ApiOperation({ summary: "Delete workflow webhook" })
  async deleteWebhook(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteWebhook(req.user.tenantId, id);
  }

  // ── Metrics & Dashboard ──
  @Get("metrics")
  @Permissions("workflow.metric.read")
  @ApiOperation({ summary: "Get workflow metrics" })
  async getMetrics(
    @Req() req: AuthReq,
    @Query("definitionId") definitionId?: string,
  ) {
    return this.svc.getMetrics(req.user.tenantId, definitionId);
  }

  @Get("dashboard")
  @Permissions("workflow.dashboard.read")
  @ApiOperation({ summary: "Get workflow dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  // ── Tags ──
  @Get("tags")
  @Permissions("workflow.tag.read")
  @ApiOperation({ summary: "List workflow tags" })
  async getTags(@Req() req: AuthReq) {
    return this.svc.getTags(req.user.tenantId);
  }

  @Post("tags")
  @Permissions("workflow.tag.create")
  @ApiOperation({ summary: "Create workflow tag" })
  async createTag(@Req() req: AuthReq, @ZodBody(createTagSchema) body: any) {
    return this.svc.createTag(req.user.tenantId, body, req.user.userId);
  }

  @Patch("tags/:id")
  @Permissions("workflow.tag.update")
  @ApiOperation({ summary: "Update workflow tag" })
  async updateTag(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateTagSchema) body: any,
  ) {
    return this.svc.updateTag(req.user.tenantId, id, body);
  }

  @Delete("tags/:id")
  @Permissions("workflow.tag.delete")
  @ApiOperation({ summary: "Delete workflow tag" })
  async deleteTag(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteTag(req.user.tenantId, id);
  }

  @Post("definitions/:definitionId/tags")
  @Permissions("workflow.tag.assign")
  @ApiOperation({ summary: "Assign tags to definition" })
  async assignTags(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
    @ZodBody(assignTagsSchema) body: any,
  ) {
    return this.svc.assignTags(req.user.tenantId, definitionId, body.tagIds);
  }

  @Get("definitions/:definitionId/tags")
  @Permissions("workflow.tag.read")
  @ApiOperation({ summary: "Get tags for definition" })
  async getDefinitionTags(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
  ) {
    return this.svc.getDefinitionTags(req.user.tenantId, definitionId);
  }

  // ── Export / Import ──
  @Get("definitions/:definitionId/export")
  @Permissions("workflow.export.create")
  @ApiOperation({ summary: "Export workflow definition" })
  async exportWorkflow(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
  ) {
    return this.svc.exportWorkflow(req.user.tenantId, definitionId);
  }

  @Post("import")
  @Permissions("workflow.import.create")
  @ApiOperation({ summary: "Import workflow definition" })
  async importWorkflow(
    @Req() req: AuthReq,
    @ZodBody(importWorkflowSchema) body: any,
  ) {
    return this.svc.importWorkflow(req.user.tenantId, body);
  }

  // ── Test ──
  @Post("definitions/:definitionId/test")
  @Permissions("workflow.test.create")
  @ApiOperation({ summary: "Test workflow definition" })
  async testWorkflow(
    @Req() req: AuthReq,
    @Param("definitionId") definitionId: string,
    @ZodBody(testWorkflowSchema) body: any,
  ) {
    return this.svc.testWorkflow(
      req.user.tenantId,
      definitionId,
      body.testInput,
    );
  }

  // ── Delegation ──
  @Post("delegations")
  @Permissions("workflow.delegation.manage")
  @ApiOperation({ summary: "Delegate tasks" })
  async createDelegation(
    @Req() req: AuthReq,
    @ZodBody(delegatedTaskSchema) body: any,
  ) {
    return this.svc.createDelegation(
      req.user.tenantId,
      body.originalAssigneeId,
      body.delegatedToId,
      body.reason,
      req.user.userId,
    );
  }

  // ── Priority ──
  @Patch("tasks/:id/priority")
  @Permissions("workflow.priority.manage")
  @ApiOperation({ summary: "Set task priority" })
  async setPriority(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(setPrioritySchema) body: any,
  ) {
    return this.svc.setPriority(req.user.tenantId, id, body.priority);
  }
}
