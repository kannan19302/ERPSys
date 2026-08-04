import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class ProjectsRiskRegisterService {
  async getRiskMatrix(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const risks = await prisma.ppmRiskRegister.findMany({
      where: { tenantId, projectId },
      orderBy: { riskScore: "desc" },
    });
    const matrix = this.buildProbabilityImpactMatrix(risks);
    const heatmap = this.buildHeatmapData(risks);
    return {
      projectId,
      matrix,
      heatmap,
      risks,
      totalRisks: risks.length,
      highRiskCount: risks.filter(
        (r) => r.severity === "HIGH" || r.severity === "CRITICAL",
      ).length,
      mediumRiskCount: risks.filter((r) => r.severity === "MEDIUM").length,
      lowRiskCount: risks.filter((r) => r.severity === "LOW").length,
    };
  }

  async getRiskById(tenantId: string, riskId: string) {
    const risk = await prisma.ppmRiskRegister.findFirst({
      where: { id: riskId, tenantId },
    });
    if (!risk) throw new NotFoundException("Risk not found");
    return risk;
  }

  async createRisk(
    tenantId: string,
    dto: {
      projectId: string;
      title: string;
      description?: string;
      category?: string;
      probability: number;
      impact: number;
      owner?: string;
      mitigationPlan?: string;
      contingencyPlan?: string;
    },
  ) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const riskScore = dto.probability * dto.impact * 100;
    const severity = this.calculateSeverity(dto.probability, dto.impact);
    return prisma.ppmRiskRegister.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description || null,
        category: dto.category || null,
        probability: dto.probability,
        impact: dto.impact,
        riskScore,
        severity,
        owner: dto.owner || null,
        mitigationPlan: dto.mitigationPlan || null,
        contingencyPlan: dto.contingencyPlan || null,
      },
    });
  }

  async assessRisk(
    tenantId: string,
    riskId: string,
    dto: {
      probability?: number;
      impact?: number;
      mitigationPlan?: string;
      contingencyPlan?: string;
      owner?: string;
      status?: string;
      residualRisk?: number;
    },
  ) {
    const risk = await prisma.ppmRiskRegister.findFirst({
      where: { id: riskId, tenantId },
    });
    if (!risk) throw new NotFoundException("Risk not found");
    const probability = dto.probability ?? risk.probability ?? 0.5;
    const impact = dto.impact ?? risk.impact ?? 0.5;
    const riskScore = probability * impact * 100;
    const severity = this.calculateSeverity(probability, impact);
    return prisma.ppmRiskRegister.update({
      where: { id: riskId },
      data: {
        probability: dto.probability ?? undefined,
        impact: dto.impact ?? undefined,
        riskScore,
        severity,
        mitigationPlan:
          dto.mitigationPlan !== undefined ? dto.mitigationPlan : undefined,
        contingencyPlan:
          dto.contingencyPlan !== undefined ? dto.contingencyPlan : undefined,
        owner: dto.owner !== undefined ? dto.owner : undefined,
        status: dto.status ?? undefined,
        residualRisk: dto.residualRisk ?? undefined,
      },
    });
  }

  async getRiskImpactMatrix(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const risks = await prisma.ppmRiskRegister.findMany({
      where: { tenantId, projectId },
    });
    const matrix_5x5: {
      probability: number;
      impact: number;
      count: number;
      riskIds: string[];
    }[][] = Array.from({ length: 6 }, () => []);
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        const matchingRisks = risks.filter((r) => {
          const probBucket = Math.ceil((r.probability || 0.5) * 5);
          const impBucket = Math.ceil((r.impact || 0.5) * 5);
          return probBucket === p && impBucket === i;
        });
        if (!matrix_5x5[p]) matrix_5x5[p] = [];
        matrix_5x5[p]![i] = {
          probability: p / 5,
          impact: i / 5,
          count: matchingRisks.length,
          riskIds: matchingRisks.map((r) => r.id),
        };
      }
    }
    return {
      projectId,
      matrix: matrix_5x5,
      totalRisks: risks.length,
      highRiskCount: risks.filter(
        (r) => r.severity === "HIGH" || r.severity === "CRITICAL",
      ).length,
      mediumRiskCount: risks.filter((r) => r.severity === "MEDIUM").length,
      lowRiskCount: risks.filter((r) => r.severity === "LOW").length,
    };
  }

  async getRiskDashboard(tenantId: string, projectId?: string) {
    const where: any = { tenantId };
    if (projectId) where.projectId = projectId;
    const risks = await prisma.ppmRiskRegister.findMany({
      where,
      orderBy: { riskScore: "desc" },
    });
    return {
      totalRisks: risks.length,
      bySeverity: {
        critical: risks.filter((r) => r.severity === "CRITICAL").length,
        high: risks.filter((r) => r.severity === "HIGH").length,
        medium: risks.filter((r) => r.severity === "MEDIUM").length,
        low: risks.filter((r) => r.severity === "LOW").length,
      },
      byStatus: {
        identified: risks.filter((r) => r.status === "IDENTIFIED").length,
        assessed: risks.filter((r) => r.status === "ASSESSED").length,
        mitigated: risks.filter((r) => r.status === "MITIGATED").length,
        closed: risks.filter((r) => r.status === "CLOSED").length,
      },
      averageRiskScore:
        risks.length > 0
          ? risks.reduce((s, r) => s + (r.riskScore || 0), 0) / risks.length
          : 0,
      openRisks: risks.filter((r) => r.status !== "CLOSED").length,
    };
  }

  private buildProbabilityImpactMatrix(risks: any[]) {
    const buckets = [0.2, 0.4, 0.6, 0.8, 1.0];
    const matrix: any[] = [];
    for (const p of buckets) {
      for (const i of buckets) {
        const inCell = risks.filter((r) => {
          const prob = r.probability || 0.5;
          const imp = r.impact || 0.5;
          const pIdx = buckets.indexOf(p);
          const iIdx = buckets.indexOf(i);
          const probStart =
            pIdx !== -1 && pIdx > 0 ? (buckets[pIdx - 1] ?? 0) : 0;
          const impStart =
            iIdx !== -1 && iIdx > 0 ? (buckets[iIdx - 1] ?? 0) : 0;
          return prob > probStart && prob <= p && imp > impStart && imp <= i;
        });
        if (inCell.length > 0) {
          matrix.push({
            probabilityBucket: p,
            impactBucket: i,
            label: `P=${p}, I=${i}`,
            count: inCell.length,
            severity: this.calculateSeverity(p, i),
            riskIds: inCell.map((r: any) => r.id),
          });
        }
      }
    }
    return matrix;
  }

  private buildHeatmapData(risks: any[]) {
    const categories = [
      ...new Set(risks.map((r) => r.category || "UNCATEGORIZED")),
    ];
    return categories.map((cat) => {
      const catRisks = risks.filter(
        (r) => (r.category || "UNCATEGORIZED") === cat,
      );
      return {
        category: cat,
        count: catRisks.length,
        avgScore:
          catRisks.reduce((s: number, r: any) => s + (r.riskScore || 0), 0) /
          catRisks.length,
        severities: {
          critical: catRisks.filter((r) => r.severity === "CRITICAL").length,
          high: catRisks.filter((r) => r.severity === "HIGH").length,
          medium: catRisks.filter((r) => r.severity === "MEDIUM").length,
          low: catRisks.filter((r) => r.severity === "LOW").length,
        },
      };
    });
  }

  private calculateSeverity(probability: number, impact: number): string {
    const score = probability * impact;
    if (score >= 0.64) return "CRITICAL";
    if (score >= 0.36) return "HIGH";
    if (score >= 0.16) return "MEDIUM";
    return "LOW";
  }
}
