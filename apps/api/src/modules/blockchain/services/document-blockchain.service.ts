import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  DocumentRegistryContract,
  VerificationResult,
  BlockchainEntityType,
  FABRIC_CHAINCODES,
} from '@unerp/blockchain';

@Injectable()
export class DocumentBlockchainService {
  private readonly logger = new Logger(DocumentBlockchainService.name);

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
  ) {}

  async verifyDocument(params: {
    tenantId: string;
    documentId: string;
    currentHash: string;
  }): Promise<{
    result: VerificationResult;
    onChainHash: string | null;
    blockNumber: bigint | null;
    transactionId: string | null;
    committedAt: string | null;
  }> {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.DOCUMENT_REGISTRY);

    if (!rawContract) {
      return {
        result: VerificationResult.NETWORK_ERROR,
        onChainHash: null,
        blockNumber: null,
        transactionId: null,
        committedAt: null,
      };
    }

    try {
      const contract = new DocumentRegistryContract(rawContract);
      const onChainRecord = await contract.verifyDocument(params.tenantId, params.documentId);

      if (!onChainRecord) {
        await prisma.blockchainVerification.create({
          data: {
            tenantId: params.tenantId,
            entityType: BlockchainEntityType.DOCUMENT,
            entityId: params.documentId,
            result: VerificationResult.NOT_FOUND,
            localHash: params.currentHash,
          },
        });

        return {
          result: VerificationResult.NOT_FOUND,
          onChainHash: null,
          blockNumber: null,
          transactionId: null,
          committedAt: null,
        };
      }

      const hashesMatch = onChainRecord.dataHash === params.currentHash;
      const result = onChainRecord.revoked
        ? VerificationResult.TAMPERED
        : hashesMatch
          ? VerificationResult.VERIFIED
          : VerificationResult.TAMPERED;

      await prisma.blockchainVerification.create({
        data: {
          tenantId: params.tenantId,
          entityType: BlockchainEntityType.DOCUMENT,
          entityId: params.documentId,
          result,
          onChainHash: onChainRecord.dataHash,
          localHash: params.currentHash,
        },
      });

      if (result === VerificationResult.TAMPERED) {
        this.logger.warn(
          `TAMPER DETECTED: Document ${params.documentId} — ` +
          `on-chain hash: ${onChainRecord.dataHash}, local hash: ${params.currentHash}`,
        );
      }

      return {
        result,
        onChainHash: onChainRecord.dataHash,
        blockNumber: onChainRecord.blockNumber ? BigInt(onChainRecord.blockNumber) : null,
        transactionId: onChainRecord.transactionId,
        committedAt: onChainRecord.committedAt,
      };
    } catch (err) {
      this.logger.error(`Verification error for document ${params.documentId}: ${(err as Error).message}`);
      return {
        result: VerificationResult.NETWORK_ERROR,
        onChainHash: null,
        blockNumber: null,
        transactionId: null,
        committedAt: null,
      };
    }
  }

  async getDocumentBlockchainRecord(tenantId: string, documentId: string) {
    return prisma.blockchainTransaction.findFirst({
      where: {
        tenantId,
        entityType: BlockchainEntityType.DOCUMENT,
        entityId: documentId,
        status: 'CONFIRMED',
      },
      orderBy: { confirmedAt: 'desc' },
    });
  }
}
