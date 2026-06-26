import { Controller, Get, Post, Body, Param, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { SsoService } from './sso.service';

const AUTH_COOKIE = 'auth_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
};

@Controller('auth/sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Post('saml/callback/:tenantSlug')
  @HttpCode(HttpStatus.OK)
  async samlCallback(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: Record<string, unknown>,
    @Res({ passthrough: true }) res: Response,
  ) {
    // In production: validate SAML assertion XML using passport-saml
    // For now: extract profile from the body (test IdP sends JSON)
    const profile = {
      email: (body.email || body.nameId || body.Email) as string,
      firstName: (body.firstName || body.FirstName || body.givenName) as string | undefined,
      lastName: (body.lastName || body.LastName || body.surname) as string | undefined,
      nameId: body.nameId as string | undefined,
      provider: 'SAML' as const,
    };

    if (!profile.email) {
      return { error: 'Missing email in SAML assertion' };
    }

    const result = await this.ssoService.processSsoLogin(tenantSlug, profile);
    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);
    return result;
  }

  @Post('oidc/callback/:tenantSlug')
  @HttpCode(HttpStatus.OK)
  async oidcCallback(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: { code: string; redirectUri: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    // In production: exchange code for tokens using openid-client
    // For now: extract profile from body (test flow)
    const profile = {
      email: (body as any).email as string,
      firstName: (body as any).firstName as string | undefined,
      lastName: (body as any).lastName as string | undefined,
      provider: 'OIDC' as const,
    };

    if (!profile.email) {
      return { error: 'Missing email in OIDC token' };
    }

    const result = await this.ssoService.processSsoLogin(tenantSlug, profile);
    res.cookie(AUTH_COOKIE, result.token, COOKIE_OPTIONS);
    return result;
  }

  @Get('config/:tenantSlug')
  async getSsoConfig(@Param('tenantSlug') tenantSlug: string) {
    // Public endpoint — returns SSO entry points for the login page
    const tenant = await (await import('@unerp/database')).prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) return { configured: false };

    const config = await this.ssoService.getSsoConfig(tenant.id);
    if (!config) return { configured: false };

    return {
      configured: true,
      samlEntryPoint: config.samlEntryPoint || null,
      oidcAuthorizationUrl: config.oidcAuthorizationUrl || null,
      oidcClientId: config.oidcClientId || null,
    };
  }
}
