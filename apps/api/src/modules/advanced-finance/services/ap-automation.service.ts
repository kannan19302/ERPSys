import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class ApAutomationService {
  // ── Capture Batches ──────────────────────────────────────────────────────

  async listCaptureBatches(tenantId: string, status?: string) {
    return prisma.invoiceCaptureBatch.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCaptureBatch(tenantId: string, id: string) {
    const batch = await prisma.invoiceCaptureBatch.findFirst({
      where: { id, tenantId },
    });
    if (!batch) throw new NotFoundException("Capture batch not found");
    return batch;
  }

  async createCaptureBatch(
    tenantId: string,
    dto: {
      batchName: string;
      totalDocuments?: number;
    },
  ) {
    return prisma.invoiceCaptureBatch.create({
      data: {
        tenantId,
        batchName: dto.batchName,
        totalDocuments: dto.totalDocuments || 0,
        status: "UPLOADED",
      },
    });
  }

  async updateCaptureBatch(
    tenantId: string,
    id: string,
    dto: Partial<{
      batchName: string;
      totalDocuments: number;
      processedCount: number;
      failedCount: number;
      status: string;
    }>,
  ) {
    await this.getCaptureBatch(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.batchName !== undefined) data.batchName = dto.batchName;
    if (dto.totalDocuments !== undefined)
      data.totalDocuments = dto.totalDocuments;
    if (dto.processedCount !== undefined)
      data.processedCount = dto.processedCount;
    if (dto.failedCount !== undefined) data.failedCount = dto.failedCount;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === "PROCESSING") data.startedAt = new Date();
      if (dto.status === "COMPLETED" || dto.status === "FAILED")
        data.completedAt = new Date();
    }
    return prisma.invoiceCaptureBatch.update({ where: { id }, data });
  }

  async processCaptureBatch(tenantId: string, id: string) {
    const batch = await this.getCaptureBatch(tenantId, id);
    if (batch.status !== "UPLOADED")
      throw new BadRequestException("Batch is not in UPLOADED status");

    await prisma.invoiceCaptureBatch.update({
      where: { id },
      data: { status: "PROCESSING", startedAt: new Date() },
    });

    const results = await prisma.invoiceCaptureResult.findMany({
      where: { tenantId, batchId: id },
    });

    let processed = 0;
    let failed = 0;
    for (const result of results) {
      if (
        result.validationStatus === "VALIDATED" ||
        result.validationStatus === "MATCHED"
      ) {
        processed++;
      } else if (
        result.validationStatus === "ERROR" ||
        result.validationStatus === "REJECTED"
      ) {
        failed++;
      }
    }

    const newStatus =
      failed === 0
        ? "COMPLETED"
        : processed > 0
          ? "PARTIALLY_COMPLETED"
          : "FAILED";

    return prisma.invoiceCaptureBatch.update({
      where: { id },
      data: {
        processedCount: processed,
        failedCount: failed,
        status: newStatus,
        completedAt: new Date(),
      },
    });
  }

  async getCaptureBatchStatus(tenantId: string, id: string) {
    const batch = await this.getCaptureBatch(tenantId, id);
    const results = await prisma.invoiceCaptureResult.findMany({
      where: { tenantId, batchId: id },
    });

    const byStatus = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.validationStatus] = (acc[r.validationStatus] || 0) + 1;
      return acc;
    }, {});

    return {
      batchId: batch.id,
      batchName: batch.batchName,
      status: batch.status,
      totalDocuments: batch.totalDocuments,
      processedCount: batch.processedCount,
      failedCount: batch.failedCount,
      byValidationStatus: byStatus,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
    };
  }

  async deleteCaptureBatch(tenantId: string, id: string) {
    await this.getCaptureBatch(tenantId, id);
    return prisma.invoiceCaptureBatch.delete({ where: { id } });
  }

  // ── Capture Results ──────────────────────────────────────────────────────

  async listCaptureResults(tenantId: string, batchId: string) {
    return prisma.invoiceCaptureResult.findMany({
      where: { tenantId, batchId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCaptureResult(tenantId: string, id: string) {
    const result = await prisma.invoiceCaptureResult.findFirst({
      where: { id, tenantId },
    });
    if (!result) throw new NotFoundException("Capture result not found");
    return result;
  }

  async validateCaptureResult(
    tenantId: string,
    id: string,
    matchedInvoiceId?: string,
  ) {
    const result = await this.getCaptureResult(tenantId, id);
    if (result.validationStatus !== "PENDING")
      throw new BadRequestException("Result is not in PENDING status");

    return prisma.invoiceCaptureResult.update({
      where: { id },
      data: {
        validationStatus: matchedInvoiceId ? "MATCHED" : "VALIDATED",
        matchedInvoiceId: matchedInvoiceId || null,
        processedAt: new Date(),
      },
    });
  }

  async rejectCaptureResult(
    tenantId: string,
    id: string,
    errorMessage: string,
  ) {
    const result = await this.getCaptureResult(tenantId, id);
    if (result.validationStatus === "REJECTED")
      throw new BadRequestException("Result is already rejected");

    return prisma.invoiceCaptureResult.update({
      where: { id },
      data: {
        validationStatus: "REJECTED",
        errorMessage,
        processedAt: new Date(),
      },
    });
  }

  async correctCaptureResult(
    tenantId: string,
    id: string,
    correctedBy: string,
    dto: {
      extractedData?: object;
      poNumber?: string;
      vendorId?: string;
      invoiceNumber?: string;
      invoiceDate?: string;
      dueDate?: string;
      totalAmount?: number;
    },
  ) {
    const _result = await this.getCaptureResult(tenantId, id);
    const data: Record<string, unknown> = {
      correctedBy,
      validationStatus: "CORRECTED",
      processedAt: new Date(),
    };
    if (dto.extractedData !== undefined)
      data.extractedData = dto.extractedData as never;
    if (dto.poNumber !== undefined) data.poNumber = dto.poNumber;
    if (dto.vendorId !== undefined) data.vendorId = dto.vendorId;
    if (dto.invoiceNumber !== undefined) data.invoiceNumber = dto.invoiceNumber;
    if (dto.invoiceDate !== undefined)
      data.invoiceDate = new Date(dto.invoiceDate);
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.totalAmount !== undefined)
      data.totalAmount = new Prisma.Decimal(dto.totalAmount);
    return prisma.invoiceCaptureResult.update({ where: { id }, data });
  }

  // ── Match Rules ──────────────────────────────────────────────────────────

  async listMatchRules(tenantId: string, matchType?: string) {
    return prisma.invoiceMatchRule.findMany({
      where: {
        tenantId,
        ...(matchType ? { matchType } : {}),
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    });
  }

  async getMatchRule(tenantId: string, id: string) {
    const rule = await prisma.invoiceMatchRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Match rule not found");
    return rule;
  }

  async createMatchRule(
    tenantId: string,
    dto: {
      name: string;
      matchType: string;
      tolerancePercent?: number;
      toleranceAmount?: number;
      autoApprove?: boolean;
      autoReject?: boolean;
      priority?: number;
    },
  ) {
    return prisma.invoiceMatchRule.create({
      data: {
        tenantId,
        name: dto.name,
        matchType: dto.matchType,
        tolerancePercent:
          dto.tolerancePercent !== undefined
            ? new Prisma.Decimal(dto.tolerancePercent)
            : null,
        toleranceAmount:
          dto.toleranceAmount !== undefined
            ? new Prisma.Decimal(dto.toleranceAmount)
            : null,
        autoApprove: dto.autoApprove ?? false,
        autoReject: dto.autoReject ?? false,
        priority: dto.priority ?? 100,
      },
    });
  }

  async updateMatchRule(
    tenantId: string,
    id: string,
    dto: Partial<{
      name: string;
      matchType: string;
      tolerancePercent: number;
      toleranceAmount: number;
      autoApprove: boolean;
      autoReject: boolean;
      priority: number;
      isActive: boolean;
    }>,
  ) {
    await this.getMatchRule(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.matchType !== undefined) data.matchType = dto.matchType;
    if (dto.tolerancePercent !== undefined)
      data.tolerancePercent = new Prisma.Decimal(dto.tolerancePercent);
    if (dto.toleranceAmount !== undefined)
      data.toleranceAmount = new Prisma.Decimal(dto.toleranceAmount);
    if (dto.autoApprove !== undefined) data.autoApprove = dto.autoApprove;
    if (dto.autoReject !== undefined) data.autoReject = dto.autoReject;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.invoiceMatchRule.update({ where: { id }, data });
  }

  async setMatchRuleActive(tenantId: string, id: string, isActive: boolean) {
    await this.getMatchRule(tenantId, id);
    return prisma.invoiceMatchRule.update({
      where: { id },
      data: { isActive },
    });
  }

  async deleteMatchRule(tenantId: string, id: string) {
    await this.getMatchRule(tenantId, id);
    return prisma.invoiceMatchRule.delete({ where: { id } });
  }

  // ── Approval Routing Rules ───────────────────────────────────────────────

  async listApprovalRoutingRules(tenantId: string, triggerEvent?: string) {
    return prisma.approvalRoutingRule.findMany({
      where: {
        tenantId,
        ...(triggerEvent ? { triggerEvent } : {}),
      },
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    });
  }

  async getApprovalRoutingRule(tenantId: string, id: string) {
    const rule = await prisma.approvalRoutingRule.findFirst({
      where: { id, tenantId },
    });
    if (!rule) throw new NotFoundException("Approval routing rule not found");
    return rule;
  }

  async createApprovalRoutingRule(
    tenantId: string,
    dto: {
      name: string;
      triggerEvent: string;
      conditionField: string;
      conditionOperator: string;
      conditionValue: string;
      approverId?: string;
      approverRole?: string;
      chainId?: string;
      fallbackApprover?: string;
      priority?: number;
    },
  ) {
    return prisma.approvalRoutingRule.create({
      data: {
        tenantId,
        name: dto.name,
        triggerEvent: dto.triggerEvent,
        conditionField: dto.conditionField,
        conditionOperator: dto.conditionOperator,
        conditionValue: dto.conditionValue,
        approverId: dto.approverId || null,
        approverRole: dto.approverRole || null,
        chainId: dto.chainId || null,
        fallbackApprover: dto.fallbackApprover || null,
        priority: dto.priority ?? 100,
      },
    });
  }

  async updateApprovalRoutingRule(
    tenantId: string,
    id: string,
    dto: Partial<{
      name: string;
      triggerEvent: string;
      conditionField: string;
      conditionOperator: string;
      conditionValue: string;
      approverId: string;
      approverRole: string;
      chainId: string;
      fallbackApprover: string;
      priority: number;
      isActive: boolean;
    }>,
  ) {
    await this.getApprovalRoutingRule(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.triggerEvent !== undefined) data.triggerEvent = dto.triggerEvent;
    if (dto.conditionField !== undefined)
      data.conditionField = dto.conditionField;
    if (dto.conditionOperator !== undefined)
      data.conditionOperator = dto.conditionOperator;
    if (dto.conditionValue !== undefined)
      data.conditionValue = dto.conditionValue;
    if (dto.approverId !== undefined) data.approverId = dto.approverId;
    if (dto.approverRole !== undefined) data.approverRole = dto.approverRole;
    if (dto.chainId !== undefined) data.chainId = dto.chainId;
    if (dto.fallbackApprover !== undefined)
      data.fallbackApprover = dto.fallbackApprover;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.approvalRoutingRule.update({ where: { id }, data });
  }

  async testApprovalRoutingRule(
    tenantId: string,
    ruleId: string,
    testData: Record<string, unknown>,
  ) {
    const rule = await this.getApprovalRoutingRule(tenantId, ruleId);
    const fieldValue = testData[rule.conditionField];

    let matches = false;
    switch (rule.conditionOperator) {
      case "EQUALS":
        matches = String(fieldValue) === rule.conditionValue;
        break;
      case "NOT_EQUALS":
        matches = String(fieldValue) !== rule.conditionValue;
        break;
      case "GREATER_THAN":
        matches = Number(fieldValue) > Number(rule.conditionValue);
        break;
      case "LESS_THAN":
        matches = Number(fieldValue) < Number(rule.conditionValue);
        break;
      case "GREATER_THAN_OR_EQUAL":
        matches = Number(fieldValue) >= Number(rule.conditionValue);
        break;
      case "LESS_THAN_OR_EQUAL":
        matches = Number(fieldValue) <= Number(rule.conditionValue);
        break;
      case "CONTAINS":
        matches = String(fieldValue).includes(rule.conditionValue);
        break;
      case "IN":
        matches = (rule.conditionValue || "")
          .split(",")
          .map((v) => v.trim())
          .includes(String(fieldValue));
        break;
      default:
        matches = false;
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      conditionField: rule.conditionField,
      conditionOperator: rule.conditionOperator,
      conditionValue: rule.conditionValue,
      testData,
      matches,
      resolvedApprover: matches
        ? rule.approverId || rule.approverRole || null
        : null,
      fallbackApprover: rule.fallbackApprover || null,
    };
  }

  async deleteApprovalRoutingRule(tenantId: string, id: string) {
    await this.getApprovalRoutingRule(tenantId, id);
    return prisma.approvalRoutingRule.delete({ where: { id } });
  }

  // ── Payment Rail Optimization ────────────────────────────────────────────

  async listPaymentRailOptimizations(tenantId: string, status?: string) {
    return prisma.paymentRailOptimization.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPaymentRailOptimization(tenantId: string, id: string) {
    const opt = await prisma.paymentRailOptimization.findFirst({
      where: { id, tenantId },
    });
    if (!opt)
      throw new NotFoundException("Payment rail optimization not found");
    return opt;
  }

  async recommendPaymentRail(
    tenantId: string,
    dto: {
      batchId?: string;
      paymentId?: string;
      amount: number;
      currency?: string;
      preferredSpeed?: string;
    },
  ) {
    let recommendedRail: string;
    let estimatedCost: number;
    let estimatedSpeed: number;

    const amount = dto.amount;

    if (amount <= 1000) {
      recommendedRail = "ACH";
      estimatedCost = 0.5;
      estimatedSpeed = 2;
    } else if (amount <= 10000) {
      recommendedRail = "WIRE";
      estimatedCost = 15.0;
      estimatedSpeed = 1;
    } else if (dto.preferredSpeed === "FAST") {
      recommendedRail = "WIRE_EXPRESS";
      estimatedCost = 35.0;
      estimatedSpeed = 0;
    } else {
      recommendedRail = "ACH_BATCH";
      estimatedCost = 1.5;
      estimatedSpeed = 3;
    }

    return prisma.paymentRailOptimization.create({
      data: {
        tenantId,
        batchId: dto.batchId || null,
        paymentId: dto.paymentId || null,
        recommendedRail,
        estimatedCost: new Prisma.Decimal(estimatedCost),
        estimatedSpeed,
        actualCost: null,
        savingsAmount: null,
        currency: dto.currency || "USD",
        status: "RECOMMENDED",
      },
    });
  }

  async executePaymentRail(tenantId: string, id: string, actualCost?: number) {
    const opt = await this.getPaymentRailOptimization(tenantId, id);
    if (opt.status !== "RECOMMENDED")
      throw new BadRequestException(
        "Optimization is not in RECOMMENDED status",
      );

    const savingsAmount =
      actualCost !== undefined
        ? new Prisma.Decimal(Number(opt.estimatedCost) - actualCost)
        : new Prisma.Decimal(0);

    return prisma.paymentRailOptimization.update({
      where: { id },
      data: {
        status: "EXECUTED",
        actualCost:
          actualCost !== undefined ? new Prisma.Decimal(actualCost) : null,
        savingsAmount,
        executedAt: new Date(),
      },
    });
  }

  async deletePaymentRailOptimization(tenantId: string, id: string) {
    await this.getPaymentRailOptimization(tenantId, id);
    return prisma.paymentRailOptimization.delete({ where: { id } });
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  async getApAutomationDashboard(tenantId: string) {
    const [batches, results, rules, optimizations] = await Promise.all([
      prisma.invoiceCaptureBatch.findMany({ where: { tenantId } }),
      prisma.invoiceCaptureResult.findMany({ where: { tenantId } }),
      prisma.invoiceMatchRule.findMany({ where: { tenantId, isActive: true } }),
      prisma.paymentRailOptimization.findMany({ where: { tenantId } }),
    ]);

    const totalBatches = batches.length;
    const completedBatches = batches.filter(
      (b) => b.status === "COMPLETED",
    ).length;
    const failedBatches = batches.filter((b) => b.status === "FAILED").length;

    const byValidationStatus = results.reduce<Record<string, number>>(
      (acc, r) => {
        acc[r.validationStatus] = (acc[r.validationStatus] || 0) + 1;
        return acc;
      },
      {},
    );

    const executedOptimizations = optimizations.filter(
      (o) => o.status === "EXECUTED",
    );
    const totalSavings = executedOptimizations.reduce(
      (s, o) => s + Number(o.savingsAmount || 0),
      0,
    );
    const totalEstimatedCost = optimizations.reduce(
      (s, o) => s + Number(o.estimatedCost),
      0,
    );

    return {
      totalBatches,
      completedBatches,
      failedBatches,
      successRate:
        totalBatches > 0
          ? Number(((completedBatches / totalBatches) * 100).toFixed(1))
          : 0,
      totalCaptureResults: results.length,
      captureByStatus: byValidationStatus,
      activeMatchRules: rules.length,
      totalOptimizations: optimizations.length,
      executedOptimizations: executedOptimizations.length,
      totalEstimatedCost,
      totalActualSavings: totalSavings,
      totalDocumentsProcessed: batches.reduce(
        (s, b) => s + b.totalDocuments,
        0,
      ),
    };
  }
}
