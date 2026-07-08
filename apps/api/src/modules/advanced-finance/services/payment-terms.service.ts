import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentTermsService {
  async getPaymentTerms(tenantId: string) {
    return prisma.paymentTermTemplate.findMany({
      where: { tenantId },
      orderBy: { dueDays: 'asc' },
    });
  }

  async getPaymentTermById(tenantId: string, id: string) {
    const term = await prisma.paymentTermTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!term) throw new NotFoundException('Payment term template not found');
    return term;
  }

  async createPaymentTerm(
    tenantId: string,
    dto: {
      name: string;
      description?: string;
      dueDays: number;
      discountDays?: number;
      discountPct?: number;
    },
  ) {
    if (dto.dueDays < 0) {
      throw new BadRequestException('dueDays cannot be negative');
    }

    return prisma.paymentTermTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        dueDays: dto.dueDays,
        discountDays: dto.discountDays || 0,
        discountPct: dto.discountPct !== undefined ? new Prisma.Decimal(dto.discountPct) : new Prisma.Decimal(0),
        isActive: true,
      },
    });
  }

  async updatePaymentTerm(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      description?: string;
      dueDays?: number;
      discountDays?: number;
      discountPct?: number;
      isActive?: boolean;
    },
  ) {
    const term = await this.getPaymentTermById(tenantId, id);

    const updateData: Prisma.PaymentTermTemplateUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.dueDays !== undefined) {
      if (dto.dueDays < 0) throw new BadRequestException('dueDays cannot be negative');
      updateData.dueDays = dto.dueDays;
    }
    if (dto.discountDays !== undefined) updateData.discountDays = dto.discountDays;
    if (dto.discountPct !== undefined) updateData.discountPct = new Prisma.Decimal(dto.discountPct);
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return prisma.paymentTermTemplate.update({
      where: { id: term.id },
      data: updateData,
    });
  }

  async deletePaymentTerm(tenantId: string, id: string) {
    const term = await this.getPaymentTermById(tenantId, id);

    return prisma.paymentTermTemplate.delete({
      where: { id: term.id },
    });
  }
}
