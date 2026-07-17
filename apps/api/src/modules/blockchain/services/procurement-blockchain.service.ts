/**
 * ProcurementBlockchainService
 *
 * Anchors PO lifecycle events on the Fabric procurement-lifecycle chaincode.
 * Provides automated 3-way match verification.
 */

import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  ProcurementLifecycleContract,
  BlockchainTxStatus,
  BlockchainEntityType,
  FABRIC_CHAINCODES,
} from '@unerp/blockchain';
import type { ProcurementArgs } from '@unerp/blockchain';

@Injectable()
export class ProcurementBlockchainService {
  private readonly logger = new Logger(ProcurementBlockchainService.name);

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
  ) {}

  private getContract(): ProcurementLifecycleContract | null {
    const rawContract = this.fabricGateway.getContract(FABRIC_CHAINCODES.PROCUREMENT);
    if (!rawContract) return null;
    return new ProcurementLifecycleContract(rawContract);
  }

  /**
   * Record a new PO on the blockchain.
   * Called after PO is created and approved in PostgreSQL.
   */
  async recordPurchaseOrder(
    args: ProcurementArgs['purchaseOrder'],
  ): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    await prisma.blockchainTransaction.create({
      data: {
        tenantId: args.tenantId,
        entityType: BlockchainEntityType.PURCHASE_ORDER,
        entityId: args.poId,
        channelName: 'procurement-channel',
        chaincodeName: FABRIC_CHAINCODES.PROCUREMENT,
        dataHash: args.poId,
        status: BlockchainTxStatus.PENDING,
      },
    });

    const contract = this.getContract();
    if (!contract) return { txStatus: BlockchainTxStatus.PENDING };

    try {
      const record = await contract.createPurchaseOrder(args);
      this.logger.log(`✅ PO ${args.poId} recorded on-chain (tx: ${record.transactionId})`);
      return { txStatus: BlockchainTxStatus.CONFIRMED, txId: record.transactionId };
    } catch (err) {
      this.logger.error(`Failed to record PO ${args.poId}: ${(err as Error).message}`);
      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Record vendor acceptance of PO.
   */
  async recordVendorAcceptance(
    args: ProcurementArgs['vendorAcceptance'],
  ): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    const contract = this.getContract();
    if (!contract) return { txStatus: BlockchainTxStatus.PENDING };

    try {
      const record = await contract.acceptPurchaseOrder(args);
      this.logger.log(`✅ PO ${args.poId} vendor acceptance recorded`);
      return { txStatus: BlockchainTxStatus.CONFIRMED, txId: record.transactionId };
    } catch (err) {
      this.logger.error(`Failed to record vendor acceptance: ${(err as Error).message}`);
      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Record goods receipt against a PO.
   */
  async recordGoodsReceipt(
    args: ProcurementArgs['goodsReceipt'],
  ): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    const contract = this.getContract();
    if (!contract) return { txStatus: BlockchainTxStatus.PENDING };

    try {
      const record = await contract.confirmGoodsReceipt(args);
      this.logger.log(`✅ PO ${args.poId} goods receipt recorded`);
      return { txStatus: BlockchainTxStatus.CONFIRMED, txId: record.transactionId };
    } catch (err) {
      this.logger.error(`Failed to record goods receipt: ${(err as Error).message}`);
      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Record a vendor invoice submission.
   */
  async recordInvoiceSubmission(
    args: ProcurementArgs['invoice'],
  ): Promise<{ txStatus: BlockchainTxStatus; txId?: string }> {
    const contract = this.getContract();
    if (!contract) return { txStatus: BlockchainTxStatus.PENDING };

    try {
      const record = await contract.submitInvoice(args);
      this.logger.log(`✅ Invoice for PO ${args.poId} recorded`);
      return { txStatus: BlockchainTxStatus.CONFIRMED, txId: record.transactionId };
    } catch (err) {
      this.logger.error(`Failed to record invoice: ${(err as Error).message}`);
      return { txStatus: BlockchainTxStatus.FAILED };
    }
  }

  /**
   * Execute automated 3-way match on the blockchain.
   * Returns whether payment is authorized and the match result.
   */
  async executeThreeWayMatch(
    tenantId: string,
    poId: string,
  ): Promise<{
    matched: boolean;
    matchResult: 'FULL_MATCH' | 'PARTIAL_MATCH' | 'MISMATCH';
    details: string;
    paymentAuthorized: boolean;
    txId?: string;
  }> {
    const contract = this.getContract();
    if (!contract) {
      return {
        matched: false,
        matchResult: 'MISMATCH',
        details: 'Blockchain network unavailable — manual review required',
        paymentAuthorized: false,
      };
    }

    try {
      const result = await contract.executeThreeWayMatch(tenantId, poId);
      this.logger.log(
        `3-Way Match for PO ${poId}: ${result.matchResult} — Payment Authorized: ${result.paymentAuthorized}`,
      );
      return result;
    } catch (err) {
      this.logger.error(`3-Way match failed for PO ${poId}: ${(err as Error).message}`);
      return {
        matched: false,
        matchResult: 'MISMATCH',
        details: `Blockchain error: ${(err as Error).message}`,
        paymentAuthorized: false,
      };
    }
  }

  /**
   * Get the full PO blockchain history.
   */
  async getPurchaseOrderHistory(tenantId: string, poId: string) {
    const contract = this.getContract();
    if (!contract) return [];

    try {
      return await contract.getPurchaseOrderHistory(tenantId, poId);
    } catch (err) {
      this.logger.error(`Failed to get PO history: ${(err as Error).message}`);
      return [];
    }
  }
}
