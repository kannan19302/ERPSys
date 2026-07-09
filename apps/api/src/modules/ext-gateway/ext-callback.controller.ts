import { Controller, Get, Param, Req, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { prisma } from '@unerp/database';
import { verifyTenantToken, TENANT_TOKEN_HEADER } from '@unerp/service-kit';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Callback API for extension services that need core-resident data (their
 * app's provisioned CustomRecords). Authenticated by the tenant-context token
 * the service received from the gateway (echoed back within its TTL) — no
 * user JWT, no cookies.
 */
@ApiTags('ext-callback')
@Controller('ext-callback')
export class ExtCallbackController {
  @ApiOperation({ summary: "Read an extension app's provisioned records by schema slug" })
  @Get('records/:slug')
  async records(@Req() req: Request, @Param('slug') slug: string) {
    const secret = process.env.EXT_SERVICE_JWT_SECRET;
    if (!secret) throw new UnauthorizedException('Extension gateway is not configured');
    let claims;
    try {
      claims = verifyTenantToken(String(req.headers[TENANT_TOKEN_HEADER] || ''), secret);
    } catch (e: any) {
      throw new UnauthorizedException(e?.message || 'Invalid tenant token');
    }
    // A service may only read schemas belonging to its own app (slug prefix).
    if (!slug.startsWith(`${claims.appSlug}_`) && slug !== claims.appSlug) {
      throw new ForbiddenException(`Token for "${claims.appSlug}" cannot read schema "${slug}"`);
    }

    const schema = await prisma.schemaRegistry.findUnique({
      where: { tenantId_slug: { tenantId: claims.tenantId, slug } },
      select: { id: true },
    });
    if (!schema) return [];
    const rows = await prisma.customRecord.findMany({
      where: { tenantId: claims.tenantId, schemaId: schema.id },
      select: { id: true, data: true, createdAt: true },
    });
    return rows.map((r) => ({ _id: r.id, _createdAt: r.createdAt, ...((r.data || {}) as any) }));
  }
}
