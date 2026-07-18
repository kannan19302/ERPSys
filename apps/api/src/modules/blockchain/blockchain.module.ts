import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { BlockchainEventListener } from '@unerp/blockchain';
import { OutboxHandlerRegistry } from '../outbox/outbox-handler.registry';
import { FabricGatewayProvider } from './providers/fabric-gateway.provider';
import { DocumentBlockchainService } from './services/document-blockchain.service';
import { FinanceLedgerBlockchainService } from './services/finance-ledger-blockchain.service';
import { SupplyChainBlockchainService } from './services/supply-chain-blockchain.service';
import { ProcurementBlockchainService } from './services/procurement-blockchain.service';
import { BlockchainSyncService } from './services/blockchain-sync.service';
import { BlockchainAnchorService } from './services/blockchain-anchor.service';
import { BlockchainOutboxHandler } from './blockchain-outbox.handler';
import { BlockchainController } from './blockchain.controller';

@Module({
  controllers: [BlockchainController],
  providers: [
    FabricGatewayProvider,
    BlockchainEventListener,
    BlockchainSyncService,
    BlockchainAnchorService,
    BlockchainOutboxHandler,
    DocumentBlockchainService,
    FinanceLedgerBlockchainService,
    SupplyChainBlockchainService,
    ProcurementBlockchainService,
  ],
  exports: [
    DocumentBlockchainService,
    FinanceLedgerBlockchainService,
    SupplyChainBlockchainService,
    ProcurementBlockchainService,
    FabricGatewayProvider,
    BlockchainOutboxHandler,
  ],
})
export class BlockchainModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainModule.name);
  private readonly isEnabled = process.env['BLOCKCHAIN_ENABLED'] === 'true';

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
    private readonly outboxHandlerRegistry: OutboxHandlerRegistry,
    private readonly blockchainOutboxHandler: BlockchainOutboxHandler,
  ) {}

  async onModuleInit(): Promise<void> {
    this.outboxHandlerRegistry.register(
      'blockchain-anchor',
      (event) => this.blockchainOutboxHandler.handle(event),
    );

    if (!this.isEnabled) {
      this.logger.log('Blockchain layer is DISABLED (BLOCKCHAIN_ENABLED != true). All blockchain operations will be no-ops.');
      return;
    }

    try {
      await this.fabricGateway.connect();
      this.logger.log('Hyperledger Fabric Gateway connected');
    } catch (err) {
      this.logger.warn(
        `Fabric Gateway connection failed: ${(err as Error).message}. ` +
        `Blockchain operations will be degraded until Fabric is available. ` +
        `PostgreSQL operations are unaffected.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isEnabled && this.fabricGateway.isConnected()) {
      await this.fabricGateway.disconnect();
      this.logger.log('Fabric Gateway disconnected');
    }
  }
}
