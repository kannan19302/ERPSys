import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { prisma, runWithTenantSession } from "@unerp/database";

@Injectable()
export class BlockchainDeepService {
  private readonly logger = new Logger(BlockchainDeepService.name);

  /* ──────────────── Transaction Explorer ──────────────── */

  async listTransactions(tenantId: string, query: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { transactionHash: { contains: query.search, mode: "insensitive" } },
        { fromAddress: { contains: query.search, mode: "insensitive" } },
        { toAddress: { contains: query.search, mode: "insensitive" } },
      ];
    }
    return runWithTenantSession({ tenantId, userId: "" }, async () => {
      const [items, total] = await Promise.all([
        prisma.blockchainTransactionExplorer.findMany({
          where, orderBy: { timestamp: "desc" }, skip: (page - 1) * limit, take: limit,
        }),
        prisma.blockchainTransactionExplorer.count({ where }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    });
  }

  async getTransaction(tenantId: string, id: string) {
    const tx = await prisma.blockchainTransactionExplorer.findFirst({ where: { id, tenantId } });
    if (!tx) throw new NotFoundException("Transaction not found");
    return tx;
  }

  /* ──────────────── Smart Contract Registry ──────────────── */

  async listContracts(tenantId: string) {
    return prisma.blockchainSmartContract.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  }

  async createContract(tenantId: string, data: { name: string; address: string; network?: string; abi?: any[]; version?: string }) {
    return prisma.blockchainSmartContract.create({
      data: { tenantId, name: data.name, address: data.address, network: data.network ?? "ethereum", abi: data.abi ?? [], version: data.version ?? "1.0.0" },
    });
  }

  async updateContract(tenantId: string, id: string, data: Partial<{ name: string; address: string; network: string; abi: any[]; version: string }>) {
    const contract = await prisma.blockchainSmartContract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException("Contract not found");
    return prisma.blockchainSmartContract.update({ where: { id }, data });
  }

  async deleteContract(tenantId: string, id: string) {
    const contract = await prisma.blockchainSmartContract.findFirst({ where: { id, tenantId } });
    if (!contract) throw new NotFoundException("Contract not found");
    await prisma.blockchainSmartContract.delete({ where: { id } });
    return { message: "Contract removed" };
  }

  /* ──────────────── Blockchain Audit Trail ──────────────── */

  async listAuditTrails(tenantId: string, query: { page?: number; limit?: number; entityType?: string; entityId?: string }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 100);
    const where: any = { tenantId };
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    return runWithTenantSession({ tenantId, userId: "" }, async () => {
      const [items, total] = await Promise.all([
        prisma.blockchainAuditTrail.findMany({ where, orderBy: { timestamp: "desc" }, skip: (page - 1) * limit, take: limit }),
        prisma.blockchainAuditTrail.count({ where }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    });
  }

  async createAuditTrail(tenantId: string, data: { entityType: string; entityId: string; action: string; performedBy: string; transactionHash?: string; metadata?: any }) {
    return prisma.blockchainAuditTrail.create({ data: { tenantId, ...data } });
  }

  /* ──────────────── Network Health Dashboard ──────────────── */

  async getNetworkHealth() {
    const records = await prisma.blockchainNetworkHealth.findMany({ orderBy: { lastCheckedAt: "desc" } });
    return records;
  }

  async upsertNetworkHealth(data: { network: string; blockHeight: number; peers: number; syncStatus: string }) {
    return prisma.blockchainNetworkHealth.upsert({
      where: { network: data.network },
      create: { ...data, lastCheckedAt: new Date() },
      update: { ...data, lastCheckedAt: new Date() },
    });
  }

  async getNetworkStats() {
    const records = await prisma.blockchainNetworkHealth.findMany();
    const totalTx = await prisma.blockchainTransactionExplorer.count();
    const totalContracts = await prisma.blockchainSmartContract.count();
    const totalAuditEntries = await prisma.blockchainAuditTrail.count();
    return { networks: records, totalTransactions: totalTx, totalContracts, totalAuditEntries };
  }
}
