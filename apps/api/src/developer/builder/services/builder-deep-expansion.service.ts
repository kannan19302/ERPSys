import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class BuilderDeepExpansionService {
  private get prisma() {
    return prisma as any;
  }

  // 1. Data Model Builder (Custom Objects & Fields)
  async createDataModel(tenantId: string, data: any) {
    return this.prisma.builderDataModel.create({
      data: {
        ...data,
        tenantId,
        dataFields: data.fields
          ? {
              createMany: {
                data: data.fields.map((f: any) => ({ ...f, tenantId })),
              },
            }
          : undefined,
      },
      include: { dataFields: true, dataRelationships: true, dataViews: true },
    });
  }

  async getDataModels(tenantId: string) {
    return this.prisma.builderDataModel.findMany({
      where: { tenantId },
      include: { dataFields: true, dataRelationships: true, dataViews: true },
    });
  }

  async addDataField(tenantId: string, modelId: string, data: any) {
    return this.prisma.builderDataField.create({
      data: { ...data, modelId, tenantId },
    });
  }

  // 2. Business Rule Engine
  async createBusinessRule(tenantId: string, data: any) {
    return this.prisma.businessRule.create({
      data: { ...data, tenantId },
      include: { ruleExecutions: { take: 10 } },
    });
  }

  async getBusinessRules(tenantId: string) {
    return this.prisma.businessRule.findMany({
      where: { tenantId },
      include: { ruleExecutions: { take: 10 } },
    });
  }

  async executeBusinessRule(
    tenantId: string,
    ruleId: string,
    entityId: string,
  ) {
    const startTime = Date.now();
    const rule = await this.prisma.businessRule.findFirst({
      where: { id: ruleId, tenantId },
    });
    if (!rule)
      throw new NotFoundException(`Business Rule #${ruleId} not found`);

    // Rule execution logic simulation
    const duration = (Date.now() - startTime) / 1000;
    const execution = await this.prisma.businessRuleExecution.create({
      data: {
        tenantId,
        ruleId,
        entityId,
        status: "SUCCESS",
        result: { evaluatedConditions: true, actionsTriggered: rule.actions },
        duration,
      },
    });

    await this.prisma.businessRule.update({
      where: { id: ruleId },
      data: { runCount: { increment: 1 }, lastRunAt: new Date() },
    });

    return execution;
  }

  // 3. Integration Builder & Connectors
  async createIntegrationConnector(tenantId: string, data: any) {
    return this.prisma.integrationConnector.create({
      data: { ...data, tenantId },
      include: { connectorIntegrations: true },
    });
  }

  async createIntegration(tenantId: string, connectorId: string, data: any) {
    return this.prisma.integration.create({
      data: { ...data, connectorId, tenantId },
    });
  }

  // 4. Document Template Builder
  async createDocumentTemplate(tenantId: string, data: any) {
    return this.prisma.builderDocumentTemplate.create({
      data: { ...data, tenantId },
    });
  }

  async renderDocument(tenantId: string, templateId: string, variables: any) {
    const template = await this.prisma.builderDocumentTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!template)
      throw new NotFoundException(`Document Template #${templateId} not found`);

    const render = await this.prisma.builderDocumentRender.create({
      data: {
        tenantId,
        templateId,
        variables,
        outputFormat: template.templateType || "PDF",
        status: "COMPLETED",
        fileUrl: `/renders/${templateId}-${Date.now()}.${(template.templateType || "pdf").toLowerCase()}`,
      },
    });

    await this.prisma.builderDocumentTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    return render;
  }

  // 5. Chatbot Builder
  async createChatbot(tenantId: string, data: any) {
    return this.prisma.chatbotDefinition.create({
      data: {
        ...data,
        tenantId,
        botIntents: data.intents
          ? {
              createMany: {
                data: data.intents.map((i: any) => ({ ...i, tenantId })),
              },
            }
          : undefined,
      },
      include: { botIntents: true },
    });
  }

  // 6. Report & Dashboard Builders
  async createReportDefinition(tenantId: string, data: any) {
    return this.prisma.reportDefinition.create({
      data: { ...data, tenantId },
    });
  }

  async createDashboardDefinition(tenantId: string, data: any) {
    return this.prisma.dashboardDefinition.create({
      data: {
        ...data,
        tenantId,
        dashboardWidgets: data.widgets
          ? {
              createMany: {
                data: data.widgets.map((w: any) => ({ ...w, tenantId })),
              },
            }
          : undefined,
      },
      include: { dashboardWidgets: true },
    });
  }

  // 7. Event & Trigger Builder
  async createEventDefinition(tenantId: string, data: any) {
    return this.prisma.eventDefinition.create({
      data: {
        ...data,
        tenantId,
        eventTriggers: data.triggers
          ? {
              createMany: {
                data: data.triggers.map((t: any) => ({ ...t, tenantId })),
              },
            }
          : undefined,
      },
      include: { eventTriggers: true },
    });
  }

  // 8. Custom API Builder
  async createBuilderApi(tenantId: string, data: any) {
    return this.prisma.builderApi.create({
      data: { ...data, tenantId },
    });
  }
}
