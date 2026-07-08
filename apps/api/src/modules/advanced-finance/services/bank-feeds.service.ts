import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class BankFeedsService {
  async getConnections(tenantId: string) {
    return prisma.bankConnection.findMany({
      where: { tenantId },
      include: { bankAccount: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getConnectionById(tenantId: string, id: string) {
    const connection = await prisma.bankConnection.findFirst({
      where: { id, tenantId },
      include: { bankAccount: true },
    });
    if (!connection) {
      throw new NotFoundException('Bank connection not found');
    }
    return connection;
  }

  async createConnection(
    tenantId: string,
    orgId: string,
    dto: {
      bankName: string;
      accountNumber: string;
      accountType: string;
      bankAccountId: string;
      credentialsHash?: string;
    },
  ) {
    // Verify bank account exists
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: dto.bankAccountId, tenantId },
    });
    if (!bankAccount) {
      throw new NotFoundException('Target Bank Account not found');
    }

    return prisma.bankConnection.create({
      data: {
        tenantId,
        orgId,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        credentialsHash: dto.credentialsHash || 'simulated-token',
        bankAccountId: dto.bankAccountId,
        status: 'ACTIVE',
      },
    });
  }

  async deleteConnection(tenantId: string, id: string) {
    const connection = await this.getConnectionById(tenantId, id);
    return prisma.bankConnection.delete({
      where: { id: connection.id },
    });
  }

  async syncTransactions(tenantId: string, connectionId: string) {
    const connection = await this.getConnectionById(tenantId, connectionId);

    // Simulate fetching Plaid/Yodlee bank feeds
    // We will generate 3 simulated transactions:
    // 1. A typical service payout/refund (inflow)
    // 2. A typical utility bill or office expense (outflow)
    // 3. A typical bank fee (outflow)
    const simulatedTxData = [
      {
        date: new Date(),
        description: 'Plaid Simulated Inflow — Customer Payment Receipt',
        amount: new Prisma.Decimal(350.00),
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        description: 'Simulated Outflow — Software Subscription Service',
        amount: new Prisma.Decimal(-45.00),
      },
      {
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        description: 'Simulated Outflow — Bank Maintenance Fee',
        amount: new Prisma.Decimal(-15.00),
      },
    ];

    const createdTx = [];
    for (const tx of simulatedTxData) {
      // Check if duplicate already exists (same description, amount, connection, date within 1 hour)
      const existing = await prisma.bankTransaction.findFirst({
        where: {
          connectionId,
          tenantId,
          amount: tx.amount,
          description: tx.description,
          date: {
            gte: new Date(tx.date.getTime() - 30 * 60 * 1000),
            lte: new Date(tx.date.getTime() + 30 * 60 * 1000),
          },
        },
      });

      if (!existing) {
        const item = await prisma.bankTransaction.create({
          data: {
            tenantId,
            connectionId,
            date: tx.date,
            description: tx.description,
            amount: tx.amount,
            status: 'UNMATCHED',
          },
        });
        createdTx.push(item);
      }
    }

    // Update last sync time
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() },
    });

    return {
      syncedCount: createdTx.length,
      transactions: createdTx,
    };
  }

  async getTransactions(
    tenantId: string,
    params: {
      connectionId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.BankTransactionWhereInput = { tenantId };

    if (params.connectionId) {
      whereClause.connectionId = params.connectionId;
    }
    if (params.status) {
      whereClause.status = params.status;
    }
    if (params.search) {
      whereClause.description = { contains: params.search, mode: 'insensitive' };
    }

    const [transactions, total] = await Promise.all([
      prisma.bankTransaction.findMany({
        where: whereClause,
        include: { connection: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bankTransaction.count({ where: whereClause }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
    };
  }

  async autoMatchTransaction(tenantId: string, id: string) {
    const transaction = await prisma.bankTransaction.findFirst({
      where: { id, tenantId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status === 'MATCHED') throw new BadRequestException('Transaction is already matched');

    const amount = Number(transaction.amount);
    const dateLimitStart = new Date(transaction.date.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateLimitEnd = new Date(transaction.date.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Look for matching Payment
    // Note: outflow is negative, inflow is positive. Match payment amount exactly.
    const paymentMatch = await prisma.payment.findFirst({
      where: {
        tenantId,
        amount: Math.abs(amount),
        paidAt: { gte: dateLimitStart, lte: dateLimitEnd },
      },
    });

    if (paymentMatch) {
      const updated = await prisma.bankTransaction.update({
        where: { id },
        data: {
          status: 'MATCHED',
          matchedEntityId: paymentMatch.id,
          matchedEntityType: 'PAYMENT',
        },
      });
      return { matched: true, type: 'PAYMENT', record: paymentMatch, transaction: updated };
    }

    // 2. Look for matching POSTED JournalEntry
    // Positive amount (inflow) matches debit, negative amount (outflow) matches credit
    const targetDebit = amount > 0 ? amount : 0;
    const targetCredit = amount < 0 ? Math.abs(amount) : 0;

    const journalEntryMatch = await prisma.journalEntry.findFirst({
      where: {
        tenantId,
        debit: targetDebit,
        credit: targetCredit,
        journal: {
          status: 'POSTED',
          date: { gte: dateLimitStart, lte: dateLimitEnd },
        },
      },
      include: { journal: true },
    });

    if (journalEntryMatch) {
      const updated = await prisma.bankTransaction.update({
        where: { id },
        data: {
          status: 'MATCHED',
          matchedEntityId: journalEntryMatch.id,
          matchedEntityType: 'JOURNAL_ENTRY',
        },
      });
      return { matched: true, type: 'JOURNAL_ENTRY', record: journalEntryMatch, transaction: updated };
    }

    return { matched: false, message: 'No matching general ledger records or payments found within the matching window' };
  }

  async manualMatchTransaction(
    tenantId: string,
    id: string,
    dto: { matchedEntityId: string; matchedEntityType: 'PAYMENT' | 'JOURNAL_ENTRY' },
  ) {
    const transaction = await prisma.bankTransaction.findFirst({
      where: { id, tenantId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    if (dto.matchedEntityType === 'PAYMENT') {
      const payment = await prisma.payment.findFirst({ where: { id: dto.matchedEntityId, tenantId } });
      if (!payment) throw new NotFoundException('Linked Payment not found');
    } else {
      const journalEntry = await prisma.journalEntry.findFirst({ where: { id: dto.matchedEntityId, tenantId } });
      if (!journalEntry) throw new NotFoundException('Linked Journal Entry not found');
    }

    const updated = await prisma.bankTransaction.update({
      where: { id },
      data: {
        status: 'MATCHED',
        matchedEntityId: dto.matchedEntityId,
        matchedEntityType: dto.matchedEntityType,
      },
    });

    return updated;
  }

  async ignoreTransaction(tenantId: string, id: string) {
    const transaction = await prisma.bankTransaction.findFirst({
      where: { id, tenantId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    return prisma.bankTransaction.update({
      where: { id },
      data: { status: 'IGNORED' },
    });
  }
}
