import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class GlobalTradeService {
  async getHsCodes(tenantId: string, params?: { search?: string; page?: number; limit?: number }) {
    const where: any = { tenantId, isActive: true };
    if (params?.search) where.code = { contains: params.search };
    const data = await prisma.hsCode.findMany({ where, orderBy: { code: 'asc' }, skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0, take: params?.limit || 20 });
    const total = await prisma.hsCode.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async getHsCodeById(tenantId: string, id: string) {
    const code = await prisma.hsCode.findFirst({ where: { id, tenantId } });
    if (!code) throw new NotFoundException('HS Code not found');
    return code;
  }

  async createHsCode(tenantId: string, dto: any) {
    const existing = await prisma.hsCode.findFirst({ where: { tenantId, code: dto.code } });
    if (existing) throw new BadRequestException(`HS Code ${dto.code} already exists`);
    return prisma.hsCode.create({ data: { tenantId, ...dto } });
  }

  async updateHsCode(tenantId: string, id: string, dto: any) {
    const code = await prisma.hsCode.findFirst({ where: { id, tenantId } });
    if (!code) throw new NotFoundException('HS Code not found');
    return prisma.hsCode.update({ where: { id }, data: dto });
  }

  async getCountriesOfOrigin(tenantId: string) {
    return prisma.countryOfOrigin.findMany({ where: { tenantId, isActive: true }, orderBy: { countryName: 'asc' } });
  }

  async createCountryOfOrigin(tenantId: string, dto: any) {
    return prisma.countryOfOrigin.create({ data: { tenantId, ...dto } });
  }

  async getImportDeclarations(tenantId: string, params?: { status?: string; page?: number; limit?: number }) {
    const where: any = { tenantId };
    if (params?.status) where.status = params.status;
    const data = await prisma.importDeclaration.findMany({ where, include: { lines: true }, orderBy: { createdAt: 'desc' }, skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0, take: params?.limit || 20 });
    const total = await prisma.importDeclaration.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async getImportDeclarationById(tenantId: string, id: string) {
    const decl = await prisma.importDeclaration.findFirst({ where: { id, tenantId }, include: { lines: true } });
    if (!decl) throw new NotFoundException('Import declaration not found');
    return decl;
  }

  async createImportDeclaration(tenantId: string, dto: any, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const totalLandedCost = (dto.invoiceValue || 0) + (dto.dutyAmount || 0) + (dto.freightCost || 0) + (dto.insuranceCost || 0);
      const decl = await tx.importDeclaration.create({
        data: {
          tenantId, declarationNumber: dto.declarationNumber, entryNumber: dto.entryNumber || null,
          portOfEntry: dto.portOfEntry || null, portOfLading: dto.portOfLading || null,
          vessel: dto.vessel || null, voyageNumber: dto.voyageNumber || null,
          containerNumber: dto.containerNumber || null, supplierId: dto.supplierId || null,
          supplierName: dto.supplierName || null, hsCodeId: dto.hsCodeId || null,
          hsCode: dto.hsCode || null, countryOfOrigin: dto.countryOfOrigin || null,
          invoiceValue: dto.invoiceValue ? new Prisma.Decimal(dto.invoiceValue) : null,
          currency: dto.currency || 'USD', dutyAmount: dto.dutyAmount ? new Prisma.Decimal(dto.dutyAmount) : null,
          freightCost: dto.freightCost ? new Prisma.Decimal(dto.freightCost) : null,
          insuranceCost: dto.insuranceCost ? new Prisma.Decimal(dto.insuranceCost) : null,
          totalLandedCost: new Prisma.Decimal(totalLandedCost), brokerName: dto.brokerName || null,
          notes: dto.notes || null, createdBy: userId || null,
        },
      });
      if (dto.lines?.length) {
        await tx.importDeclarationLine.createMany({
          data: dto.lines.map((l: any) => ({ tenantId, importDeclarationId: decl.id, ...l, quantity: new Prisma.Decimal(l.quantity), unitValue: l.unitValue ? new Prisma.Decimal(l.unitValue) : null, totalValue: l.unitValue && l.quantity ? new Prisma.Decimal(l.unitValue * l.quantity) : null })),
        });
      }
      return tx.importDeclaration.findUnique({ where: { id: decl.id }, include: { lines: true } });
    });
  }

  async updateImportDeclarationStatus(tenantId: string, id: string, status: string) {
    const decl = await prisma.importDeclaration.findFirst({ where: { id, tenantId } });
    if (!decl) throw new NotFoundException('Import declaration not found');
    const updateData: any = { status };
    if (status === 'FILED') updateData.filedDate = new Date();
    if (status === 'CLEARED') updateData.clearanceDate = new Date();
    if (status === 'RELEASED') updateData.releaseDate = new Date();
    return prisma.importDeclaration.update({ where: { id }, data: updateData });
  }

  async getExportDeclarations(tenantId: string, params?: { status?: string; page?: number; limit?: number }) {
    const where: any = { tenantId };
    if (params?.status) where.status = params.status;
    const data = await prisma.exportDeclaration.findMany({ where, include: { lines: true }, orderBy: { createdAt: 'desc' }, skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0, take: params?.limit || 20 });
    const total = await prisma.exportDeclaration.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async createExportDeclaration(tenantId: string, dto: any, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const decl = await tx.exportDeclaration.create({
        data: {
          tenantId, declarationNumber: dto.declarationNumber, portOfExport: dto.portOfExport || null,
          destinationCountry: dto.destinationCountry || null, shipmentId: dto.shipmentId || null,
          carrierName: dto.carrierName || null, containerNumber: dto.containerNumber || null,
          hsCodeId: dto.hsCodeId || null, hsCode: dto.hsCode || null,
          invoiceValue: dto.invoiceValue ? new Prisma.Decimal(dto.invoiceValue) : null,
          currency: dto.currency || 'USD', exportLicense: dto.exportLicense || null,
          eccn: dto.eccn || null, notes: dto.notes || null, createdBy: userId || null,
        },
      });
      if (dto.lines?.length) {
        await tx.exportDeclarationLine.createMany({
          data: dto.lines.map((l: any) => ({ tenantId, exportDeclarationId: decl.id, ...l, quantity: new Prisma.Decimal(l.quantity), unitValue: l.unitValue ? new Prisma.Decimal(l.unitValue) : null, totalValue: l.unitValue && l.quantity ? new Prisma.Decimal(l.unitValue * l.quantity) : null })),
        });
      }
      return tx.exportDeclaration.findUnique({ where: { id: decl.id }, include: { lines: true } });
    });
  }

  async getComplianceScreenings(tenantId: string, params?: { status?: string; screenType?: string }) {
    const where: any = { tenantId };
    if (params?.status) where.status = params.status;
    if (params?.screenType) where.screenType = params.screenType;
    return prisma.tradeComplianceScreening.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createComplianceScreening(tenantId: string, dto: any, userId?: string) {
    return prisma.tradeComplianceScreening.create({ data: { tenantId, ...dto, createdBy: userId || null, status: 'PENDING' } });
  }

  async resolveComplianceScreening(tenantId: string, id: string, resolution: string, userId?: string) {
    const screen = await prisma.tradeComplianceScreening.findFirst({ where: { id, tenantId } });
    if (!screen) throw new NotFoundException('Compliance screening not found');
    return prisma.tradeComplianceScreening.update({ where: { id }, data: { status: resolution === 'BLOCKED' ? 'MATCH_FOUND' : 'PENDING', resolution, reviewedBy: userId, reviewedAt: new Date() } });
  }
}
