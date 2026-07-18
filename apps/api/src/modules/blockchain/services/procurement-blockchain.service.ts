import { Injectable, Logger } from '@nestjs/common';
import { FabricGatewayProvider } from '../providers/fabric-gateway.provider';
import {
  ProcurementLifecycleContract,
  FABRIC_CHAINCODES,
} from '@unerp/blockchain';

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
