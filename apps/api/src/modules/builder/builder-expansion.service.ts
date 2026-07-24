import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import type {
  CreateFormTemplateInput,
  UpdateFormTemplateInput,
  CreateFormFieldInput,
  CreateFormSubmissionInput,
  CreatePageTemplateInput,
  UpdatePageTemplateInput,
  CreateWorkflowDefinitionInput,
  UpdateWorkflowDefinitionInput,
  CreateWorkflowStepInput,
} from "@unerp/shared";

@Injectable()
export class BuilderExpansionService {
  // ── Form Templates ──

  async getFormTemplates(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.formTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.formTemplate.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFormTemplate(tenantId: string, id: string) {
    const template = await prisma.formTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) throw new NotFoundException("Form template not found");
    return template;
  }

  async createFormTemplate(tenantId: string, dto: CreateFormTemplateInput) {
    return prisma.formTemplate.create({ data: { tenantId, ...dto } as any });
  }

  async updateFormTemplate(
    tenantId: string,
    id: string,
    dto: UpdateFormTemplateInput,
  ) {
    const existing = await prisma.formTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Form template not found");
    return prisma.formTemplate.update({ where: { id }, data: dto as any });
  }

  async deleteFormTemplate(tenantId: string, id: string) {
    const existing = await prisma.formTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Form template not found");
    return prisma.formTemplate.delete({ where: { id } });
  }

  // ── Form Fields ──

  async createFormField(tenantId: string, dto: CreateFormFieldInput) {
    const template = await prisma.formTemplate.findFirst({
      where: { id: dto.templateId, tenantId },
    });
    if (!template) throw new NotFoundException("Form template not found");
    return prisma.formField.create({ data: { tenantId, ...dto } as any });
  }

  // ── Form Submissions ──

  async getFormSubmissions(
    tenantId: string,
    templateId: string,
    params: { page?: number; limit?: number } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where = { tenantId, templateId };
    const [data, total] = await Promise.all([
      prisma.formSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" },
      }),
      prisma.formSubmission.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async submitForm(
    tenantId: string,
    templateId: string,
    userId: string,
    dto: CreateFormSubmissionInput,
  ) {
    const template = await prisma.formTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!template) throw new NotFoundException("Form template not found");
    return prisma.formSubmission.create({
      data: {
        tenantId,
        templateId,
        data: dto.data as any,
        metadata: dto.metadata as any,
        submittedBy: userId,
      },
    });
  }

  // ── Form Analytics ──

  async getFormAnalytics(tenantId: string, templateId: string) {
    const template = await prisma.formTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!template) throw new NotFoundException("Form template not found");
    let analytic = await prisma.formAnalytic.findFirst({
      where: { tenantId, templateId },
    });
    if (!analytic) {
      const totalSubmissions = await prisma.formSubmission.count({
        where: { tenantId, templateId },
      });
      analytic = await prisma.formAnalytic.create({
        data: {
          tenantId,
          templateId,
          totalViews: 0,
          totalSubmissions,
          fieldStats: {},
          dailyStats: {},
        },
      });
    }
    return analytic;
  }

  // ── Page Templates ──

  async getPageTemplates(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.pageTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.pageTemplate.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPageTemplate(tenantId: string, id: string) {
    const template = await prisma.pageTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) throw new NotFoundException("Page template not found");
    return template;
  }

  async createPageTemplate(tenantId: string, dto: CreatePageTemplateInput) {
    return prisma.pageTemplate.create({ data: { tenantId, ...dto } as any });
  }

  async updatePageTemplate(
    tenantId: string,
    id: string,
    dto: UpdatePageTemplateInput,
  ) {
    const existing = await prisma.pageTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Page template not found");
    return prisma.pageTemplate.update({ where: { id }, data: dto as any });
  }

  async deletePageTemplate(tenantId: string, id: string) {
    const existing = await prisma.pageTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Page template not found");
    return prisma.pageTemplate.delete({ where: { id } });
  }

  // ── Workflow Definitions ──

  async getWorkflowDefinitions(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.workflowDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.workflowDefinition.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getWorkflowDefinition(tenantId: string, id: string) {
    const wf = await prisma.workflowDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!wf) throw new NotFoundException("Workflow definition not found");
    return wf;
  }

  async createWorkflowDefinition(
    tenantId: string,
    dto: CreateWorkflowDefinitionInput,
  ) {
    return prisma.workflowDefinition.create({
      data: { tenantId, ...dto } as any,
    });
  }

  async updateWorkflowDefinition(
    tenantId: string,
    id: string,
    dto: UpdateWorkflowDefinitionInput,
  ) {
    const existing = await prisma.workflowDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Workflow definition not found");
    return prisma.workflowDefinition.update({
      where: { id },
      data: dto as any,
    });
  }

  async deleteWorkflowDefinition(tenantId: string, id: string) {
    const existing = await prisma.workflowDefinition.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Workflow definition not found");
    return prisma.workflowDefinition.delete({ where: { id } });
  }

  // ── Workflow Steps ──

  async createWorkflowStep(tenantId: string, dto: CreateWorkflowStepInput) {
    const wf = await prisma.workflowDefinition.findFirst({
      where: { id: dto.definitionId, tenantId },
    });
    if (!wf) throw new NotFoundException("Workflow definition not found");
    return prisma.workflowStep.create({ data: { tenantId, ...dto } as any });
  }

  // ── Workflow Executions ──

  async getWorkflowExecutions(tenantId: string, definitionId: string) {
    const wf = await prisma.workflowDefinition.findFirst({
      where: { id: definitionId, tenantId },
    });
    if (!wf) throw new NotFoundException("Workflow definition not found");
    return prisma.workflowExecution.findMany({
      where: { tenantId, definitionId },
      orderBy: { createdAt: "desc" },
    });
  }
}
