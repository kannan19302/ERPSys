import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

const SUPPORTED_ENTITY_TYPES = [
  'Customer',
  'Vendor',
  'Product',
  'Invoice',
  'Employee',
  'Lead',
  'PurchaseOrder',
  'SalesOrder',
] as const;

@Injectable()
export class CustomFieldsService {
  async getDefinitions(tenantId: string, entityType?: string) {
    return prisma.customFieldDefinition.findMany({
      where: {
        tenantId,
        ...(entityType && { entityType }),
      },
      orderBy: [{ entityType: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async createDefinition(
    tenantId: string,
    data: {
      entityType: string;
      fieldName: string;
      label: string;
      fieldType: string;
      description?: string;
      isRequired?: boolean;
      defaultValue?: string;
      options?: any;
      validation?: any;
      sortOrder?: number;
      section?: string;
    },
    userId: string,
  ) {
    return prisma.customFieldDefinition.create({
      data: {
        tenantId,
        createdBy: userId,
        entityType: data.entityType,
        fieldName: data.fieldName,
        label: data.label,
        fieldType: data.fieldType,
        description: data.description,
        isRequired: data.isRequired ?? false,
        defaultValue: data.defaultValue,
        options: data.options ?? [],
        validation: data.validation ?? {},
        sortOrder: data.sortOrder ?? 0,
        section: data.section ?? 'Custom Fields',
      },
    });
  }

  async updateDefinition(
    tenantId: string,
    id: string,
    data: {
      label?: string;
      description?: string;
      isRequired?: boolean;
      defaultValue?: string;
      options?: any;
      validation?: any;
      sortOrder?: number;
      section?: string;
      isActive?: boolean;
    },
  ) {
    return prisma.customFieldDefinition.update({
      where: { id, tenantId },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.defaultValue !== undefined && { defaultValue: data.defaultValue }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.validation !== undefined && { validation: data.validation }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.section !== undefined && { section: data.section }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteDefinition(tenantId: string, id: string) {
    return prisma.customFieldDefinition.delete({
      where: { id, tenantId },
    });
  }

  async getValues(tenantId: string, entityType: string, entityId: string) {
    return prisma.customFieldValue.findMany({
      where: { tenantId, entityType, entityId },
      include: { field: true },
    });
  }

  async saveValues(
    tenantId: string,
    entityType: string,
    entityId: string,
    values: { fieldId: string; value: string }[],
  ) {
    const operations = values.map((v) =>
      prisma.customFieldValue.upsert({
        where: {
          fieldId_entityId: { fieldId: v.fieldId, entityId },
        },
        create: {
          tenantId,
          fieldId: v.fieldId,
          entityType,
          entityId,
          value: v.value,
        },
        update: {
          value: v.value,
        },
      }),
    );

    return prisma.$transaction(operations);
  }

  getEntityTypes() {
    return [...SUPPORTED_ENTITY_TYPES];
  }
}
