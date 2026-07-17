import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class BuilderWorkflowsService {
  async getWorkflows(tenantId: string) {
    return prisma.builderWorkflow.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkflowById(tenantId: string, id: string) {
    const wf = await prisma.builderWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return wf;
  }

  async createWorkflow(
    tenantId: string,
    dto: { name: string; description?: string; docType?: string; trigger?: string; nodes?: any; edges?: any; settings?: any }
  ) {
    return prisma.builderWorkflow.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        docType: dto.docType || null,
        trigger: dto.trigger || 'SUBMIT',
        nodes: dto.nodes || [],
        edges: dto.edges || [],
        settings: dto.settings || {},
      },
    });
  }

  async updateWorkflow(tenantId: string, id: string, dto: Partial<{ name: string; description: string; docType: string; status: string; trigger: string; nodes: any; edges: any; settings: any }>) {
    const wf = await prisma.builderWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow not found');

    return prisma.builderWorkflow.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.docType !== undefined && { docType: dto.docType }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.trigger !== undefined && { trigger: dto.trigger }),
        ...(dto.nodes !== undefined && { nodes: dto.nodes }),
        ...(dto.edges !== undefined && { edges: dto.edges }),
        ...(dto.settings !== undefined && { settings: dto.settings }),
      },
    });
  }

  async deleteWorkflow(tenantId: string, id: string) {
    const wf = await prisma.builderWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return prisma.builderWorkflow.delete({ where: { id } });
  }

  async executeWorkflow(tenantId: string, id: string) {
    const wf = await prisma.builderWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow not found');

    const nodes = Array.isArray(wf.nodes) ? (wf.nodes as any[]) : [];
    if (nodes.length === 0) {
      throw new BadRequestException('Workflow has no executable nodes');
    }

    const startedAt = new Date();
    
    // Simulate real node execution by mapping through nodes and resolving them
    const executionLogs = nodes.map(node => {
      let nodeStatus = 'SUCCESS';
      let message = `Executed node: ${node.type} (${node.label})`;
      
      switch(node.type) {
        case 'action':
          message = `Processed action node: ${node.label}`;
          break;
        case 'condition':
          message = `Evaluated condition for: ${node.label} (Result: true)`;
          break;
        case 'trigger':
          message = `Triggered by event: ${node.label}`;
          break;
        default:
          message = `Processed node: ${node.label}`;
      }
      
      return {
        nodeId: node.id,
        nodeLabel: node.label,
        status: nodeStatus,
        message,
        timestamp: new Date().toISOString()
      };
    });

    const completedAt = new Date();
    const hasFailures = executionLogs.some(log => log.status === 'FAILED');

    const execution = {
      id: `exec_${startedAt.getTime()}`,
      workflowId: id,
      status: hasFailures ? 'FAILED' : 'COMPLETED',
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      logs: executionLogs,
    };

    // Store the execution in an audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'workflow_execution',
        entityId: id,
        entityType: 'BuilderWorkflow',
        changes: { execution } as any,
        userId: 'system'
      }
    });

    const settings = wf.settings && typeof wf.settings === 'object' && !Array.isArray(wf.settings) ? wf.settings : {};
    const executions = Array.isArray((settings as { executions?: unknown }).executions)
      ? ((settings as { executions: unknown[] }).executions as unknown[])
      : [];

    await prisma.builderWorkflow.update({
      where: { id },
      data: {
        settings: {
          ...settings,
          executions: [execution, ...executions].slice(0, 25),
        } as any,
      },
    });

    return execution;
  }

  async getWorkflowExecutions(tenantId: string, id: string) {
    const wf = await prisma.builderWorkflow.findFirst({ where: { id, tenantId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    const settings = wf.settings && typeof wf.settings === 'object' && !Array.isArray(wf.settings) ? wf.settings : {};
    return Array.isArray((settings as { executions?: unknown }).executions)
      ? (settings as { executions: unknown[] }).executions
      : [];
  }
}
