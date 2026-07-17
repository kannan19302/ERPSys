import { Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { prisma } from '@unerp/database';
import { verifyTenantToken, decodeTokenUnverified, TENANT_TOKEN_HEADER, TenantContextClaims } from '@unerp/service-kit';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { secretForApp } from './ext-secret.util';

/**
 * Callback API for extension services that need core-resident data (their app's
 * provisioned CustomRecords). Authenticated by the tenant-context token the
 * service received from the gateway (echoed back within its TTL) — no user JWT,
 * no cookies. Reads are scoped to the app's own schemas; writes additionally
 * require a `<slug>:write` scope in the token (#9, #10).
 */
@ApiTags('ext-callback')
@Controller('ext-callback')
export class ExtCallbackController {
  /** Verify the echoed tenant token using the app's own secret (#2). */
  private authorize(req: Request): TenantContextClaims {
    const raw = String(req.headers[TENANT_TOKEN_HEADER] || '');
    const peek = decodeTokenUnverified(raw);
    if (!peek?.appSlug) throw new UnauthorizedException('Missing or malformed tenant token');
    try {
      return verifyTenantToken(raw, secretForApp(peek.appSlug), { expectedAppSlug: peek.appSlug });
    } catch (e: any) {
      throw new UnauthorizedException(e?.message || 'Invalid tenant token');
    }
  }

  private assertOwnSchema(claims: TenantContextClaims, slug: string) {
    if (!slug.startsWith(`${claims.appSlug}_`) && slug !== claims.appSlug) {
      throw new ForbiddenException(`Token for "${claims.appSlug}" cannot access schema "${slug}"`);
    }
  }

  private async loadRecords(tenantId: string, slug: string, where?: Record<string, unknown>, limit?: number) {
    const schema = await prisma.schemaRegistry.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      select: { id: true },
    });
    if (!schema) return [];
    const rows = await prisma.customRecord.findMany({
      where: {
        tenantId,
        schemaId: schema.id,
        // Equality filters on JSON data fields (Prisma JSON path filter).
        ...(where && Object.keys(where).length
          ? { AND: Object.entries(where).map(([k, v]) => ({ data: { path: [k], equals: v as any } })) }
          : {}),
      },
      select: { id: true, data: true, createdAt: true },
      ...(limit ? { take: Math.min(Math.max(1, limit), 500) } : {}),
    });
    return rows.map((r) => ({ _id: r.id, _createdAt: r.createdAt, ...((r.data || {}) as any) }));
  }

  @ApiOperation({ summary: "Read an extension app's provisioned records (optional equality filters)" })
  @Get('records/:slug')
  async records(@Req() req: Request, @Param('slug') slug: string, @Query('where') whereRaw?: string, @Query('limit') limitRaw?: string) {
    const claims = this.authorize(req);
    this.assertOwnSchema(claims, slug);
    let where: Record<string, unknown> | undefined;
    if (whereRaw) {
      try { where = JSON.parse(whereRaw); } catch { throw new BadRequestException('`where` must be JSON'); }
    }
    return this.loadRecords(claims.tenantId, slug, where, limitRaw ? Number(limitRaw) : undefined);
  }

  @ApiOperation({ summary: 'Read several schemas in one round trip' })
  @Post('records:batch')
  async batch(@Req() req: Request, @Body() body: { slugs?: string[] }) {
    const claims = this.authorize(req);
    const slugs = Array.isArray(body?.slugs) ? body.slugs : [];
    const out: Record<string, any[]> = {};
    for (const slug of slugs) {
      this.assertOwnSchema(claims, slug);
      out[slug] = await this.loadRecords(claims.tenantId, slug);
    }
    return out;
  }

  @ApiOperation({ summary: "Create a record in the app's provisioned schema (requires <slug>:write scope)" })
  @Post('records/:slug')
  async create(@Req() req: Request, @Param('slug') slug: string, @Body() body: { data?: Record<string, unknown> }) {
    const claims = this.authorize(req);
    this.assertOwnSchema(claims, slug);
    if (!claims.scopes?.includes(`${claims.appSlug}:write`)) {
      throw new ForbiddenException(`Token lacks the "${claims.appSlug}:write" scope`);
    }
    const schema = await prisma.schemaRegistry.findUnique({
      where: { tenantId_slug: { tenantId: claims.tenantId, slug } },
      select: { id: true },
    });
    if (!schema) throw new BadRequestException(`Schema "${slug}" is not provisioned for this tenant`);
    const rec = await prisma.customRecord.create({
      data: { tenantId: claims.tenantId, schemaId: schema.id, data: (body?.data || {}) as any },
      select: { id: true, data: true, createdAt: true },
    });
    return { _id: rec.id, _createdAt: rec.createdAt, ...((rec.data || {}) as any) };
  }
}
