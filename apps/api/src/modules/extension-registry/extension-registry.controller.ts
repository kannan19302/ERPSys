import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ExtensionRegistryService } from "./extension-registry.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import type { Scope } from "@unerp/extension-api";

@Controller("extensions")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ExtensionRegistryController {
  constructor(private readonly registryService: ExtensionRegistryService) {}

  @Get()
  @Permissions("admin.extensions.read")
  async listExtensions(@Req() req) {
    return this.registryService.listInstalled(req.user.tenantId);
  }

  /**
   * Install from a signed manifest. The effective grant is the intersection of
   * the manifest's requested scopes with the scopes the acting admin holds
   * (§ 5.2), so the installer's own permissions are read from the session and
   * never accepted from the request body — a body-supplied scope list would let
   * an admin grant an extension more than they have.
   */
  @Post("install")
  @Permissions("admin.extensions.manage")
  async installExtension(
    @Req() req,
    @Body("manifest") manifest: unknown,
    @Body("approvedHosts") approvedHosts?: string[],
  ) {
    return this.registryService.installExtension({
      tenantId: req.user.tenantId,
      manifest,
      installerScopes: this.installerScopes(req),
      installedByUserId: req.user.id ?? req.user.sub,
      approvedHosts,
    });
  }

  @Post(":id/enable")
  @Permissions("admin.extensions.manage")
  async enableExtension(@Req() req, @Param("id") extensionId: string) {
    return this.registryService.setStatus(
      req.user.tenantId,
      extensionId,
      "ENABLED",
    );
  }

  @Post(":id/disable")
  @Permissions("admin.extensions.manage")
  async disableExtension(@Req() req, @Param("id") extensionId: string) {
    return this.registryService.setStatus(
      req.user.tenantId,
      extensionId,
      "DISABLED",
    );
  }

  @Post(":id/uninstall")
  @Permissions("admin.extensions.manage")
  async uninstallExtension(@Req() req, @Param("id") extensionId: string) {
    return this.registryService.uninstall(req.user.tenantId, extensionId);
  }

  /**
   * Derive the acting admin's capability scopes from their permissions.
   *
   * An extension scope is only offered if the admin holds the corresponding
   * platform permission, so the intersection in § 5.2 is computed against
   * something the session actually proves rather than against a claim.
   */
  private installerScopes(req: { user?: { permissions?: string[] } }): Scope[] {
    const held = new Set(req.user?.permissions ?? []);
    const has = (code: string) => held.has(code);
    const scopes: Scope[] = ["log:write"];
    if (has("admin.extensions.read") || has("admin.data.read"))
      scopes.push("data:read");
    if (has("admin.data.write")) scopes.push("data:write");
    if (has("admin.integrations.manage")) scopes.push("http:fetch");
    if (has("admin.automation.create")) scopes.push("jobs:schedule");
    if (has("admin.outbox.read")) scopes.push("events:subscribe");
    return scopes;
  }
}
