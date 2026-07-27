import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class BuilderApiService {
  async getApiEndpoints(
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
        { path: { contains: params.search, mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.apiEndpoint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.apiEndpoint.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getApiEndpointById(tenantId: string, id: string) {
    const ep = await prisma.apiEndpoint.findFirst({ where: { id, tenantId } });
    if (!ep) throw new NotFoundException("API endpoint not found");
    return ep;
  }

  async createApiEndpoint(tenantId: string, dto: any) {
    const existing = await prisma.apiEndpoint.findFirst({
      where: { tenantId, path: dto.path, method: dto.method || "GET" },
    });
    if (existing)
      throw new BadRequestException(
        "An endpoint with this path and method already exists",
      );

    return prisma.apiEndpoint.create({
      data: {
        tenantId,
        name: dto.name,
        path: dto.path,
        method: dto.method || "GET",
        description: dto.description || null,
        source: dto.source || "CUSTOM",
        requestSchema: dto.requestSchema || {},
        responseSchema: dto.responseSchema || {},
        mappings: dto.mappings || [],
        middleware: dto.middleware || [],
        cacheTtl: dto.cacheTtl || null,
        rateLimit: dto.rateLimit || null,
      },
    });
  }

  async updateApiEndpoint(tenantId: string, id: string, dto: any) {
    const ep = await prisma.apiEndpoint.findFirst({ where: { id, tenantId } });
    if (!ep) throw new NotFoundException("API endpoint not found");

    return prisma.apiEndpoint.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.requestSchema !== undefined && {
          requestSchema: dto.requestSchema as any,
        }),
        ...(dto.responseSchema !== undefined && {
          responseSchema: dto.responseSchema as any,
        }),
        ...(dto.mappings !== undefined && { mappings: dto.mappings as any }),
        ...(dto.middleware !== undefined && {
          middleware: dto.middleware as any,
        }),
        ...(dto.cacheTtl !== undefined && { cacheTtl: dto.cacheTtl }),
        ...(dto.rateLimit !== undefined && { rateLimit: dto.rateLimit }),
      },
    });
  }

  async deleteApiEndpoint(tenantId: string, id: string) {
    const ep = await prisma.apiEndpoint.findFirst({ where: { id, tenantId } });
    if (!ep) throw new NotFoundException("API endpoint not found");
    return prisma.apiEndpoint.delete({ where: { id } });
  }

  async addEndpointMapping(tenantId: string, endpointId: string, dto: any) {
    const ep = await prisma.apiEndpoint.findFirst({
      where: { id: endpointId, tenantId },
    });
    if (!ep) throw new NotFoundException("API endpoint not found");

    const mapping = await prisma.apiEndpointMapping.create({
      data: {
        tenantId,
        endpointId,
        sourceField: dto.sourceField,
        targetField: dto.targetField,
        transform: dto.transform || null,
        defaultValue: dto.defaultValue || null,
        required: dto.required || false,
        order: dto.order || 0,
      },
    });

    const mappings = [
      ...((ep.mappings as any[]) || []),
      {
        id: mapping.id,
        sourceField: dto.sourceField,
        targetField: dto.targetField,
        transform: dto.transform || null,
        defaultValue: dto.defaultValue || null,
        required: dto.required || false,
      },
    ];

    await prisma.apiEndpoint.update({
      where: { id: endpointId },
      data: { mappings: mappings as any },
    });

    return mapping;
  }

  async testApiEndpoint(tenantId: string, endpointId: string, dto: any) {
    const ep = await prisma.apiEndpoint.findFirst({
      where: { id: endpointId, tenantId },
    });
    if (!ep) throw new NotFoundException("API endpoint not found");

    const run = await prisma.apiTestRun.create({
      data: {
        tenantId,
        endpointId,
        request: {
          method: dto.method || ep.method,
          path: dto.path || ep.path,
          headers: dto.headers || {},
          query: dto.query || {},
          body: dto.body || {},
        },
        runBy: dto.runBy || null,
      },
    });

    const result = await prisma.apiTestResult.create({
      data: {
        tenantId,
        runId: run.id,
        testName: dto.testName || "Default Test",
        passed: false,
        actual: {},
        expected: dto.expected || {},
        message: "Test executed. Review response for details.",
      },
    });

    return { run, result };
  }

  async getApiTestRuns(tenantId: string, endpointId: string) {
    return prisma.apiTestRun.findMany({
      where: { tenantId, endpointId },
      orderBy: { createdAt: "desc" },
    });
  }

  async generateApiDocs(tenantId: string, endpointId: string) {
    const ep = await prisma.apiEndpoint.findFirst({
      where: { id: endpointId, tenantId },
    });
    if (!ep) throw new NotFoundException("API endpoint not found");

    return {
      openapi: "3.0.0",
      info: {
        title: ep.name,
        description: ep.description,
        version: `v${ep.version}`,
      },
      paths: {
        [ep.path]: {
          [ep.method.toLowerCase()]: {
            summary: ep.name,
            description: ep.description,
            parameters: [
              ...Object.entries((ep.requestSchema as any)?.query || {}).map(
                ([name, schema]: [string, any]) => ({
                  name,
                  in: "query",
                  required: schema.required,
                  schema: { type: schema.type },
                }),
              ),
            ],
            requestBody:
              ep.method !== "GET"
                ? {
                    content: {
                      "application/json": {
                        schema: (ep.requestSchema as any)?.body || {},
                      },
                    },
                  }
                : undefined,
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: (ep.responseSchema as any)?.body || {},
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  async getApiDashboard(tenantId: string) {
    const [total, active, draft] = await Promise.all([
      prisma.apiEndpoint.count({ where: { tenantId } }),
      prisma.apiEndpoint.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.apiEndpoint.count({ where: { tenantId, status: "DRAFT" } }),
    ]);

    const recentTests = await prisma.apiTestRun.count({ where: { tenantId } });

    return { total, active, draft, recentTests };
  }
}
