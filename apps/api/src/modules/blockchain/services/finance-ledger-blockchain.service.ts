/**
 * FinanceLedgerBlockchainService
 *
 * Anchors GL journal entry hashes and period-close attestations
 * on the immutable Fabric finance-ledger chaincode.
 */

import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  FinanceLedgerContract,
  computePayloadHash,
  VerificationResult,
  BlockchainTxStatus,
  BlockchainEntityType,
  FABRIC_CHAINCODES,
} from '@unerp/blockchain';

@Injectable()
export class FinanceLedgerBlockchainService {
  private readonly logger = new Logger(FinanceLedgerBlockchainService.name);

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
  ) {}

  /**
   * Anchor a GL journal entry hash after posting.
   * Only hashes are stored on-chain — full data stays in PostgreSQL.
   */
  async anchorJournalEntry(params: {
    tenantId: string;
    journalId: string;
    periodId: string;
    entryData: Record<string, unknown>;
    totalDebit: string;
    totalCredit: string;
    currency: string;
    postedBy: string;
    postedAt: string;
    description: string;
  }): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    const dataHash = computePayloadHash(params.entryData);

    const pendingTx = await prisma.blockchainTransaction.create({
      data: {
        tenantId: params.tenantId,
        entityType: BlockchainEntityType.GL_JOURNAL,
        entityId: params.journalId,
        channelName: 'unerp-channel',
        chaincodeName: FABRIC_CHAINCODES.FINANCE_LEDGER,
        dataHash,
        status: BlockchainTxStatus.PENDING,
      },
    });

    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.FINANCE_LEDGER);
    if (!rawContract) {
      this.logger.warn(`Fabric unavailable — GL journal ${params.journalId} anchoring deferred`);
      return { txStatus: BlockchainTxStatus.PENDING };
    }

    try {
      const contract = new FinanceLedgerContract(rawContract);
      const onChainRecord = await contract.recordJournalEntry({
        tenantId: params.tenantId,
        journalId: params.journalId,
        periodId: params.periodId,
        dataHash,
        totalDebit: params.totalDebit,
        totalCredit: params.totalCredit,
        currency: params.currency,
        postedBy: params.postedBy,
        postedAt: params.postedAt,
        description: params.description,
      });

      await prisma.blockchainTransaction.update({
        where: { id: pendingTx.id },
        data: {
          status: BlockchainTxStatus.CONFIRMED,
          transactionId: onChainRecord.transactionId,
          confirmedAt: new Date(),
        },
      });

      this.logger.log(`✅ GL Journal ${params.journalId} anchored (tx: ${onChainRecord.transactionId})`);
      return { txStatus: BlockchainTxStatus.CONFIRMED, txId: onChainRecord.transactionId };
    } catch (err) {
      const errorMessage = (err as Error).message;
      this.logger.error(`Failed to anchor GL journal ${params.journalId}: ${errorMessage}`);

      // Check for TAMPER_DETECTED (different hash already exists)
      if (errorMessage.includes('different hash')) {
        this.logger.warn(`🚨 TAMPER ATTEMPT: GL Journal ${params.journalId} hash mismatch!`);
      }

      await prisma.blockchainTransaction.update({
        where: { id: pendingTx.id },
        data: { status: BlockchainTxStatus.FAILED, errorMessage, retryCount: { increment: 1 } },
      });

      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Verify a GL journal entry's integrity.
   */
  async verifyJournalEntry(params: {
    tenantId: string;
    journalId: string;
    currentEntryData: Record<string, unknown>;
  }): Promise<VerificationResult> {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.FINANCE_LEDGER);
    if (!rawContract) return VerificationResult.NETWORK_ERROR;

    try {
      const contract = new FinanceLedgerContract(rawContract);
      const onChainRecord = await contract.verifyJournalEntry(params.tenantId, params.journalId);

      if (!onChainRecord) return VerificationResult.NOT_FOUND;

      const currentHash = computePayloadHash(params.currentEntryData);
      const result = onChainRecord.dataHash === currentHash
        ? VerificationResult.VERIFIED
        : VerificationResult.TAMPERED;

      if (result === VerificationResult.TAMPERED) {
        this.logger.warn(`🚨 GL JOURNAL TAMPER: ${params.journalId} — hash mismatch detected!`);
      }

      return result;
    } catch (err) {
      this.logger.error(`Verification error for GL journal ${params.journalId}: ${(err as Error).message}`);
      return VerificationResult.NETWORK_ERROR;
    }
  }

  /**
   * Attest a period close on the blockchain (immutable close record).
   */
  async attestPeriodClose(params: {
    tenantId: string;
    periodId: string;
    closedBy: string;
    closedAt: string;
    totalTransactions: number;
    openingBalance: string;
    closingBalance: string;
  }): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.FINANCE_LEDGER);
    if (!rawContract) {
      this.logger.warn(`Fabric unavailable — period close ${params.periodId} attestation deferred`);
      return { txStatus: BlockchainTxStatus.PENDING };
    }

    try {
      const contract = new FinanceLedgerContract(rawContract);
      const record = await contract.attestPeriodClose(params);
      this.logger.log(`✅ Period close ${params.periodId} attested (tx: ${record.transactionId})`);
      return { txStatus: BlockchainTxStatus.CONFIRMED, txId: record.transactionId };
    } catch (err) {
      this.logger.error(`Period close attestation failed: ${(err as Error).message}`);
      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Get blockchain transaction record for a GL journal entry.
   */
  async getJournalBlockchainRecord(tenantId: string, journalId: string) {
    return prisma.blockchainTransaction.findFirst({
      where: {
        tenantId,
        entityType: BlockchainEntityType.GL_JOURNAL,
        entityId: journalId,
        status: BlockchainTxStatus.CONFIRMED,
      },
      orderBy: { confirmedAt: 'desc' },
    });
  }
}
