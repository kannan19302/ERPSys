/**
 * @unerp/sdk — L1 TypeScript client SDK.
 * Generated from @unerp/contracts (L0). Never hand-written.
 * See PLATFORM_ARCHITECTURE.md § 7.3.
 */
import type {
  ProvisionTenantRequest,
  ProvisionTenantResponse,
  ApiResponse,
} from "@unerp/contracts";

/**
 * Public rendering payloads.
 *
 * `unknown` rather than `any`: this is a published package that third parties
 * compile against, and `any` would silently disable checking in *their* code,
 * not just ours. Once the corresponding response schemas exist in
 * `@unerp/contracts` these become generated `z.infer` types and stop being
 * hand-written at all (PLATFORM_ARCHITECTURE § 7.3 — the SDK is generated,
 * never authored).
 */
export interface PublicPageData {
  page: unknown;
  settings: unknown;
}

export interface PublicSiteData {
  site: unknown;
  page: unknown;
  chatbot: unknown;
}

export interface SdkConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  tenantId?: string;
}

export class UniERPClient {
  constructor(private readonly config: SdkConfig) {}

  private async request<T>(
    path: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.config.accessToken
          ? { Authorization: `Bearer ${this.config.accessToken}` }
          : {}),
        ...(this.config.apiKey ? { "X-Api-Key": this.config.apiKey } : {}),
        ...options?.headers,
      },
    });
    return res.json() as Promise<ApiResponse<T>>;
  }

  // Platform (control-plane) endpoints
  platform = {
    provisionTenant: (data: ProvisionTenantRequest) =>
      this.request<ProvisionTenantResponse>("/api/platform/v1/tenants", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  // Public endpoints for website rendering
  public = {
    getPage: (slug: string) =>
      this.request<PublicPageData>(`/api/v1/public/pages/${slug}`, {
        method: "GET",
      }),
    getSitePage: (host: string, path: string) =>
      this.request<PublicSiteData>(
        `/api/v1/public/sites/${host}/pages?path=${encodeURIComponent(path)}`,
        { method: "GET" },
      ),
  };
}
