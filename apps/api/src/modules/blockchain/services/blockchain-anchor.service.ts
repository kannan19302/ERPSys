import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  DocumentRegistryContract,
  FinanceLedgerContract,
  SupplyChainTraceabilityContract,
  ProcurementLifecycleContract,
  computePayloadHash,
  BlockchainTxStatus,
  FABRIC_CHAINCODES,
} from '@unerp/blockchain';

export interface BlockchainAnchorEvent {
  tenantId: string;
  entityType: string;
  entityId: string;
  chaincodeName: string;
  channelName: string;
  payload: Record<string, unknown>;
  eventName: string;
}

function getChaincodeForEvent(eventName: string): string {
  if (eventName.startsWith('finance.')) return FABRIC_CHAINCODES.FINANCE_LEDGER;
  if (eventName.startsWith('document.')) return FABRIC_CHAINCODES.DOCUMENT_REGISTRY;
  if (eventName.startsWith('supplychain.')) return FABRIC_CHAINCODES.SUPPLY_CHAIN;
  if (eventName.startsWith('procurement.')) return FABRIC_CHAINCODES.PROCUREMENT;
  return FABRIC_CHAINCODES.DOCUMENT_REGISTRY;
}

function getChannelForChaincode(chaincodeName: string): string {
  const map: Record<string, string> = {
    [FABRIC_CHAINCODES.DOCUMENT_REGISTRY]: 'unerp-channel',
    [FABRIC_CHAINCODES.FINANCE_LEDGER]: 'unerp-channel',
    [FABRIC_CHAINCODES.SUPPLY_CHAIN]: 'supplychain-channel',
    [FABRIC_CHAINCODES.PROCUREMENT]: 'procurement-channel',
  };
  return map[chaincodeName] ?? 'unerp-channel';
}

@Injectable()
export class BlockchainAnchorService {
  private readonly logger = new Logger(BlockchainAnchorService.name);

  constructor(
    private readonly fabricGateway: FabricGatewayProvider,
  ) {}

