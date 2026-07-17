/**
 * BlockchainSyncService
 *
 * Listens for Fabric chaincode events and syncs on-chain state
 * back into PostgreSQL for fast querying.
 *
 * This is the bridge between the Fabric event bus and PostgreSQL.
 * Pattern: long-lived background listener, started at module init.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  BlockchainEventListener,
  FABRIC_CHAINCODES,
  FABRIC_CHANNELS,
  BlockchainTxStatus,
} from '@unerp/blockchain';

@Injectable()
export class BlockchainSyncService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainSyncService.name);
  private readonly isEnabled = process.env['BLOCKCHAIN_ENABLED'] === 'true';

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
    private readonly eventListener: BlockchainEventListener,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled || !this.fabricGateway.isConnected()) {
      return;
    }

    await this.startEventListeners();
  }

  /**
   * Start all chaincode event listeners.
   * One listener per chaincode per channel.
   */
  async startEventListeners(): Promise<void> {
    try {
      await this.startDocumentRegistryListener();
      await this.startFinanceLedgerListener();
      this.logger.log('✅ Blockchain event listeners started');
    } catch (err) {
      this.logger.warn(`Failed to start event listeners: ${(err as Error).message}`);
    }
  }

  private async startDocumentRegistryListener(): Promise<void> {
    const network = this.fabricGateway.getNetwork(FABRIC_CHANNELS.UNERP_MAIN);
    if (!network) return;

    this.eventListener
      .on('DocumentRegistered', async (_eventName: string, payload: unknown, txId: string, blockNumber: bigint) => {
        const p = payload as { tenantId: string; documentId: string; documentHash: string };
        await this.updateBlockchainTransaction(p.tenantId, p.documentId, txId, blockNumber);
        this.logger.log(`Event: DocumentRegistered — ${p.documentId} (block: ${blockNumber})`);
      })
      .on('DocumentRevoked', async (_eventName: string, payload: unknown, _txId: string, _blockNumber: bigint) => {
        const p = payload as { tenantId: string; documentId: string };
        this.logger.log(`Event: DocumentRevoked — ${p.documentId}`);
        // Additional sync logic can be added here (e.g., flag document in PostgreSQL)
      });

    await this.eventListener.startListening(network, {
      channelName: FABRIC_CHANNELS.UNERP_MAIN,
      chaincodeName: FABRIC_CHAINCODES.DOCUMENT_REGISTRY,
    });
  }

  private async startFinanceLedgerListener(): Promise<void> {
    const network = this.fabricGateway.getNetwork(FABRIC_CHANNELS.UNERP_MAIN);
    if (!network) return;

    this.eventListener
      .on('JournalEntryRecorded', async (_eventName: string, payload: unknown, txId: string, blockNumber: bigint) => {
        const p = payload as { tenantId: string; journalId: string };
        await this.updateBlockchainTransaction(p.tenantId, p.journalId, txId, blockNumber);
        this.logger.log(`Event: JournalEntryRecorded — ${p.journalId}`);
      })
      .on('PeriodClosed', async (_eventName: string, payload: unknown, _txId: string, _blockNumber: bigint) => {
        const p = payload as { tenantId: string; periodId: string };
        this.logger.log(`Event: PeriodClosed — ${p.periodId}`);
      });

    await this.eventListener.startListening(network, {
      channelName: FABRIC_CHANNELS.UNERP_MAIN,
      chaincodeName: FABRIC_CHAINCODES.FINANCE_LEDGER,
    });
  }

  /**
   * Update the PostgreSQL BlockchainTransaction record with confirmed on-chain details.
   */
  private async updateBlockchainTransaction(
    tenantId: string,
    entityId: string,
    txId: string,
    blockNumber: bigint,
  ): Promise<void> {
    try {
      await prisma.blockchainTransaction.updateMany({
        where: {
          tenantId,
          entityId,
          status: { in: [BlockchainTxStatus.PENDING, BlockchainTxStatus.SUBMITTED] },
        },
        data: {
          status: BlockchainTxStatus.CONFIRMED,
          transactionId: txId,
          blockNumber: blockNumber.toString(),
          confirmedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(`Failed to update blockchain tx for ${entityId}: ${(err as Error).message}`);
    }
  }

  /**
   * Stop all event listeners (called on module destroy).
   */
  stopAllListeners(): void {
    this.eventListener.stopAll();
  }
}
