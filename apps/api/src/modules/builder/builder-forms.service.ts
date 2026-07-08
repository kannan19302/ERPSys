import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import type {
  CreateBuilderFormInput,
  UpdateBuilderFormInput,
} from '@unerp/shared';

@Injectable()
export class BuilderFormsService {
  async getForms(tenantId: string, params: { page?: number; limit?: number; search?: string; module?: string } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.module && params.module !== 'All Modules') {
      where.module = { equals: params.module, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      prisma.builderForm.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.builderForm.count({ where }),
    ]);

    // Fetch schema registries to associate count
    const schemas = (await prisma.schemaRegistry.findMany({
      where: { tenantId },
      select: {
        id: true,
        slug: true,
        _count: {
          select: { customRecords: true }
        }
      }
    })) || [];
    const schemaMap = new Map(schemas.map(s => [s.slug, s._count.customRecords]));

    const formsWithSubmissions = data.map(form => {
      const submissions = schemaMap.get(form.slug) || 0;
      return {
        ...form,
        submissions
      };
    });

    return { data: formsWithSubmissions, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getFormStats(tenantId: string) {
    const [total, published, draft] = await Promise.all([
      prisma.builderForm.count({ where: { tenantId } }),
      prisma.builderForm.count({ where: { tenantId, status: { in: ['PUBLISHED', 'Published'] } } }),
      prisma.builderForm.count({ where: { tenantId, status: { in: ['DRAFT', 'Draft'] } } }),
    ]);

    const schemas = (await prisma.schemaRegistry.findMany({
      where: { tenantId },
      select: {
        id: true,
        slug: true,
        _count: {
          select: { customRecords: true }
        }
      }
    })) || [];

    const builderFormSlugs = (await prisma.builderForm.findMany({
      where: { tenantId },
      select: { slug: true }
    })) || [];
    const slugSet = new Set(builderFormSlugs.map(f => f.slug));

    let totalSubmissions = 0;
    for (const schema of schemas) {
      if (slugSet.has(schema.slug)) {
        totalSubmissions += schema._count.customRecords;
      }
    }

    return {
      total,
      published,
      draft,
      totalSubmissions,
    };
  }

  async getFormById(tenantId: string, id: string) {
    const form = await prisma.builderForm.findFirst({
      where: { id, tenantId },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async createForm(
    tenantId: string,
    dto: CreateBuilderFormInput
  ) {
    const existing = await prisma.builderForm.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing) throw new BadRequestException('A form with this slug already exists');

    return prisma.builderForm.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        icon: dto.icon || null,
        module: dto.module || 'Sales',
        fields: (dto.fields || []) as any,
        settings: (dto.settings || {}) as any,
      },
    });
  }

  async updateForm(tenantId: string, id: string, dto: UpdateBuilderFormInput) {
    const form = await prisma.builderForm.findFirst({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Form not found');

    return prisma.builderForm.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.module !== undefined && { module: dto.module }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.fields !== undefined && { fields: dto.fields as any }),
        ...(dto.settings !== undefined && { settings: dto.settings as any }),
      },
    });
  }

  async deleteForm(tenantId: string, id: string) {
    const form = await prisma.builderForm.findFirst({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Form not found');
    return prisma.builderForm.delete({ where: { id } });
  }

  async publishBuilderForm(tenantId: string, id: string) {
    const form = await prisma.builderForm.findFirst({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Form not found');

    let schema = await prisma.schemaRegistry.findFirst({ where: { tenantId, slug: form.slug } });
    if (!schema) {
      schema = await prisma.schemaRegistry.create({
        data: {
          tenantId,
          module: form.module || 'custom',
          name: form.name,
          slug: form.slug,
          description: form.description,
          fields: form.fields || [],
          settings: form.settings || {},
          status: 'ACTIVE'
        }
      });
    } else {
      schema = await prisma.schemaRegistry.update({
        where: { id: schema.id },
        data: {
          module: form.module || 'custom',
          fields: form.fields || [],
          settings: form.settings || {},
        }
      });
    }

    let page = await prisma.pageRegistry.findFirst({ where: { tenantId, slug: form.slug } });
    if (!page) {
      page = await prisma.pageRegistry.create({
        data: {
          tenantId,
          schemaId: schema.id,
          module: form.module || 'custom',
          slug: form.slug,
          title: form.name,
          type: 'FORM',
          layout: { fields: form.fields || [], settings: form.settings || {} },
          status: 'PUBLISHED'
        }
      });
    } else {
      page = await prisma.pageRegistry.update({
        where: { id: page.id },
        data: {
          schemaId: schema.id,
          module: form.module || 'custom',
          layout: { fields: form.fields || [], settings: form.settings || {} },
          status: 'PUBLISHED'
        }
      });
    }

    await prisma.builderForm.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    return { form, schema, page };
  }
}
