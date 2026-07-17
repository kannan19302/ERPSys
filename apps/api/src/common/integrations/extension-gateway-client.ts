export interface ExtensionServiceEndpoint {
  appSlug: string;
  baseUrl: string;
  scopes: string[];
  timeoutMs: number;
  healthcheck: string;
}

/** Narrow extension-runtime capability used by the marketplace lifecycle. */
export abstract class ExtensionGatewayClient {
  abstract healthCheck(service: ExtensionServiceEndpoint): Promise<boolean>;

  abstract invalidate(tenantId: string, appSlug: string): void;
}
