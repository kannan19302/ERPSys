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

  async startEventListeners(): Promise<void> {
    try {
      await this.startDocumentRegistryListener();
      await this.startFinanceLedgerListener();
      this.logger.log('Blockchain event listeners started (durable checkpoint)');
    } catch (err) {
      this.logger.warn(`Failed to start event listeners: ${(err as Error).message}`);
    }
  }

  private async readCheckpoint(chaincodeName: string): Promise<bigint | undefined> {
    try {
      const checkpoint = await prisma.blockchainSyncCheckpoint.findUnique({
        where: {
          channelName_chaincodeName: {
            channelName: FABRIC_CHANNELS.UNERP_MAIN,
            chaincodeName,
          },
        },
      });
      if (checkpoint) {
        const block = BigInt(checkpoint.lastBlockNumber);
        this.logger.debug(`Resuming ${chaincodeName} listener from block ${block + 1n}`);
        return block + 1n;
      }
    } catch {
    }
    return undefined;
  }

  private async updateCheckpoint(chaincodeName: string, blockNumber: bigint): Promise<void> {
    try {
      await prisma.blockchainSyncCheckpoint.upsert({
        where: {
          channelName_chaincodeName: {
            channelName: FABRIC_CHANNELS.UNERP_MAIN,
            chaincodeName,
          },
        },
        update: { lastBlockNumber: String(blockNumber) },
        create: {
          channelName: FABRIC_CHANNELS.UNERP_MAIN,
          chaincodeName,
          lastBlockNumber: String(blockNumber),
        },
      });
    } catch (err) {
      this.logger.error(`Failed to update checkpoint for ${chaincodeName}: ${(err as Error).message}`);
    }
  }

  private async startDocumentRegistryListener(): Promise<void> {
    const network = this.fabricGateway.getNetwork(FABRIC_CHANNELS.UNERP_MAIN);
    if (!network) return;

    const startBlock = await this.readCheckpoint(FABRIC_CHAINCODES.DOCUMENT_REGISTRY);
    const chaincodeName = FABRIC_CHAINCODES.DOCUMENT_REGISTRY;

    this.eventListener
      .on('DocumentRegistered', async (_eventName: string, payload: unknown, txId: string, blockNumber: bigint) => {
        const p = payload as { tenantId: string; documentId: string; documentHash: string };
        await this.updateBlockchainTransaction(p.tenantId, p.documentId, txId, blockNumber);
        await this.updateCheckpoint(chaincodeName, blockNumber);
        this.logger.debug(`Event: DocumentRegistered — ${p.documentId} (block: ${blockNumber})`);
      })
      .on('DocumentRevoked', async (_eventName: string, payload: unknown, _txId: string, blockNumber: bigint) => {
        const p = payload as { tenantId: string; documentId: string };
        this.logger.log(`Event: DocumentRevoked — ${p.documentId}`);
        await this.updateCheckpoint(chaincodeName, blockNumber);
      });

    await this.eventListener.startListening(network, {
      channelName: FABRIC_CHANNELS.UNERP_MAIN,
      chaincodeName,
      startBlock,
    });
  }

  private async startFinanceLedgerListener(): Promise<void> {
    const network = this.fabricGateway.getNetwork(FABRIC_CHANNELS.UNERP_MAIN);
    if (!network) return;

    const startBlock = await this.readCheckpoint(FABRIC_CHAINCODES.FINANCE_LEDGER);
    const chaincodeName = FABRIC_CHAINCODES.FINANCE_LEDGER;

    this.eventListener
      .on('JournalEntryRecorded', async (_eventName: string, payload: unknown, txId: string, blockNumber: bigint) => {
        const p = payload as { tenantId: string; journalId: string };
        await this.updateBlockchainTransaction(p.tenantId, p.journalId, txId, blockNumber);
        await this.updateCheckpoint(chaincodeName, blockNumber);
        this.logger.debug(`Event: JournalEntryRecorded — ${p.journalId}`);
      })
      .on('PeriodClosed', async (_eventName: string, payload: unknown, _txId: string, blockNumber: bigint) => {
        const p = payload as { tenantId: string; periodId: string };
        this.logger.log(`Event: PeriodClosed — ${p.periodId}`);
        await this.updateCheckpoint(chaincodeName, blockNumber);
      });

    await this.eventListener.startListening(network, {
      channelName: FABRIC_CHANNELS.UNERP_MAIN,
      chaincodeName,
      startBlock,
    });
  }

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

  stopAllListeners(): void {
    this.eventListener.stopAll();
  }
}
