import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class PwaService {
  async getSyncQueue(tenantId: string) {
    return prisma.offlineSyncQueue.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async pushOfflineOperations(
    tenantId: string,
    clientId: string,
    operations: Array<{ operation: string; entityType: string; payload: any }>
  ) {
    const records = [];
    for (const op of operations) {
      const record = await prisma.offlineSyncQueue.create({
        data: {
          tenantId,
          clientId,
          operation: op.operation,
          entityType: op.entityType,
          payload: JSON.stringify(op.payload),
          status: 'PENDING',
        },
      });
      records.push(record);
    }
    return records;
  }

  async reconcileOperation(
    tenantId: string,
    id: string,
    status: 'RECONCILED' | 'CONFLICT',
    errorMessage?: string
  ) {
    const record = await prisma.offlineSyncQueue.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException('Sync operation not found');

    return prisma.offlineSyncQueue.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage || null,
        reconciledAt: new Date(),
      },
    });
  }
}
