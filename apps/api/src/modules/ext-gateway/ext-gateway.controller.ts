import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ServiceRegistryService } from './service-registry.service';
import { TenantTokenService } from './tenant-token.service';
import { ExtProxyService } from './ext-proxy.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

/**
 * Gateway for out-of-process extension services (industry apps in their own
 * repos). Routes /api/v1/ext/<appSlug>/* to the app's registered service with
 * a signed tenant-context token. Gated on InstalledApp — uninstalling an app
 * makes its routes 404 on the next request, no restart needed.
 */
@ApiTags('ext-gateway')
@ApiBearerAuth()
@Controller('ext')
@UseGuards(JwtAuthGuard)
export class ExtGatewayController {
  constructor(
    private readonly registry: ServiceRegistryService,
    private readonly tokens: TenantTokenService,
    private readonly proxy: ExtProxyService,
  ) {}

  @ApiOperation({ summary: 'Proxy a request to an installed extension app service' })
  @All(':appSlug/*path')
  async proxyDeep(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    return this.handle(req, res);
  }

  @ApiOperation({ summary: 'Proxy a root request to an installed extension app service' })
  @All(':appSlug')
  async proxyRoot(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    return this.handle(req, res);
  }

  private async handle(req: AuthenticatedRequest, res: Response) {
    const appSlug = String(req.params.appSlug || '');
    const service = await this.registry.resolve(req.user.tenantId, appSlug);
    // Path on the service = everything after /ext/<slug> (query string re-attached by the proxy).
    const marker = `/ext/${appSlug}`;
    const full = req.path;
    const idx = full.indexOf(marker);
    const path = idx >= 0 ? full.slice(idx + marker.length) || '/' : '/';
    const tenantToken = this.tokens.sign({
      tenantId: req.user.tenantId,
      userId: req.user.userId,
      email: req.user.email,
      roles: req.user.roles || [],
      appSlug,
      scopes: service.scopes,
    });
    await this.proxy.forward({ req, res, service, path, tenantToken });
  }
}
