import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class PosService {
  async getTerminals(tenantId: string) {
    return prisma.pOSTerminal.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createTerminal(
    tenantId: string,
    orgId: string,
    dto: { name: string; code: string; warehouseId?: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.pOSTerminal.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`POS Terminal with code ${dto.code} already exists.`);

    return prisma.pOSTerminal.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        code: dto.code,
        warehouseId: dto.warehouseId || null,
        status: 'ACTIVE',
      },
    });
  }

  async getRegisters(tenantId: string) {
    return prisma.pOSRegister.findMany({
      where: { tenantId },
      include: { terminal: true },
      orderBy: { openedAt: 'desc' },
    });
  }

  async openRegister(
    tenantId: string,
    dto: { terminalId: string; startingCash: number },
    userId: string
  ) {
    // Check if terminal is already open
    const active = await prisma.pOSRegister.findFirst({
      where: { tenantId, terminalId: dto.terminalId, status: 'OPEN' },
    });
    if (active) throw new BadRequestException('This terminal already has an open register session.');

    return prisma.pOSRegister.create({
      data: {
        tenantId,
        terminalId: dto.terminalId,
        openedById: userId,
        startingCash: new Prisma.Decimal(dto.startingCash),
        status: 'OPEN',
      },
    });
  }

  async closeRegister(
    tenantId: string,
    id: string,
    dto: { endingCash: number; actualCash: number }
  ) {
    const reg = await prisma.pOSRegister.findFirst({ where: { id, tenantId } });
    if (!reg) throw new NotFoundException('Register session not found');
    if (reg.status === 'CLOSED') throw new BadRequestException('Register session is already closed');

    return prisma.pOSRegister.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        endingCash: new Prisma.Decimal(dto.endingCash),
        actualCash: new Prisma.Decimal(dto.actualCash),
      },
    });
  }

  async getShifts(tenantId: string, registerId: string) {
    return prisma.pOSShift.findMany({
      where: { tenantId, registerId },
      orderBy: { startTime: 'desc' },
    });
  }

  async startShift(tenantId: string, registerId: string, dto: { employeeId: string }) {
    const activeShift = await prisma.pOSShift.findFirst({
      where: { tenantId, registerId, status: 'OPEN' },
    });
    if (activeShift) throw new BadRequestException('There is already an active shift on this register.');

    return prisma.pOSShift.create({
      data: {
        tenantId,
        registerId,
        employeeId: dto.employeeId,
        status: 'OPEN',
      },
    });
  }

  async endShift(tenantId: string, shiftId: string) {
    const shift = await prisma.pOSShift.findFirst({ where: { id: shiftId, tenantId } });
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status === 'CLOSED') throw new BadRequestException('Shift is already closed');

    return prisma.pOSShift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        endTime: new Date(),
      },
    });
  }

  async getCashEntries(tenantId: string, registerId: string) {
    return prisma.cashEntry.findMany({
      where: { tenantId, registerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addCashEntry(
    tenantId: string,
    registerId: string,
    dto: { type: 'IN' | 'OUT'; amount: number; reason?: string },
    createdBy: string
  ) {
    const register = await prisma.pOSRegister.findFirst({
      where: { id: registerId, tenantId },
    });
    if (!register) throw new NotFoundException('Register session not found');

    return prisma.cashEntry.create({
      data: {
        tenantId,
        registerId,
        type: dto.type,
        amount: new Prisma.Decimal(dto.amount),
        reason: dto.reason || null,
        createdBy,
      },
    });
  }
}
