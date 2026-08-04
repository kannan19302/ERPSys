import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { SandboxRunner } from "@unerp/sandbox";
import * as fs from "fs";

@Injectable()
export class ExtensionRegistryService {
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

    // Simulate installation hook
    await this.sandboxRunner.execute(code, {
      tenantId,
      api: {
        log: (msg) => console.log(`API Log from extension: ${msg}`),
      },
    });

    return { success: true, message: `Extension ${extensionId} installed` };
  }

  async enableExtension(tenantId: string, extensionId: string) {
    return { success: true, message: `Extension ${extensionId} enabled` };
  }
}