  async anchorEvent(event: BlockchainAnchorEvent): Promise<{ status: string; transactionId?: string }> {
    const dataHash = computePayloadHash(event.payload);
    const chaincodeName = event.chaincodeName || getChaincodeForEvent(event.eventName);
    const channelName = event.channelName || getChannelForChaincode(chaincodeName);

    const existing = await prisma.blockchainTransaction.findFirst({
      where: {
        tenantId: event.tenantId,
        entityType: event.entityType,
        entityId: event.entityId,
        status: BlockchainTxStatus.CONFIRMED,
      },
    });

    if (existing) {
      this.logger.debug(`Blockchain record already confirmed for ${event.entityType}:${event.entityId}, skipping`);
      return { status: BlockchainTxStatus.CONFIRMED, transactionId: existing.transactionId ?? undefined };
    }

    const pendingTx = await prisma.blockchainTransaction.create({
      data: {
        tenantId: event.tenantId,
        entityType: event.entityType,
        entityId: event.entityId,
        channelName,
        chaincodeName,
        dataHash,
        status: BlockchainTxStatus.PENDING,
      },
    });

    try {
      const submitResult = await this.submitToFabric(event, dataHash, chaincodeName);
      await prisma.blockchainTransaction.update({
        where: { id: pendingTx.id },
        data: {
          status: BlockchainTxStatus.CONFIRMED,
          transactionId: submitResult.transactionId,
          blockNumber: String(submitResult.blockNumber),
          confirmedAt: new Date(),
        },
      });
      this.logger.log(`Anchored ${event.entityType}:${event.entityId} on Fabric (tx: ${submitResult.transactionId})`);
      return { status: BlockchainTxStatus.CONFIRMED, transactionId: submitResult.transactionId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown Fabric error';
      this.logger.error(`Fabric submission failed for ${event.entityType}:${event.entityId}: ${errorMessage}`);
      await prisma.blockchainTransaction.update({
        where: { id: pendingTx.id },
        data: {
          status: BlockchainTxStatus.FAILED,
          errorMessage,
          retryCount: { increment: 1 },
        },
      });
      throw err;
    }
  }

  async submitToFabric(
    event: BlockchainAnchorEvent,
    dataHash: string,
    chaincodeName?: string,
  ): Promise<{ transactionId: string; blockNumber: bigint }> {
    const ccName = chaincodeName || getChaincodeForEvent(event.eventName);
    const rawContract = this.fabricGateway.getContract(ccName);

    if (!rawContract) {
      throw new Error(`Fabric gateway not connected or chaincode ${ccName} unavailable`);
    }

    const eventType = event.entityType || event.eventName.split('.').pop() || 'unknown';

    switch (ccName) {
      case FABRIC_CHAINCODES.DOCUMENT_REGISTRY: {
        const contract = new DocumentRegistryContract(rawContract);
        const result = await contract.registerDocument({
          tenantId: event.tenantId,
          documentId: event.entityId,
          documentHash: dataHash,
          documentType: eventType,
          fileName: (event.payload['fileName'] as string) ?? event.entityId,
          fileSize: (event.payload['fileSize'] as number) ?? 0,
          mimeType: (event.payload['mimeType'] as string) ?? 'application/octet-stream',
          uploadedBy: (event.payload['uploadedBy'] as string) ?? 'system',
          uploadedAt: (event.payload['uploadedAt'] as string) ?? new Date().toISOString(),
        });
        return { transactionId: result.transactionId, blockNumber: BigInt(result.blockNumber) };
      }

      case FABRIC_CHAINCODES.FINANCE_LEDGER: {
        const contract = new FinanceLedgerContract(rawContract);
        const result = await contract.recordJournalEntry({
          tenantId: event.tenantId,
          journalId: event.entityId,
          periodId: (event.payload['periodId'] as string) ?? '',
          dataHash,
          totalDebit: (event.payload['totalDebit'] as string) ?? '0',
          totalCredit: (event.payload['totalCredit'] as string) ?? '0',
          currency: (event.payload['currency'] as string) ?? 'USD',
          postedBy: (event.payload['postedBy'] as string) ?? 'system',
          postedAt: (event.payload['postedAt'] as string) ?? new Date().toISOString(),
          description: (event.payload['description'] as string) ?? '',
        });
        return { transactionId: result.transactionId, blockNumber: BigInt(result.blockNumber) };
      }

      case FABRIC_CHAINCODES.SUPPLY_CHAIN: {
        const contract = new SupplyChainTraceabilityContract(rawContract);
        const result = await contract.recordShipment({
          tenantId: event.tenantId,
          shipmentId: event.entityId,
          origin: {
            orgId: (event.payload['origin'] as any)?.orgId ?? '',
            location: (event.payload['origin'] as any)?.location ?? '',
            country: (event.payload['origin'] as any)?.country ?? '',
          },
          destination: {
            orgId: (event.payload['destination'] as any)?.orgId ?? '',
            location: (event.payload['destination'] as any)?.location ?? '',
            country: (event.payload['destination'] as any)?.country ?? '',
          },
          goods: ((event.payload['goods'] as any[]) ?? []).map((g: any) => ({
            productId: String(g.productId ?? ''),
            batchId: g.batchId ? String(g.batchId) : undefined,
            quantity: Number(g.quantity ?? 0),
            unit: String(g.unit ?? ''),
          })),
          expectedDelivery: (event.payload['expectedDelivery'] as string) ?? '',
          createdBy: (event.payload['createdBy'] as string) ?? 'system',
          createdAt: (event.payload['createdAt'] as string) ?? new Date().toISOString(),
        });
        return { transactionId: result.transactionId, blockNumber: BigInt(result.blockNumber) };
      }

      case FABRIC_CHAINCODES.PROCUREMENT: {
        const contract = new ProcurementLifecycleContract(rawContract);
        const result = await contract.createPurchaseOrder({
          tenantId: event.tenantId,
          poId: event.entityId,
          vendorId: (event.payload['vendorId'] as string) ?? '',
          buyerOrgId: (event.payload['buyerOrgId'] as string) ?? '',
          lines: ((event.payload['lines'] as any[]) ?? []).map((l: any) => ({
            lineId: String(l.lineId ?? ''),
            productId: String(l.productId ?? ''),
            quantity: Number(l.quantity ?? 0),
            unitPrice: String(l.unitPrice ?? '0'),
            unit: String(l.unit ?? ''),
          })),
          totalAmount: (event.payload['totalAmount'] as string) ?? '0',
          currency: (event.payload['currency'] as string) ?? 'USD',
          deliveryDate: (event.payload['deliveryDate'] as string) ?? '',
          terms: (event.payload['terms'] as string) ?? '',
          createdBy: (event.payload['createdBy'] as string) ?? 'system',
          createdAt: (event.payload['createdAt'] as string) ?? new Date().toISOString(),
        });
        return { transactionId: result.transactionId, blockNumber: BigInt(result.blockNumber) };
      }

      default:
        throw new Error(`Unknown chaincode: ${ccName}`);
    }
  }
}
