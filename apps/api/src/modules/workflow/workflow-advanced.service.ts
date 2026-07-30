import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class WorkflowAdvancedService {
  private readonly logger = new Logger(WorkflowAdvancedService.name);

  async getTemplates(tenantId: string, category?: string) {
    const where: Prisma.WorkflowTemplateWhereInput = { tenantId };
    if (category) where.category = category;
    return prisma.workflowTemplate.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async createTemplate(tenantId: string, dto: any, userId: string) {
    return prisma.workflowTemplate.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateTemplate(tenantId: string, id: string, dto: any) {
    const tpl = await prisma.workflowTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tpl) throw new NotFoundException("Template not found");
    return prisma.workflowTemplate.update({ where: { id }, data: dto });
  }

  async deleteTemplate(tenantId: string, id: string) {
    const tpl = await prisma.workflowTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tpl) throw new NotFoundException("Template not found");
    await prisma.workflowTemplate.delete({ where: { id } });
    return { success: true };
  }

  async getCategories(tenantId: string) {
    return prisma.workflowCategory.findMany({
      where: { tenantId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createCategory(tenantId: string, dto: any, userId: string) {
    return prisma.workflowCategory.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateCategory(tenantId: string, id: string, dto: any) {
    const cat = await prisma.workflowCategory.findFirst({
      where: { id, tenantId },
    });
    if (!cat) throw new NotFoundException("Category not found");
    return prisma.workflowCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(tenantId: string, id: string) {
    const cat = await prisma.workflowCategory.findFirst({
      where: { id, tenantId },
    });
    if (!cat) throw new NotFoundException("Category not found");
    await prisma.workflowCategory.delete({ where: { id } });
    return { success: true };
  }

  async getVersions(tenantId: string, definitionId: string) {
    return prisma.workflowVersion.findMany({
      where: { tenantId, definitionId },
      orderBy: { version: "desc" },
    });
  }

  async createVersion(
    tenantId: string,
    definitionId: string,
    changeLog: string | undefined,
    userId: string,
  ) {
    const def = await prisma.workflowDefinition.findFirst({
      where: { id: definitionId, tenantId },
    });
    if (!def) throw new NotFoundException("Definition not found");
    const lastVer = await prisma.workflowVersion.findFirst({
      where: { tenantId, definitionId },
      orderBy: { version: "desc" },
    });
    const version = (lastVer?.version || 0) + 1;
    return prisma.workflowVersion.create({
      data: {
        tenantId,
        definitionId,
        version,
        nodes: def.nodes as any,
        edges: def.edges as any,
        settings: def.settings as any,
        changeLog,
        createdBy: userId,
      },
    });
  }

  async restoreVersion(tenantId: string, versionId: string) {
    const ver = await prisma.workflowVersion.findFirst({
      where: { id: versionId, tenantId },
    });
    if (!ver) throw new NotFoundException("Version not found");
    await prisma.workflowDefinition.update({
      where: { id: ver.definitionId },
      data: { nodes: ver.nodes as any, edges: ver.edges as any },
    });
    return prisma.workflowDefinition.findUnique({
      where: { id: ver.definitionId },
    });
  }

  async deleteVersion(tenantId: string, id: string) {
    const ver = await prisma.workflowVersion.findFirst({
      where: { id, tenantId },
    });
    if (!ver) throw new NotFoundException("Version not found");
    await prisma.workflowVersion.delete({ where: { id } });
    return { success: true };
  }

  async getConditions(tenantId: string, definitionId: string) {
    return prisma.workflowCondition.findMany({
      where: { tenantId, definitionId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createCondition(tenantId: string, dto: any, userId: string) {
    await this.ensureDefinition(tenantId, dto.definitionId);
    return prisma.workflowCondition.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateCondition(tenantId: string, id: string, dto: any) {
    const cond = await prisma.workflowCondition.findFirst({
      where: { id, tenantId },
    });
    if (!cond) throw new NotFoundException("Condition not found");
    return prisma.workflowCondition.update({ where: { id }, data: dto });
  }

  async deleteCondition(tenantId: string, id: string) {
    const cond = await prisma.workflowCondition.findFirst({
      where: { id, tenantId },
    });
    if (!cond) throw new NotFoundException("Condition not found");
    await prisma.workflowCondition.delete({ where: { id } });
    return { success: true };
  }

  async getLoops(tenantId: string, definitionId: string) {
    return prisma.workflowLoop.findMany({
      where: { tenantId, definitionId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createLoop(tenantId: string, dto: any, userId: string) {
    await this.ensureDefinition(tenantId, dto.definitionId);
    return prisma.workflowLoop.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateLoop(tenantId: string, id: string, dto: any) {
    const loop = await prisma.workflowLoop.findFirst({
      where: { id, tenantId },
    });
    if (!loop) throw new NotFoundException("Loop not found");
    return prisma.workflowLoop.update({ where: { id }, data: dto });
  }

  async deleteLoop(tenantId: string, id: string) {
    const loop = await prisma.workflowLoop.findFirst({
      where: { id, tenantId },
    });
    if (!loop) throw new NotFoundException("Loop not found");
    await prisma.workflowLoop.delete({ where: { id } });
    return { success: true };
  }

  async getSubprocesses(tenantId: string, parentDefinitionId: string) {
    return prisma.workflowSubprocess.findMany({
      where: { tenantId, parentDefinitionId },
      include: { child: { select: { id: true, name: true } } },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createSubprocess(tenantId: string, dto: any, userId: string) {
    await this.ensureDefinition(tenantId, dto.parentDefinitionId);
    await this.ensureDefinition(tenantId, dto.childDefinitionId);
    return prisma.workflowSubprocess.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async deleteSubprocess(tenantId: string, id: string) {
    const sub = await prisma.workflowSubprocess.findFirst({
      where: { id, tenantId },
    });
    if (!sub) throw new NotFoundException("Subprocess not found");
    await prisma.workflowSubprocess.delete({ where: { id } });
    return { success: true };
  }

  async getErrorHandlers(tenantId: string, definitionId: string) {
    return prisma.workflowErrorHandler.findMany({
      where: { tenantId, definitionId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createErrorHandler(tenantId: string, dto: any, userId: string) {
    await this.ensureDefinition(tenantId, dto.definitionId);
    return prisma.workflowErrorHandler.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateErrorHandler(tenantId: string, id: string, dto: any) {
    const handler = await prisma.workflowErrorHandler.findFirst({
      where: { id, tenantId },
    });
    if (!handler) throw new NotFoundException("Error handler not found");
    return prisma.workflowErrorHandler.update({ where: { id }, data: dto });
  }

  async deleteErrorHandler(tenantId: string, id: string) {
    const handler = await prisma.workflowErrorHandler.findFirst({
      where: { id, tenantId },
    });
    if (!handler) throw new NotFoundException("Error handler not found");
    await prisma.workflowErrorHandler.delete({ where: { id } });
    return { success: true };
  }

  async getNotifications(tenantId: string, definitionId: string) {
    return prisma.workflowNotification.findMany({
      where: { tenantId, definitionId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createNotification(tenantId: string, dto: any, userId: string) {
    await this.ensureDefinition(tenantId, dto.definitionId);
    return prisma.workflowNotification.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateNotification(tenantId: string, id: string, dto: any) {
    const notif = await prisma.workflowNotification.findFirst({
      where: { id, tenantId },
    });
    if (!notif) throw new NotFoundException("Notification not found");
    return prisma.workflowNotification.update({ where: { id }, data: dto });
  }

  async deleteNotification(tenantId: string, id: string) {
    const notif = await prisma.workflowNotification.findFirst({
      where: { id, tenantId },
    });
    if (!notif) throw new NotFoundException("Notification not found");
    await prisma.workflowNotification.delete({ where: { id } });
    return { success: true };
  }

  async getWebhooks(tenantId: string, definitionId: string) {
    return prisma.workflowWebhook.findMany({
      where: { tenantId, definitionId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createWebhook(tenantId: string, dto: any, userId: string) {
    await this.ensureDefinition(tenantId, dto.definitionId);
    return prisma.workflowWebhook.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateWebhook(tenantId: string, id: string, dto: any) {
    const wh = await prisma.workflowWebhook.findFirst({
      where: { id, tenantId },
    });
    if (!wh) throw new NotFoundException("Webhook not found");
    return prisma.workflowWebhook.update({ where: { id }, data: dto });
  }

  async deleteWebhook(tenantId: string, id: string) {
    const wh = await prisma.workflowWebhook.findFirst({
      where: { id, tenantId },
    });
    if (!wh) throw new NotFoundException("Webhook not found");
    await prisma.workflowWebhook.delete({ where: { id } });
    return { success: true };
  }

  async getMetrics(tenantId: string, definitionId?: string) {
    const where: Prisma.WorkflowMetricWhereInput = { tenantId };
    if (definitionId) where.definitionId = definitionId;
    return prisma.workflowMetric.findMany({ where, orderBy: { date: "desc" } });
  }

  async getDashboard(tenantId: string) {
    const [
      totalDefs,
      activeDefs,
      totalExecs,
      pendingTasks,
      totalConditions,
      totalLoops,
    ] = await Promise.all([
      prisma.workflowDefinition.count({ where: { tenantId } }),
      prisma.workflowDefinition.count({
        where: { tenantId, status: "ACTIVE" },
      }),
      prisma.workflowExecution.count({ where: { tenantId } }),
      prisma.workflowTask.count({ where: { tenantId, status: "PENDING" } }),
      prisma.workflowCondition.count({ where: { tenantId } }),
      prisma.workflowLoop.count({ where: { tenantId } }),
    ]);
    return {
      totalDefinitions: totalDefs,
      activeDefinitions: activeDefs,
      totalExecutions: totalExecs,
      pendingTasks,
      totalConditions,
      totalLoops,
    };
  }

  async getTags(tenantId: string) {
    return prisma.workflowTag.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createTag(tenantId: string, dto: any, userId: string) {
    return prisma.workflowTag.create({
      data: { tenantId, ...dto, createdBy: userId },
    });
  }

  async updateTag(tenantId: string, id: string, dto: any) {
    const tag = await prisma.workflowTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException("Tag not found");
    return prisma.workflowTag.update({ where: { id }, data: dto });
  }

  async deleteTag(tenantId: string, id: string) {
    const tag = await prisma.workflowTag.findFirst({ where: { id, tenantId } });
    if (!tag) throw new NotFoundException("Tag not found");
    await prisma.workflowTagAssignment.deleteMany({ where: { tagId: id } });
    await prisma.workflowTag.delete({ where: { id } });
    return { success: true };
  }

  async assignTags(tenantId: string, definitionId: string, tagIds: string[]) {
    await this.ensureDefinition(tenantId, definitionId);
    await prisma.workflowTagAssignment.deleteMany({
      where: { tenantId, definitionId },
    });
    for (const tagId of tagIds) {
      await prisma.workflowTagAssignment.create({
        data: { tenantId, tagId, definitionId },
      });
    }
    return prisma.workflowTag.findMany({
      where: { id: { in: tagIds }, tenantId },
    });
  }

  async getDefinitionTags(tenantId: string, definitionId: string) {
    const assignments = await prisma.workflowTagAssignment.findMany({
      where: { tenantId, definitionId },
      include: { tag: true },
    });
    return assignments.map((a) => a.tag);
  }

  async exportWorkflow(tenantId: string, definitionId: string) {
    const def = await prisma.workflowDefinition.findFirst({
      where: { id: definitionId, tenantId },
    });
    if (!def) throw new NotFoundException("Definition not found");
    return {
      name: def.name,
      slug: def.slug,
      description: def.description,
      category: def.category,
      trigger: def.trigger,
      nodes: def.nodes,
      edges: def.edges,
      settings: def.settings,
    };
  }

  async importWorkflow(tenantId: string, dto: any) {
    const existing = await prisma.workflowDefinition.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing)
      throw new BadRequestException(`Slug "${dto.slug}" already exists`);
    return prisma.workflowDefinition.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        nodes: dto.data.nodes || [],
        edges: dto.data.edges || [],
        settings: (dto.data.settings || {}) as any,
      },
    });
  }

  async testWorkflow(tenantId: string, definitionId: string, testInput: any) {
    const def = await prisma.workflowDefinition.findFirst({
      where: { id: definitionId, tenantId },
    });
    if (!def) throw new NotFoundException("Definition not found");
    const nodes = (def.nodes || []) as any[];
    const startNodes = nodes.filter(
      (n: any) => n.type === "START" || n.type === "TRIGGER",
    );
    return {
      success: true,
      definitionName: def.name,
      totalNodes: nodes.length,
      startNodes: startNodes.length,
      testInput,
      simulated: true,
      message: "Workflow test completed successfully",
    };
  }

  async createDelegation(
    tenantId: string,
    originalAssigneeId: string,
    delegatedToId: string,
    reason: string | undefined,
    userId: string,
  ) {
    const tasks = await prisma.workflowTask.findMany({
      where: { tenantId, assigneeId: originalAssigneeId, status: "PENDING" },
    });
    let updated = 0;
    for (const task of tasks) {
      await prisma.workflowTask.update({
        where: { id: task.id },
        data: { assigneeId: delegatedToId },
      });
      updated++;
    }
    return {
      delegatedTasks: updated,
      originalAssigneeId,
      delegatedToId,
      delegatedBy: userId,
      reason,
    };
  }

  async setPriority(tenantId: string, taskId: string, priority: string) {
    const task = await prisma.workflowTask.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) throw new NotFoundException("Task not found");
    return prisma.workflowTask.update({
      where: { id: taskId },
      data: { priority: priority as any },
    });
  }

  private async ensureDefinition(tenantId: string, definitionId: string) {
    const def = await prisma.workflowDefinition.findFirst({
      where: { id: definitionId, tenantId },
    });
    if (!def) throw new NotFoundException("Workflow definition not found");
    return def;
  }
}
