import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CrmCustomersService } from '../crm-customers.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    customerTag: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    customerTagLink: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';

describe('CrmCustomersService — Customer Tags', () => {
  let service: CrmCustomersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCustomersService();
  });

  it('lists customer tags scoped to tenant', async () => {
    (prisma.customerTag.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 't1', tenantId: TENANT_A, name: 'VIP', color: '#3b82f6' },
    ]);
    const tags = await service.getCustomerTags(TENANT_A);
    expect(tags).toHaveLength(1);
    expect((prisma.customerTag.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      where: { tenantId: TENANT_A },
      orderBy: { name: 'asc' },
    });
  });

  it('creates a customer tag with tenant scoping and default color', async () => {
    (prisma.customerTag.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) => Promise.resolve({ id: 'tag-1', ...data }));
    const tag = await service.createCustomerTag(TENANT_A, { name: 'Enterprise', color: '#3b82f6' });
    expect(tag.tenantId).toBe(TENANT_A);
    expect(tag.name).toBe('Enterprise');
  });

  it('deletes a customer tag belonging to the tenant', async () => {
    (prisma.customerTag.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'tag-1', tenantId: TENANT_A });
    (prisma.customerTag.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'tag-1' });
    await service.deleteCustomerTag(TENANT_A, 'tag-1');
    expect(prisma.customerTag.delete).toHaveBeenCalledWith({ where: { id: 'tag-1' } });
  });

  it('throws NotFoundException deleting a tag from another tenant (tenant isolation)', async () => {
    (prisma.customerTag.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.deleteCustomerTag(TENANT_B, 'tag-1')).rejects.toThrow(NotFoundException);
    expect(prisma.customerTag.delete).not.toHaveBeenCalled();
  });

  it('assigns a tag to a customer within the same tenant', async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'cust-1', tenantId: TENANT_A });
    (prisma.customerTagLink.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'link-1', customerId: 'cust-1', tagId: 'tag-1' });
    const link = await service.assignCustomerTag(TENANT_A, 'cust-1', 'tag-1');
    expect(link.customerId).toBe('cust-1');
    expect(prisma.customer.findFirst).toHaveBeenCalledWith({ where: { id: 'cust-1', tenantId: TENANT_A } });
  });

  it('throws NotFoundException assigning a tag to a customer from another tenant (cross-tenant 404)', async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.assignCustomerTag(TENANT_B, 'cust-1', 'tag-1')).rejects.toThrow(NotFoundException);
    expect(prisma.customerTagLink.create).not.toHaveBeenCalled();
  });

  it('removes a tag assignment', async () => {
    (prisma.customerTagLink.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'link-1', customerId: 'cust-1', tagId: 'tag-1' });
    (prisma.customerTagLink.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'link-1' });
    await service.removeCustomerTag('cust-1', 'tag-1');
    expect(prisma.customerTagLink.delete).toHaveBeenCalledWith({ where: { id: 'link-1' } });
  });

  it('throws NotFoundException removing a non-existent tag assignment', async () => {
    (prisma.customerTagLink.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.removeCustomerTag('cust-1', 'tag-missing')).rejects.toThrow(NotFoundException);
  });
});
