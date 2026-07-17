/**
 * FabricGatewayProvider
 *
 * NestJS injectable wrapper around FabricConnectionService.
 * Acts as the singleton Fabric Gateway connection for the entire app.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { FabricConnectionService, CHAINCODE_CHANNEL_MAP } from '@unerp/blockchain';
import type { FabricConnectionConfig } from '@unerp/blockchain';
import { Contract, Network } from '@hyperledger/fabric-gateway';

@Injectable()
export class FabricGatewayProvider {
  private readonly logger = new Logger(FabricGatewayProvider.name);
  private readonly connectionService: FabricConnectionService;
  private readonly isEnabled = process.env['BLOCKCHAIN_ENABLED'] === 'true';

  constructor() {
    const config = this.buildConfig();
    this.connectionService = new FabricConnectionService(config);
  }

  async connect(): Promise<void> {
    await this.connectionService.connect();
  }

  async disconnect(): Promise<void> {
    await this.connectionService.disconnect();
  }

  isConnected(): boolean {
    if (!this.isEnabled) return false;
    return this.connectionService.isConnected();
  }

  /**
   * Get a Network (channel) handle.
   * Returns null if blockchain is disabled or Fabric is unavailable.
   */
  getNetwork(channelName: string): Network | null {
    if (!this.isEnabled || !this.isConnected()) return null;
    try {
      return this.connectionService.getNetwork(channelName);
    } catch (err) {
      this.logger.warn(`Failed to get network ${channelName}: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Get a typed contract handle.
   * Returns null if blockchain is disabled or Fabric is unavailable.
   */
  getContract(chaincodeName: string): Contract | null {
    if (!this.isEnabled || !this.isConnected()) return null;
    try {
      const channelName = CHAINCODE_CHANNEL_MAP[chaincodeName as keyof typeof CHAINCODE_CHANNEL_MAP];
      if (!channelName) {
        this.logger.warn(`Unknown chaincode: ${chaincodeName}`);
        return null;
      }
      return this.connectionService.getContract(chaincodeName, channelName);
    } catch (err) {
      this.logger.warn(`Failed to get contract ${chaincodeName}: ${(err as Error).message}`);
      return null;
    }
  }

  private buildConfig(): FabricConnectionConfig {
    // If running in local dev with test network
    if (process.env['FABRIC_USE_TEST_NETWORK'] === 'true') {
      const cryptoPath = path.resolve(
        __dirname,
        '../../../../packages/blockchain/network/crypto-config',
      );
      return FabricConnectionService.forLocalTestNetwork(cryptoPath);
    }

    // Production: read from env vars
    return FabricConnectionService.fromEnv();
  }
}
