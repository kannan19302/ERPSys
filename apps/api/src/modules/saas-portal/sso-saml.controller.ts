import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasPortalSsoSamlDeepService } from "./sso-saml.service";

@ApiTags("SaasPortalSsoSamlDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas-portal/sso-saml-deep")
export class SaasPortalSsoSamlDeepController {
  constructor(private readonly ssoService: SaasPortalSsoSamlDeepService) {}

  @ApiOperation({ summary: "Get portal SSO / SAML configurations" })
  @Permissions("saas_portal.sso.read")
  @Get("configs")
  async getSsoConfigs(@Req() req: any) {
    return this.ssoService.getSsoConfigs(req.user.tenantId);
  }

  @ApiOperation({ summary: "Configure portal SSO / SAML provider" })
  @Permissions("saas_portal.sso.update")
  @Post("configs")
  async configureSso(@Req() req: any, @Body() dto: any) {
    return this.ssoService.configureSso(req.user.tenantId, dto);
  }
}
