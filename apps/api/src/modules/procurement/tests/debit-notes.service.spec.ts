import { Test, TestingModule } from '@nestjs/testing';
import { DebitNotesService } from '../debit-notes.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('@unerp/database', () => ({
  prisma: {
    debitNote: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
    vendor: { findFirst: jest.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('DebitNotesService', () => {
  let service: DebitNotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [DebitNotesService] }).compile();
    service = module.get<DebitNotesService>(DebitNotesService);
    jest.clearAllMocks();
  });

  it('should list debit notes', async () => {
    (prisma.debitNote.findMany as jest.Mock).mockResolvedValue([{ id: '1', noteNumber: 'DN-0001', vendor: { name: 'Vendor A' } }]);
    (prisma.debitNote.count as jest.Mock).mockResolvedValue(1);
    const result = await service.list('tenant-1', {});
    expect(result.total).toBe(1);
  });

  it('should create a debit note', async () => {
    (prisma.vendor.findFirst as jest.Mock).mockResolvedValue({ id: 'vendor-1' });
    (prisma.debitNote.count as jest.Mock).mockResolvedValue(0);
    (prisma.debitNote.create as jest.Mock).mockResolvedValue({ id: 'new-dn', noteNumber: 'DN-0001' });

    const result = await service.create('tenant-1', 'org-1', { vendorId: 'vendor-1', amount: 500 }, 'user-1');
    expect(result.id).toBe('new-dn');
  });

  it('should update debit note status', async () => {
    (prisma.debitNote.findFirst as jest.Mock).mockResolvedValue({ id: '1', status: 'DRAFT' });
    (prisma.debitNote.update as jest.Mock).mockResolvedValue({ id: '1', status: 'ISSUED' });

    const result = await service.updateStatus('tenant-1', '1', 'ISSUED');
    expect(result.status).toBe('ISSUED');
  });

  it('should reject invalid debit note transitions', async () => {
    (prisma.debitNote.findFirst as jest.Mock).mockResolvedValue({ id: '1', status: 'SETTLED' });
    await expect(service.updateStatus('tenant-1', '1', 'DRAFT')).rejects.toThrow(BadRequestException);
  });

  it('should get stats', async () => {
    (prisma.debitNote.findMany as jest.Mock).mockResolvedValue([
      { status: 'DRAFT', amount: 100 },
      { status: 'ISSUED', amount: 200 },
      { status: 'SETTLED', amount: 300 },
    ]);
    const stats = await service.getStats('tenant-1');
    expect(stats.total).toBe(3);
    expect(stats.totalAmount).toBe(600);
  });
});
