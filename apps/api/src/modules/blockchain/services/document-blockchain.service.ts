/**
 * DocumentBlockchainService
 *
 * NestJS service that wires the Documents module to the Hyperledger Fabric
 * Document Registry chaincode. Submits document hashes after upload,
 * verifies authenticity on-demand.
 *
 * Graceful degradation: if Fabric is unavailable, the document still
 * saves to PostgreSQL/storage — blockchain anchoring is queued for retry.
 */

import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  DocumentRegistryContract,
  VerificationResult,
  BlockchainTxStatus,
  BlockchainEntityType,
  FABRIC_CHAINCODES,
} from '@unerp/blockchain';

@Injectable()
export class DocumentBlockchainService {
  private readonly logger = new Logger(DocumentBlockchainService.name);

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
  ) {}

  /**
   * Anchor a document hash on the blockchain after upload.
   * Creates a BlockchainTransaction record and submits to Fabric.
   *
   * Called by the documents service after successful file storage.
   */
  async anchorDocument(params: {
    tenantId: string;
    documentId: string;
    documentHash: string;
    documentType: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: string;
  }): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    // Always record the pending transaction in PostgreSQL first
    const pendingTx = await prisma.blockchainTransaction.create({
      data: {
        tenantId: params.tenantId,
        entityType: BlockchainEntityType.DOCUMENT,
        entityId: params.documentId,
        channelName: 'unerp-channel',
        chaincodeName: FABRIC_CHAINCODES.DOCUMENT_REGISTRY,
        dataHash: params.documentHash,
        status: BlockchainTxStatus.PENDING,
      },
    });

    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.DOCUMENT_REGISTRY);

    if (!rawContract) {
      this.logger.warn(
        `Fabric unavailable — document ${params.documentId} anchoring deferred (tx: ${pendingTx.id})`,
      );
      return { txStatus: BlockchainTxStatus.PENDING };
    }

    try {
      const contract = new DocumentRegistryContract(rawContract);
      const onChainRecord = await contract.registerDocument({
        tenantId: params.tenantId,
        documentId: params.documentId,
        documentHash: params.documentHash,
        documentType: params.documentType,
        fileName: params.fileName,
        fileSize: params.fileSize,
        mimeType: params.mimeType,
        uploadedBy: params.uploadedBy,
        uploadedAt: params.uploadedAt,
      });

      // Update PostgreSQL with confirmed transaction details
      await prisma.blockchainTransaction.update({
        where: { id: pendingTx.id },
        data: {
          status: BlockchainTxStatus.CONFIRMED,
          transactionId: onChainRecord.transactionId,
          confirmedAt: new Date(),
        },
      });

      this.logger.log(
        `✅ Document ${params.documentId} anchored on Fabric (tx: ${onChainRecord.transactionId})`,
      );

      return {
        txStatus: BlockchainTxStatus.CONFIRMED,
        txId: onChainRecord.transactionId,
      };
    } catch (err) {
      const errorMessage = (err as Error).message;
      this.logger.error(`Failed to anchor document ${params.documentId}: ${errorMessage}`);

      await prisma.blockchainTransaction.update({
        where: { id: pendingTx.id },
        data: {
          status: BlockchainTxStatus.FAILED,
          errorMessage,
          retryCount: { increment: 1 },
        },
      });

      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Verify a document's authenticity against the blockchain.
   *
   * Compares the on-chain hash with the current local hash to detect tampering.
   */
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
        // Record this verification
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

      // Check if current hash matches what's on-chain
      const hashesMatch = onChainRecord.dataHash === params.currentHash;

      // If document is revoked, it's also flagged
      const result = onChainRecord.revoked
        ? VerificationResult.TAMPERED // Revoked = consider tampered for display
        : hashesMatch
          ? VerificationResult.VERIFIED
          : VerificationResult.TAMPERED;

      // Record verification result
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
          `🚨 TAMPER DETECTED: Document ${params.documentId} — ` +
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

  /**
   * Get the blockchain transaction record for a document.
   */
  async getDocumentBlockchainRecord(tenantId: string, documentId: string) {
    return prisma.blockchainTransaction.findFirst({
      where: {
        tenantId,
        entityType: BlockchainEntityType.DOCUMENT,
        entityId: documentId,
        status: BlockchainTxStatus.CONFIRMED,
      },
      orderBy: { confirmedAt: 'desc' },
    });
  }
}
