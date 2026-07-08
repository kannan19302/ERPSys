import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentTermsService } from '../services/payment-terms.service';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        private value: number;
        constructor(val: unknown) {
          this.value = Number(val);
        }
        toNumber() {
          return this.value;
        }
      },
    },
  };
});

vi.mock('@unerp/database', () => {
  const createMockPrismaCollection = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });

  return {
    prisma: {
      paymentTermTemplate: createMockPrismaCollection(),
    },
  };
});

describe('PaymentTermsService', () => {
  let service: PaymentTermsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentTermsService();
  });

  describe('getPaymentTerms', () => {
    it('should return a list of payment term templates', async () => {
      const mockTerms = [
        { id: '1', name: 'Net 30', dueDays: 30 },
        { id: '2', name: 'Net 60', dueDays: 60 },
      ];
      vi.mocked(prisma.paymentTermTemplate.findMany).mockResolvedValue(mockTerms as any);

      const result = await service.getPaymentTerms('tenant-1');

      expect(prisma.paymentTermTemplate.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { dueDays: 'asc' },
      });
      expect(result).toEqual(mockTerms);
    });
  });

  describe('getPaymentTermById', () => {
    it('should return a single template if found', async () => {
      const mockTerm = { id: '1', name: 'Net 30', dueDays: 30 };
      vi.mocked(prisma.paymentTermTemplate.findFirst).mockResolvedValue(mockTerm as any);

      const result = await service.getPaymentTermById('tenant-1', '1');

      expect(prisma.paymentTermTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: '1', tenantId: 'tenant-1' },
      });
      expect(result).toEqual(mockTerm);
    });

    it('should throw NotFoundException if template not found', async () => {
      vi.mocked(prisma.paymentTermTemplate.findFirst).mockResolvedValue(null);

      await expect(service.getPaymentTermById('tenant-1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPaymentTerm', () => {
    it('should create a template with valid parameters', async () => {
      const mockTerm = { id: '1', name: 'Net 30', dueDays: 30 };
      vi.mocked(prisma.paymentTermTemplate.create).mockResolvedValue(mockTerm as any);

      const dto = {
        name: 'Net 30',
        description: 'Due in 30 days',
        dueDays: 30,
        discountDays: 10,
        discountPct: 2.0,
      };

      const result = await service.createPaymentTerm('tenant-1', dto);

      expect(prisma.paymentTermTemplate.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          name: dto.name,
          description: dto.description,
          dueDays: dto.dueDays,
          discountDays: dto.discountDays,
          discountPct: expect.any(Object),
          isActive: true,
        },
      });
      expect(result).toEqual(mockTerm);
    });

    it('should throw BadRequestException if dueDays is negative', async () => {
      const dto = {
        name: 'Invalid',
        dueDays: -5,
      };

      await expect(service.createPaymentTerm('tenant-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePaymentTerm', () => {
    it('should update and return a template', async () => {
      const existingTerm = { id: '1', name: 'Net 30', dueDays: 30 };
      const updatedTerm = { id: '1', name: 'Net 45', dueDays: 45 };
      
      vi.mocked(prisma.paymentTermTemplate.findFirst).mockResolvedValue(existingTerm as any);
      vi.mocked(prisma.paymentTermTemplate.update).mockResolvedValue(updatedTerm as any);

      const result = await service.updatePaymentTerm('tenant-1', '1', {
        name: 'Net 45',
        dueDays: 45,
      });

      expect(prisma.paymentTermTemplate.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Net 45',
          dueDays: 45,
        },
      });
      expect(result).toEqual(updatedTerm);
    });

    it('should throw BadRequestException if updating dueDays to negative', async () => {
      const existingTerm = { id: '1', name: 'Net 30', dueDays: 30 };
      vi.mocked(prisma.paymentTermTemplate.findFirst).mockResolvedValue(existingTerm as any);

      await expect(
        service.updatePaymentTerm('tenant-1', '1', { dueDays: -10 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deletePaymentTerm', () => {
    it('should delete and return the template', async () => {
      const mockTerm = { id: '1', name: 'Net 30', dueDays: 30 };
      vi.mocked(prisma.paymentTermTemplate.findFirst).mockResolvedValue(mockTerm as any);
      vi.mocked(prisma.paymentTermTemplate.delete).mockResolvedValue(mockTerm as any);

      const result = await service.deletePaymentTerm('tenant-1', '1');

      expect(prisma.paymentTermTemplate.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockTerm);
    });
  });
});
