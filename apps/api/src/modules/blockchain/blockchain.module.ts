/**
 * BlockchainModule — NestJS module for Hyperledger Fabric integration
 *
 * This module wires the Fabric Gateway connection into the NestJS
 * dependency injection container, making blockchain services available
 * to all ERP modules that need them.
 *
 * Feature-flagged: set BLOCKCHAIN_ENABLED=true to activate.
 * When disabled, all blockchain operations return graceful no-ops.
 */

import { Module, Global, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { BlockchainEventListener } from '@unerp/blockchain';
import { FabricGatewayProvider } from './providers/fabric-gateway.provider';
import { DocumentBlockchainService } from './services/document-blockchain.service';
import { FinanceLedgerBlockchainService } from './services/finance-ledger-blockchain.service';
import { SupplyChainBlockchainService } from './services/supply-chain-blockchain.service';
import { ProcurementBlockchainService } from './services/procurement-blockchain.service';
import { BlockchainSyncService } from './services/blockchain-sync.service';
import { BlockchainController } from './blockchain.controller';

@Global()
@Module({
  controllers: [BlockchainController],
  providers: [
    FabricGatewayProvider,
    BlockchainEventListener,
    BlockchainSyncService,
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
  ],
})
export class BlockchainModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainModule.name);
  private readonly isEnabled = process.env['BLOCKCHAIN_ENABLED'] === 'true';

  constructor(private readonly fabricGateway: FabricGatewayProvider) {}

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.log('Blockchain layer is DISABLED (BLOCKCHAIN_ENABLED != true). All blockchain operations will be no-ops.');
      return;
    }

    try {
      await this.fabricGateway.connect();
      this.logger.log('✅ Hyperledger Fabric Gateway connected');
    } catch (err) {
      this.logger.warn(
        `⚠️ Fabric Gateway connection failed: ${(err as Error).message}. ` +
        `Blockchain operations will be degraded until Fabric is available. ` +
        `PostgreSQL operations are unaffected.`,
      );
      // Do NOT throw — Fabric being down must never crash the ERP API
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isEnabled && this.fabricGateway.isConnected()) {
      await this.fabricGateway.disconnect();
      this.logger.log('Fabric Gateway disconnected');
    }
  }
}
