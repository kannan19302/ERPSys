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

@Controller("extensions")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ExtensionRegistryController {
  constructor(private readonly registryService: ExtensionRegistryService) {}

  @Get()
  @Permissions("admin.extensions.read")
  async listExtensions(@Req() req) {
    return this.registryService.listInstalled(req.user.tenantId);
  }

  @Post(":id/install")
  @Permissions("admin.extensions.manage")
  async installExtension(
    @Req() req,
    @Param("id") extensionId: string,
    @Body("codeUrl") codeUrl: string,
  ) {
    return this.registryService.installExtension(
      req.user.tenantId,
      extensionId,
      codeUrl,
    );
  }

  @Post(":id/enable")
  @Permissions("admin.extensions.manage")
  async enableExtension(@Req() req, @Param("id") extensionId: string) {
    return this.registryService.enableExtension(req.user.tenantId, extensionId);
  }
}
