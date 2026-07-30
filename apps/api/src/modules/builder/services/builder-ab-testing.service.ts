// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class BuilderAbTestingService {
  async getABTests(
    tenantId: string,
    params: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.search) {
      where.name = { contains: params.search, mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
      prisma.abTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.abTest.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getABTestById(tenantId: string, id: string) {
    const test = await prisma.abTest.findFirst({ where: { id, tenantId } });
    if (!test) throw new NotFoundException("A/B test not found");
    return test;
  }

  async createABTest(tenantId: string, dto: any) {
    return prisma.abTest.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        type: dto.type || "A_B",
        pageId: dto.pageId || null,
        pagePath: dto.pagePath || null,
        goalType: dto.goalType || "CONVERSION",
        goalConfig: dto.goalConfig || {},
        trafficAlloc: dto.trafficAlloc ?? 50,
        minSampleSize: dto.minSampleSize || null,
        confidence: dto.confidence ?? 0.95,
      },
    });
  }

  async updateABTest(tenantId: string, id: string, dto: any) {
    const test = await prisma.abTest.findFirst({ where: { id, tenantId } });
    if (!test) throw new NotFoundException("A/B test not found");

    return prisma.abTest.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.goalType !== undefined && { goalType: dto.goalType }),
        ...(dto.goalConfig !== undefined && {
          goalConfig: dto.goalConfig as any,
        }),
        ...(dto.trafficAlloc !== undefined && {
          trafficAlloc: dto.trafficAlloc,
        }),
        ...(dto.minSampleSize !== undefined && {
          minSampleSize: dto.minSampleSize,
        }),
        ...(dto.confidence !== undefined && { confidence: dto.confidence }),
      },
    });
  }

  async deleteABTest(tenantId: string, id: string) {
    const test = await prisma.abTest.findFirst({ where: { id, tenantId } });
    if (!test) throw new NotFoundException("A/B test not found");
    return prisma.abTest.delete({ where: { id } });
  }

  async startABTest(tenantId: string, id: string) {
    const test = await prisma.abTest.findFirst({ where: { id, tenantId } });
    if (!test) throw new NotFoundException("A/B test not found");

    const variants = await prisma.abTestVariant.findMany({
      where: { tenantId, testId: id },
    });
    if (variants.length < 2)
      throw new BadRequestException(
        "A/B test must have at least 2 variants (control + variant)",
      );

    return prisma.abTest.update({
      where: { id },
      data: { status: "RUNNING", startedAt: new Date() },
    });
  }

  async getVariants(tenantId: string, testId: string) {
    return prisma.abTestVariant.findMany({
      where: { tenantId, testId },
      orderBy: { createdAt: "asc" },
    });
  }

  async addVariant(tenantId: string, testId: string, dto: any) {
    const test = await prisma.abTest.findFirst({
      where: { id: testId, tenantId },
    });
    if (!test) throw new NotFoundException("A/B test not found");

    const existing = await prisma.abTestVariant.findFirst({
      where: { tenantId, testId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException("A variant with this name already exists");

    return prisma.abTestVariant.create({
      data: {
        tenantId,
        testId,
        name: dto.name,
        type: dto.type || "VARIANT",
        changes: dto.changes || {},
        weight: dto.weight ?? 50,
      },
    });
  }

  async updateVariant(tenantId: string, variantId: string, dto: any) {
    const variant = await prisma.abTestVariant.findFirst({
      where: { id: variantId, tenantId },
    });
    if (!variant) throw new NotFoundException("Variant not found");

    return prisma.abTestVariant.update({
      where: { id: variantId },
      data: {
        ...(dto.changes !== undefined && { changes: dto.changes as any }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.views !== undefined && { views: dto.views }),
        ...(dto.conversions !== undefined && { conversions: dto.conversions }),
      },
    });
  }

  async deleteVariant(tenantId: string, variantId: string) {
    const variant = await prisma.abTestVariant.findFirst({
      where: { id: variantId, tenantId },
    });
    if (!variant) throw new NotFoundException("Variant not found");
    return prisma.abTestVariant.delete({ where: { id: variantId } });
  }

  async analyzeResults(tenantId: string, testId: string) {
    const test = await prisma.abTest.findFirst({
      where: { id: testId, tenantId },
    });
    if (!test) throw new NotFoundException("A/B test not found");

    const variants = await prisma.abTestVariant.findMany({
      where: { tenantId, testId },
    });
    const control = variants.find((v) => v.type === "CONTROL");
    const variantList = variants.filter((v) => v.type !== "CONTROL");

    const results = variants.map((v) => ({
      name: v.name,
      views: v.views,
      conversions: v.conversions,
      rate: v.views > 0 ? (v.conversions / v.views) * 100 : 0,
    }));

    let lift = 0;
    let significance = 0;
    const primaryVariant = variantList.length > 0 ? variantList[0] : null;
    if (control && primaryVariant) {
      const controlRate =
        control.views > 0 ? control.conversions / control.views : 0;
      const varRate =
        primaryVariant.views > 0
          ? primaryVariant.conversions / primaryVariant.views
          : 0;
      lift =
        controlRate > 0 ? ((varRate - controlRate) / controlRate) * 100 : 0;
      significance = this.calculateSignificance(control, primaryVariant);
    }

    const analysis = {
      results,
      lift,
      significance,
      variants: results.length,
      totalViews: variants.reduce((s, v) => s + v.views, 0),
    };

    await prisma.abTest.update({
      where: { id: testId },
      data: { results: analysis as any },
    });

    return analysis;
  }

  private calculateSignificance(control: any, variant: any): number {
    if (control.views === 0 || variant.views === 0) return 0;
    const p1 = control.conversions / control.views;
    const p2 = variant.conversions / variant.views;
    const se = Math.sqrt(
      (p1 * (1 - p1)) / control.views + (p2 * (1 - p2)) / variant.views,
    );
    if (se === 0) return 0;
    const z = Math.abs(p1 - p2) / se;
    return Math.min(0.9999, 1 - Math.exp(-0.717 * z - 0.416 * z * z));
  }

  async defineSegment(tenantId: string, dto: any) {
    const existing = await prisma.audienceSegment.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing)
      throw new BadRequestException("A segment with this name already exists");

    return prisma.audienceSegment.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        rules: dto.rules || [],
        memberCount: dto.memberCount || 0,
      },
    });
  }

  async getSegments(tenantId: string) {
    return prisma.audienceSegment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSegmentById(tenantId: string, id: string) {
    const seg = await prisma.audienceSegment.findFirst({
      where: { id, tenantId },
    });
    if (!seg) throw new NotFoundException("Segment not found");
    return seg;
  }

  async updateSegment(tenantId: string, id: string, dto: any) {
    const seg = await prisma.audienceSegment.findFirst({
      where: { id, tenantId },
    });
    if (!seg) throw new NotFoundException("Segment not found");

    return prisma.audienceSegment.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.rules !== undefined && { rules: dto.rules as any }),
      },
    });
  }

  async deleteSegment(tenantId: string, id: string) {
    const seg = await prisma.audienceSegment.findFirst({
      where: { id, tenantId },
    });
    if (!seg) throw new NotFoundException("Segment not found");
    return prisma.audienceSegment.delete({ where: { id } });
  }

  async getPersonalizationDashboard(tenantId: string) {
    const [
      totalTests,
      runningTests,
      totalVariants,
      totalSegments,
      totalPersonalizationRules,
    ] = await Promise.all([
      prisma.abTest.count({ where: { tenantId } }),
      prisma.abTest.count({ where: { tenantId, status: "RUNNING" } }),
      prisma.abTestVariant.count({ where: { tenantId } }),
      prisma.audienceSegment.count({ where: { tenantId } }),
      prisma.personalizationRule.count({ where: { tenantId } }),
    ]);

    return {
      totalTests,
      runningTests,
      totalVariants,
      totalSegments,
      totalPersonalizationRules,
    };
  }
}
