import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SsoConfigService } from "./sso-config.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createSsoConfigSchema = z.object({
  provider: z.enum(["google", "microsoft", "okta", "auth0", "saml", "oidc", "github", "gitlab"]),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  issuerUrl: z.string().url().optional(),
  authorizeUrl: z.string().url().optional(),
  tokenUrl: z.string().url().optional(),
  userInfoUrl: z.string().url().optional(),
  jwksUri: z.string().url().optional(),
  scopes: z.array(z.string()).default(["openid", "email", "profile"]),
  domains: z.array(z.string()).optional(),
  autoProvision: z.boolean().default(false),
  defaultRole: z.string().optional(),
  metadataUrl: z.string().url().optional(),
  certificate: z.string().optional(),
  enforced: z.boolean().default(false),
});

const updateSsoConfigSchema = createSsoConfigSchema.partial();

@ApiTags("saas-sso")
@ApiBearerAuth()
@Controller("saas/sso")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SsoConfigController {
  constructor(private readonly ssoConfigService: SsoConfigService) {}

  @ApiOperation({ summary: "Get SSO configuration" })
  @Permissions("saas.sso.read")
  @Get()
  async getSsoConfig(@Req() req: AuthReq) {
    return this.ssoConfigService.getSsoConfig(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create SSO configuration" })
  @Permissions("saas.sso.create")
  @Post()
  async createSsoConfig(@Req() req: AuthReq, @ZodBody(createSsoConfigSchema) body: z.infer<typeof createSsoConfigSchema>) {
    return this.ssoConfigService.createSsoConfig(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update SSO configuration" })
  @Permissions("saas.sso.create")
  @Put()
  async updateSsoConfig(@Req() req: AuthReq, @ZodBody(updateSsoConfigSchema) body: z.infer<typeof updateSsoConfigSchema>) {
    return this.ssoConfigService.updateSsoConfig(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Delete SSO configuration" })
  @Permissions("saas.sso.delete")
  @Delete()
  async deleteSsoConfig(@Req() req: AuthReq) {
    return this.ssoConfigService.deleteSsoConfig(req.user.tenantId);
  }

  @ApiOperation({ summary: "Toggle SSO" })
  @Permissions("saas.sso.create")
  @Patch("toggle")
  async toggleSso(@Req() req: AuthReq) {
    return this.ssoConfigService.toggleSso(req.user.tenantId);
  }

  @ApiOperation({ summary: "Test SSO connection" })
  @Permissions("saas.sso.read")
  @Post("test")
  async testSsoConnection(@Req() req: AuthReq) {
    return this.ssoConfigService.testSsoConnection(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get SSO login URL" })
  @Permissions("saas.sso.read")
  @Get("login-url")
  async getSsoLoginUrl(@Req() req: AuthReq) {
    return this.ssoConfigService.getSsoLoginUrl(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get supported providers" })
  @Permissions("saas.sso.read")
  @Get("providers")
  async getSupportedProviders() {
    return this.ssoConfigService.getSupportedProviders();
  }
}
