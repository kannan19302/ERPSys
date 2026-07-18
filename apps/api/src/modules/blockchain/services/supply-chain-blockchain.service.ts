import { Injectable, Logger } from '@nestjs/common';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  SupplyChainTraceabilityContract,
  BlockchainTxStatus,
  FABRIC_CHAINCODES,
} from '@unerp/blockchain';
import type { SupplyChainArgs, OnChainRecord } from '@unerp/blockchain';

@Injectable()
export class SupplyChainBlockchainService {
  private readonly logger = new Logger(SupplyChainBlockchainService.name);

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
  ) {}

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

  async issueRecall(args: SupplyChainArgs['recall']): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.SUPPLY_CHAIN);
    if (!rawContract) {
      this.logger.warn(`Fabric unavailable — recall for batch ${args.batchId} deferred`);
      return { txStatus: BlockchainTxStatus.PENDING };
    }

    try {
      const contract = new SupplyChainTraceabilityContract(rawContract);
      const record = await contract.issueRecall(args);
      this.logger.warn(`RECALL issued: Batch ${args.batchId} — ${args.reason} (Severity: ${args.severity})`);
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
