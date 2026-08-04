import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { SandboxRunner } from "@unerp/sandbox";
import * as fs from "fs";

@Injectable()
export class ExtensionRegistryService {
  private readonly logger = new Logger(ExtensionRegistryService.name);
  private sandboxRunner = new SandboxRunner();

  async listInstalled(tenantId: string) {
    // Mocked for phase 4: in a real system this would query a TenantExtension table
    return [{ id: "real-estate", status: "installed", name: "Real Estate" }];
  }

  async installExtension(
    tenantId: string,
    extensionId: string,
    codeUrl: string,
  ) {
    // In Phase 4, we simulate fetching the extension code from the local file system (codeUrl)
    const code = fs.readFileSync(codeUrl, "utf8");

    // Simulate installation hook.
    //
    // `trustedFirstParty` must be declared explicitly because SandboxRunner is
    // built on node:vm, which is not an isolation boundary (ADR-009). It is
    // asserted here only because Phase 4 loads first-party extension bundles
    // from the local filesystem. This call MUST become an isolated-vm
    // capability sandbox before any third-party or customer-authored extension
    // is installed — see PLATFORM_ARCHITECTURE § 8.3.
    await this.sandboxRunner.execute(
      code,
      {
        tenantId,
        api: {
          log: (message: string) =>
            this.logger.log(`[extension:${extensionId}] ${message}`),
        },
      },
      { trustedFirstParty: true, timeoutMs: 2000 },
    );

    return { success: true, message: `Extension ${extensionId} installed` };
  }

  async enableExtension(tenantId: string, extensionId: string) {
    return { success: true, message: `Extension ${extensionId} enabled` };
  }
}
