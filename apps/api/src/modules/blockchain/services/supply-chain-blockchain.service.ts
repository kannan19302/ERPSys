/**
 * SupplyChainBlockchainService
 *
 * Records supply chain events (ASN creation, shipment tracking,
 * custody transfers, and recall notices) on the Fabric ledger.
 */

import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  SupplyChainTraceabilityContract,
  BlockchainTxStatus,
  BlockchainEntityType,
  FABRIC_CHAINCODES,
} from '@unerp/blockchain';
import type { SupplyChainArgs, OnChainRecord } from '@unerp/blockchain';

@Injectable()
export class SupplyChainBlockchainService {
  private readonly logger = new Logger(SupplyChainBlockchainService.name);

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
  ) {}

  /**
   * Record a shipment's origin and initial provenance data on-chain.
   * Called when an ASN is created in the supply-chain module.
   */
  async recordShipment(args: SupplyChainArgs['shipment']): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.SUPPLY_CHAIN);

    await prisma.blockchainTransaction.create({
      data: {
        tenantId: args.tenantId,
        entityType: BlockchainEntityType.SHIPMENT,
        entityId: args.shipmentId,
        channelName: 'supplychain-channel',
        chaincodeName: FABRIC_CHAINCODES.SUPPLY_CHAIN,
        dataHash: args.shipmentId, // Simplified hash for shipment identity
        status: rawContract ? BlockchainTxStatus.SUBMITTED : BlockchainTxStatus.PENDING,
      },
    });

    if (!rawContract) {
      this.logger.warn(`Fabric unavailable — shipment ${args.shipmentId} recording deferred`);
      return { txStatus: BlockchainTxStatus.PENDING };
    }

    try {
      const contract = new SupplyChainTraceabilityContract(rawContract);
      const record = await contract.recordShipment(args);
      this.logger.log(`✅ Shipment ${args.shipmentId} recorded on-chain (tx: ${record.transactionId})`);
      return { txStatus: BlockchainTxStatus.CONFIRMED, txId: record.transactionId };
    } catch (err) {
      this.logger.error(`Failed to record shipment ${args.shipmentId}: ${(err as Error).message}`);
      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Record a custody transfer between organizations.
   */
  async transferCustody(args: SupplyChainArgs['custody']): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.SUPPLY_CHAIN);
    if (!rawContract) return { txStatus: BlockchainTxStatus.PENDING };

    try {
      const contract = new SupplyChainTraceabilityContract(rawContract);
      const record = await contract.transferCustody(args);
      this.logger.log(`✅ Custody transferred for shipment ${args.shipmentId}: ${args.fromOrg} → ${args.toOrg}`);
      return { txStatus: BlockchainTxStatus.CONFIRMED, txId: record.transactionId };
    } catch (err) {
      this.logger.error(`Failed to transfer custody: ${(err as Error).message}`);
      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Record a checkpoint event (location, temperature, status).
   */
  async recordCheckpoint(args: SupplyChainArgs['checkpoint']): Promise<{ txStatus: BlockchainTxStatus }> {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.SUPPLY_CHAIN);
    if (!rawContract) return { txStatus: BlockchainTxStatus.PENDING };

    try {
      const contract = new SupplyChainTraceabilityContract(rawContract);
      await contract.recordCheckpoint(args);
      return { txStatus: BlockchainTxStatus.CONFIRMED };
    } catch (err) {
      this.logger.error(`Failed to record checkpoint: ${(err as Error).message}`);
      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Get the full provenance chain for a product/batch.
   */
  async getProvenance(
    tenantId: string,
    productId: string,
    batchId?: string,
  ): Promise<OnChainRecord[]> {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.SUPPLY_CHAIN);
    if (!rawContract) return [];

    try {
      const contract = new SupplyChainTraceabilityContract(rawContract);
      return await contract.verifyProvenance(tenantId, productId, batchId);
    } catch (err) {
      this.logger.error(`Failed to get provenance: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * Issue a product recall across the supply chain.
   */
  async issueRecall(args: SupplyChainArgs['recall']): Promise<{ txStatus: BlockchainTxStatus; txId?: string; affectedShipments?: unknown[] }> {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.SUPPLY_CHAIN);
    if (!rawContract) {
      this.logger.warn(`Fabric unavailable — recall for batch ${args.batchId} deferred`);
      return { txStatus: BlockchainTxStatus.PENDING };
    }

    try {
      const contract = new SupplyChainTraceabilityContract(rawContract);
      const record = await contract.issueRecall(args);
      this.logger.warn(`🚨 RECALL issued: Batch ${args.batchId} — ${args.reason} (Severity: ${args.severity})`);
      return {
        txStatus: BlockchainTxStatus.CONFIRMED,
        txId: record.transactionId,
      };
    } catch (err) {
      this.logger.error(`Failed to issue recall: ${(err as Error).message}`);
      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }
}
