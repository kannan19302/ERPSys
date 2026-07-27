import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class BuilderBpmnService {
  async getBpmnProcesses(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { key: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.bpmnProcessDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.bpmnProcessDefinition.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBpmnProcessById(tenantId: string, id: string) {
    const proc = await prisma.bpmnProcessDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!proc) throw new NotFoundException("BPMN process not found");
    return proc;
  }

  async createBpmnProcess(tenantId: string, dto: any) {
    const existing = await prisma.bpmnProcessDefinition.findFirst({
      where: { tenantId, key: dto.key },
    });
    if (existing)
      throw new BadRequestException("A process with this key already exists");

    return prisma.bpmnProcessDefinition.create({
      data: {
        tenantId,
        name: dto.name,
        key: dto.key,
        description: dto.description || null,
        elements: dto.elements || [],
        flows: dto.flows || [],
        slaConfig: dto.slaConfig || {},
        settings: dto.settings || {},
      },
    });
  }

  async updateBpmnProcess(tenantId: string, id: string, dto: any) {
    const proc = await prisma.bpmnProcessDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!proc) throw new NotFoundException("BPMN process not found");

    return prisma.bpmnProcessDefinition.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.elements !== undefined && { elements: dto.elements as any }),
        ...(dto.flows !== undefined && { flows: dto.flows as any }),
        ...(dto.bpmnXml !== undefined && { bpmnXml: dto.bpmnXml }),
        ...(dto.slaConfig !== undefined && { slaConfig: dto.slaConfig as any }),
        ...(dto.settings !== undefined && { settings: dto.settings as any }),
      },
    });
  }

  async deleteBpmnProcess(tenantId: string, id: string) {
    const proc = await prisma.bpmnProcessDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!proc) throw new NotFoundException("BPMN process not found");
    return prisma.bpmnProcessDefinition.delete({ where: { id } });
  }

  async addGateway(tenantId: string, processId: string, dto: any) {
    const proc = await prisma.bpmnProcessDefinition.findFirst({
      where: { id: processId, tenantId },
    });
    if (!proc) throw new NotFoundException("BPMN process not found");

    const elements = [
      ...((proc.elements as any[]) || []),
      {
        id: dto.id || `gateway_${Date.now()}`,
        type: dto.type || "exclusiveGateway",
        label: dto.label || "Gateway",
        config: dto.config || {},
      },
    ];

    return prisma.bpmnProcessDefinition.update({
      where: { id: processId },
      data: { elements: elements as any },
    });
  }

  async addTimerEvent(tenantId: string, processId: string, dto: any) {
    const proc = await prisma.bpmnProcessDefinition.findFirst({
      where: { id: processId, tenantId },
    });
    if (!proc) throw new NotFoundException("BPMN process not found");

    await prisma.bpmnTimerDefinition.create({
      data: {
        tenantId,
        definitionId: processId,
        elementId: dto.elementId || `timer_${Date.now()}`,
        timerType: dto.timerType || "duration",
        timerValue: dto.timerValue || "PT1H",
        settings: dto.settings || {},
      },
    });

    const elements = [
      ...((proc.elements as any[]) || []),
      {
        id: dto.elementId || `timer_${Date.now()}`,
        type: "timerEvent",
        label: dto.label || "Timer",
        config: {
          timerType: dto.timerType || "duration",
          timerValue: dto.timerValue || "PT1H",
        },
      },
    ];

    return prisma.bpmnProcessDefinition.update({
      where: { id: processId },
      data: { elements: elements as any },
    });
  }

  async executeWorkflowInstance(tenantId: string, processId: string, dto: any) {
    const proc = await prisma.bpmnProcessDefinition.findFirst({
      where: { id: processId, tenantId },
    });
    if (!proc) throw new NotFoundException("BPMN process not found");

    const instance = await prisma.bpmnProcessInstance.create({
      data: {
        tenantId,
        definitionId: processId,
        variables: dto.variables || {},
        currentElements: dto.startElements || [],
        startedBy: dto.startedBy || null,
      },
    });

    const startElements =
      (proc.elements as any[])?.filter((e) => e.type === "startEvent") || [];
    for (const el of startElements) {
      await prisma.bpmnActivityInstance.create({
        data: {
          tenantId,
          instanceId: instance.id,
          elementId: el.id,
          elementType: el.type,
          label: el.label || "Start",
          assignedTo: dto.startedBy || null,
        },
      });
    }

    return instance;
  }

  async getBpmnInstances(tenantId: string, processId: string) {
    return prisma.bpmnProcessInstance.findMany({
      where: { tenantId, definitionId: processId },
      orderBy: { startedAt: "desc" },
      include: { definition: true },
    });
  }

  async getBpmnDashboard(tenantId: string) {
    const [totalProcesses, activeProcesses, totalInstances, runningInstances] =
      await Promise.all([
        prisma.bpmnProcessDefinition.count({ where: { tenantId } }),
        prisma.bpmnProcessDefinition.count({
          where: { tenantId, status: "ACTIVE" },
        }),
        prisma.bpmnProcessInstance.count({ where: { tenantId } }),
        prisma.bpmnProcessInstance.count({
          where: { tenantId, status: "RUNNING" },
        }),
      ]);

    const slaBreached = await prisma.bpmnProcessInstance.count({
      where: { tenantId, slaBreached: true },
    });

    return {
      totalProcesses,
      activeProcesses,
      totalInstances,
      runningInstances,
      slaBreached,
    };
  }

  async escalateProcess(tenantId: string, instanceId: string, dto: any) {
    const instance = await prisma.bpmnProcessInstance.findFirst({
      where: { id: instanceId, tenantId },
    });
    if (!instance) throw new NotFoundException("Process instance not found");

    const history = [
      ...((instance.history as any[]) || []),
      {
        elementId: "escalation",
        type: "escalation",
        timestamp: new Date().toISOString(),
        user: dto.escalatedBy || "system",
        outcome: dto.reason || "Escalated",
      },
    ];

    return prisma.bpmnProcessInstance.update({
      where: { id: instanceId },
      data: { status: "ESCALATED", history: history as any },
    });
  }
}
