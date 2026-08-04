import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class WorkflowService {
  // ─── DEFINITION CRUD ────────────────────────────────

  async getDefinitions(tenantId: string) {
    return prisma.workflowDefinition.findMany({
      where: { tenantId },
      include: {
        steps: { orderBy: { sortOrder: "asc" } },
        _count: { select: { executions: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async getDefinitionById(tenantId: string, id: string) {
    const def = await prisma.workflowDefinition.findFirst({
      where: { tenantId, id },
      include: {
        steps: { orderBy: { sortOrder: "asc" } },
        executions: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!def) throw new NotFoundException("Workflow definition not found");
    return def;
  }

  async createDefinition(
    tenantId: string,
    dto: {
      name: string;
      slug: string;
      description?: string;
      category?: string;
      trigger?: string;
      nodes?: any[];
      edges?: any[];
    },
  ) {
    const existing = await prisma.workflowDefinition.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing)
      throw new BadRequestException(
        `Workflow slug "${dto.slug}" already exists`,
      );
    return prisma.workflowDefinition.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        category: dto.category,
        trigger: dto.trigger || "MANUAL",
        nodes: (dto.nodes || []) as any,
        edges: (dto.edges || []) as any,
        settings: {} as any,
      },
    });
  }

  async updateDefinition(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      description?: string;
      category?: string;
      trigger?: string;
      nodes?: any[];
      edges?: any[];
    },
  ) {
    await this.getDefinitionById(tenantId, id);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.trigger !== undefined) data.trigger = dto.trigger;
    if (dto.nodes !== undefined) data.nodes = dto.nodes;
    if (dto.edges !== undefined) data.edges = dto.edges;
    return prisma.workflowDefinition.update({ where: { id }, data });
  }

  async deleteDefinition(tenantId: string, id: string) {
    await this.getDefinitionById(tenantId, id);
    await prisma.workflowDefinition.delete({ where: { id } });
    return { success: true };
  }

  async activateDefinition(tenantId: string, id: string) {
    await this.getDefinitionById(tenantId, id);
    return prisma.workflowDefinition.update({
      where: { id },
      data: { status: "ACTIVE", version: { increment: 1 } },
    });
  }

  async deactivateDefinition(tenantId: string, id: string) {
    await this.getDefinitionById(tenantId, id);
    return prisma.workflowDefinition.update({
      where: { id },
      data: { status: "DRAFT" },
    });
  }

  // ─── DEFINITION STEPS ───────────────────────────────

  async createStep(
    tenantId: string,
    dto: {
      definitionId: string;
      name: string;
      type?: string;
      config?: any;
      sortOrder?: number;
    },
  ) {
    await this.getDefinitionById(tenantId, dto.definitionId);
    return prisma.workflowDefinitionStep.create({
      data: {
        tenantId,
        definitionId: dto.definitionId,
        name: dto.name,
        type: dto.type || "TASK",
        config: dto.config || null,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async deleteStep(tenantId: string, id: string) {
    const step = await prisma.workflowDefinitionStep.findFirst({
      where: { id, tenantId },
    });
    if (!step) throw new NotFoundException("Step not found");
    await prisma.workflowDefinitionStep.delete({ where: { id } });
    return { success: true };
  }

  // ─── INSTANCE EXECUTION ─────────────────────────────

  async getInstances(tenantId: string, definitionId?: string) {
    const where: Prisma.WorkflowExecutionWhereInput = { tenantId };
    if (definitionId) where.definitionId = definitionId;
    return prisma.workflowExecution.findMany({
      where,
      include: { definition: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async executeDefinition(
    tenantId: string,
    dto: { definitionId: string; trigger?: string; input?: any },
  ) {
    const def = await this.getDefinitionById(tenantId, dto.definitionId);
    if (def.status !== "ACTIVE")
      throw new BadRequestException("Workflow definition is not active");
    const instance = await prisma.workflowExecution.create({
      data: {
        tenantId,
        definitionId: dto.definitionId,
        trigger: dto.trigger || "MANUAL",
        input: dto.input || null,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });
    const nodes = (def.nodes || []) as any[];
    const startNodes = nodes.filter(
      (n: any) => n.type === "START" || n.type === "TRIGGER",
    );
    for (const node of startNodes) {
      await this.createTaskForNode(tenantId, instance.id, node.id, dto.input);
    }
    return instance;
  }

  async cancelInstance(tenantId: string, id: string) {
    const instance = await prisma.workflowExecution.findFirst({
      where: { id, tenantId },
    });
    if (!instance) throw new NotFoundException("Workflow instance not found");
    return prisma.workflowExecution.update({
      where: { id },
      data: { status: "CANCELLED", completedAt: new Date() },
    });
  }

  // ─── TASK MANAGEMENT ────────────────────────────────

  async getTasks(tenantId: string, assigneeId?: string) {
    const where: Prisma.WorkflowTaskWhereInput = { tenantId };
    if (assigneeId) where.assigneeId = assigneeId;
    return prisma.workflowTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getTaskById(tenantId: string, id: string) {
    const task = await prisma.workflowTask.findFirst({
      where: { id, tenantId },
    });
    if (!task) throw new NotFoundException("Task not found");
    return task;
  }

  async completeTask(
    tenantId: string,
    id: string,
    dto: { status: "COMPLETED" | "SKIPPED" | "FAILED"; comments?: string },
    userId: string,
  ) {
    const task = await this.getTaskById(tenantId, id);
    if (task.status !== "PENDING" && task.status !== "IN_PROGRESS") {
      throw new BadRequestException("Task is not actionable");
    }
    const updated = await prisma.workflowTask.update({
      where: { id },
      data: {
        status: dto.status,
        completedAt: new Date(),
        completedBy: userId,
        comments: dto.comments || null,
      },
    });
    await this.logAudit(
      tenantId,
      task.instanceId,
      task.id,
      "TASK_COMPLETED",
      userId,
      { status: dto.status },
    );
    if (dto.status === "COMPLETED") {
      await this.advanceInstance(tenantId, task.instanceId, task.nodeId);
    }
    return updated;
  }

  async reassignTask(tenantId: string, id: string, assigneeId: string) {
    const task = await this.getTaskById(tenantId, id);
    return prisma.workflowTask.update({ where: { id }, data: { assigneeId } });
  }

  // ─── SLA & ESCALATION ───────────────────────────────

  async getSlaRules(tenantId: string) {
    return prisma.workflowSlaRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSlaRule(
    tenantId: string,
    dto: {
      definitionId: string;
      nodeId: string;
      slaLimitHours: number;
      severity?: string;
      notifyRoles?: string;
    },
  ) {
    await this.getDefinitionById(tenantId, dto.definitionId);
    return prisma.workflowSlaRule.create({
      data: {
        tenantId,
        definitionId: dto.definitionId,
        nodeId: dto.nodeId,
        slaLimitHours: dto.slaLimitHours,
        severity: dto.severity || "MEDIUM",
        notifyRoles: dto.notifyRoles || null,
      },
    });
  }

  async deleteSlaRule(tenantId: string, id: string) {
    const rule = await prisma.workflowSlaRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("SLA rule not found");
    await prisma.workflowSlaRule.delete({ where: { id } });
    return { success: true };
  }

  async getEscalations(tenantId: string) {
    return prisma.workflowEscalationRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createEscalation(
    tenantId: string,
    dto: {
      slaRuleId: string;
      escalateAfterMinutes: number;
      escalateToRole: string;
      escalateToUser?: string;
      notifyChannel?: string;
    },
  ) {
    return prisma.workflowEscalationRule.create({
      data: {
        tenantId,
        slaRuleId: dto.slaRuleId,
        escalateAfterMinutes: dto.escalateAfterMinutes,
        escalateToRole: dto.escalateToRole,
        escalateToUser: dto.escalateToUser || null,
        notifyChannel: dto.notifyChannel || "EMAIL",
      },
    });
  }

  async deleteEscalation(tenantId: string, id: string) {
    const rule = await prisma.workflowEscalationRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Escalation rule not found");
    await prisma.workflowEscalationRule.delete({ where: { id } });
    return { success: true };
  }

  async checkSlaBreaches(tenantId: string) {
    const pendingTasks = await prisma.workflowTask.findMany({
      where: { tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });
    const slaRules = await prisma.workflowSlaRule.findMany({
      where: { tenantId },
    });
    const now = new Date();
    const breaches: any[] = [];
    for (const task of pendingTasks) {
      const sla = slaRules.find((r) => r.nodeId === task.nodeId);
      if (sla && task.createdAt) {
        const limitMs = sla.slaLimitHours * 3600000;
        if (now.getTime() - task.createdAt.getTime() > limitMs) {
          breaches.push({ taskId: task.id, slaId: sla.id });
          await this.logAudit(
            tenantId,
            task.instanceId,
            task.id,
            "SLA_BREACHED",
            "system",
            { slaRuleId: sla.id, severity: sla.severity },
          );
          const escalations = await prisma.workflowEscalationRule.findMany({
            where: { slaRuleId: sla.id },
          });
          for (const esc of escalations) {
            await this.logAudit(
              tenantId,
              task.instanceId,
              task.id,
              "ESCALATED",
              "system",
              { escalationId: esc.id, escalateTo: esc.escalateToRole },
            );
          }
        }
      }
    }
    return breaches;
  }

  async getWorkflows(tenantId: string) {
    return prisma.workflow.findMany({
      where: { tenantId },
      include: { steps: true },
      orderBy: { name: "asc" },
    });
  }

  async createWorkflow(
    tenantId: string,
    dto: { name: string; triggerType: string; steps: any[] },
  ) {
    const existing = await prisma.workflow.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException(
        `Workflow named ${dto.name} already exists.`,
      );
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const flow = await tx.workflow.create({
        data: {
          tenantId,
          name: dto.name,
          triggerType: dto.triggerType,
          status: "ACTIVE",
        },
      });
      for (const step of dto.steps) {
        await tx.workflowStep.create({
          data: {
            tenantId,
            workflowId: flow.id,
            stepOrder: step.stepOrder,
            actionType: step.actionType,
            assigneeRole: step.assigneeRole,
            slaLimitHours: step.slaLimitHours || null,
            backupAssigneeRole: step.backupAssigneeRole || null,
          },
        });
      }
      return tx.workflow.findUnique({
        where: { id: flow.id },
        include: { steps: true },
      });
    });
  }

  async getApprovalChains(tenantId: string) {
    return prisma.approvalChain.findMany({
      where: { tenantId },
      include: { step: { include: { workflow: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async submitApprovalAction(
    tenantId: string,
    chainId: string,
    dto: { status: "APPROVED" | "REJECTED"; comments?: string },
    userId: string,
  ) {
    const chain = await prisma.approvalChain.findFirst({
      where: { id: chainId, tenantId },
      include: {
        step: {
          include: {
            workflow: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
          },
        },
      },
    });
    if (!chain) throw new NotFoundException("Approval step not found");
    if (chain.status !== "PENDING")
      throw new BadRequestException("This step has already been actioned.");
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.approvalChain.update({
        where: { id: chainId },
        data: {
          status: dto.status,
          actionBy: userId,
          actionAt: new Date(),
          comments: dto.comments || null,
        },
      });
      if (dto.status === "APPROVED") {
        const currentStepOrder = chain.step.stepOrder;
        const nextStep = chain.step.workflow.steps.find(
          (s) => s.stepOrder === currentStepOrder + 1,
        );
        if (nextStep) {
          await tx.approvalChain.create({
            data: {
              tenantId,
              entityType: chain.entityType,
              entityId: chain.entityId,
              stepId: nextStep.id,
              status: "PENDING",
            },
          });
        }
      }
      return updated;
    });
  }

  async simulateWorkflow(
    tenantId: string,
    triggerType: string,
    _entityType: string,
    _entityId: string,
  ) {
    const flow = await prisma.workflow.findFirst({
      where: { tenantId, triggerType, status: "ACTIVE" },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
    if (!flow) return { success: false, message: "No active workflow found" };
    return {
      success: true,
      workflowName: flow.name,
      stepsCount: flow.steps.length,
      sequence: flow.steps.map((s) => ({
        stepOrder: s.stepOrder,
        actionType: s.actionType,
        assigneeRole: s.assigneeRole,
        slaHours: s.slaLimitHours,
        backupRole: s.backupAssigneeRole,
      })),
    };
  }

  // ─── AUDIT LOG ──────────────────────────────────────

  async getAuditLogs(tenantId: string, instanceId?: string) {
    const where: Prisma.WorkflowAuditLogWhereInput = { tenantId };
    if (instanceId) where.instanceId = instanceId;
    return prisma.workflowAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  // ─── PRIVATE HELPERS ────────────────────────────────

  private async createTaskForNode(
    tenantId: string,
    instanceId: string,
    nodeId: string,
    input?: any,
  ) {
    return prisma.workflowTask.create({
      data: {
        tenantId,
        instanceId,
        nodeId,
        status: "PENDING",
        assigneeRole: null,
      },
    });
  }

  private async advanceInstance(
    tenantId: string,
    instanceId: string,
    completedNodeId: string,
  ) {
    const instance = await prisma.workflowExecution.findFirst({
      where: { id: instanceId, tenantId },
      include: { definition: true },
    });
    if (!instance) return;
    const edges = (instance.definition.edges || []) as any[];
    const nextEdges = edges.filter((e: any) => e.source === completedNodeId);
    const pendingTasks = await prisma.workflowTask.findMany({
      where: { instanceId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    });
    if (nextEdges.length === 0 && pendingTasks.length === 0) {
      await prisma.workflowExecution.update({
        where: { id: instanceId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          duration: Math.round(
            (Date.now() - (instance.startedAt?.getTime() || Date.now())) / 1000,
          ),
        },
      });
    }
    for (const edge of nextEdges) {
      await this.createTaskForNode(tenantId, instanceId, edge.target);
    }
  }

  private async logAudit(
    tenantId: string,
    instanceId: string | null,
    taskId: string | null,
    action: string,
    actorId: string,
    details?: any,
  ) {
    return prisma.workflowAuditLog.create({
      data: {
        tenantId,
        instanceId,
        taskId,
        action,
        actorId,
        details: details || null,
      },
    });
  }
}
