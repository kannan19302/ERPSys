import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  FinanceLedgerContract,
  computePayloadHash,
  VerificationResult,
  BlockchainEntityType,
  FABRIC_CHAINCODES,
} from '@unerp/blockchain';

@Injectable()
export class FinanceLedgerBlockchainService {
  private readonly logger = new Logger(FinanceLedgerBlockchainService.name);

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
  ) {}

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
        this.logger.warn(`GL JOURNAL TAMPER: ${params.journalId} — hash mismatch detected!`);
      }

      return result;
    } catch (err) {
      this.logger.error(`Verification error for GL journal ${params.journalId}: ${(err as Error).message}`);
      return VerificationResult.NETWORK_ERROR;
    }
  }

  async getJournalBlockchainRecord(tenantId: string, journalId: string) {
    return prisma.blockchainTransaction.findFirst({
      where: {
        tenantId,
        entityType: BlockchainEntityType.GL_JOURNAL,
        entityId: journalId,
        status: 'CONFIRMED',
      },
      orderBy: { confirmedAt: 'desc' },
    });
  }
}
