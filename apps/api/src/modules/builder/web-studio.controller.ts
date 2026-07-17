import { Controller, Get, Post, Patch, Put, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { Request } from 'express';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebStudioService } from './web-studio.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const pageSchema = z.object({
  id: z.string().optional(),
  path: z.string().min(1),
  title: z.string().min(1),
  type: z.string().optional(),
  blocks: z.any().optional(),
  seo: z.any().optional(),
  status: z.string().optional(),
});

/**
 * Authenticated Web Studio admin API — manage sites, custom domains, site
 * pages, and the per-site AI chatbot.
 */
@ApiTags('builder')
@ApiBearerAuth()
@Controller('builder/web-studio')
@UseGuards(JwtAuthGuard, RbacGuard)
export class WebStudioController {
  constructor(private readonly studio: WebStudioService) {}

  @ApiOperation({ summary: 'List sites' })
  @Permissions('builder.read')
  @Get('sites')
  listSites(@Req() req: AuthenticatedRequest) {
    return this.studio.listSites(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get site' })
  @Permissions('builder.read')
  @Get('sites/:id')
  getSite(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.studio.getSite(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create site' })
  @Permissions('builder.create')
  @Post('sites')
  createSite(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string().min(1), slug: z.string().optional(), theme: z.any().optional(), settings: z.any().optional() }))
    body: { name: string; slug?: string; theme?: unknown; settings?: unknown },
  ) {
    return this.studio.createSite(req.user.tenantId, body as any, req.user.userId);
  }

  @ApiOperation({ summary: 'Update site' })
  @Permissions('builder.update')
  @Patch('sites/:id')
  updateSite(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: any) {
    return this.studio.updateSite(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete site' })
  @Permissions('builder.delete')
  @Delete('sites/:id')
  deleteSite(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.studio.deleteSite(req.user.tenantId, id);
  }

  // ── Domains ──
  @ApiOperation({ summary: 'Add domain' })
  @Permissions('builder.update')
  @Post('sites/:id/domains')
  addDomain(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ host: z.string().min(1), isPrimary: z.boolean().optional() }))
    body: { host: string; isPrimary?: boolean },
  ) {
    return this.studio.addDomain(req.user.tenantId, id, body.host, body.isPrimary);
  }

  @ApiOperation({ summary: 'Remove domain' })
  @Permissions('builder.update')
  @Delete('sites/:id/domains/:domainId')
  removeDomain(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('domainId') domainId: string) {
    return this.studio.removeDomain(req.user.tenantId, id, domainId);
  }

  // ── Pages ──
  @ApiOperation({ summary: 'List site pages' })
  @Permissions('builder.read')
  @Get('sites/:id/pages')
  listPages(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.studio.listPages(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create or update a site page' })
  @Permissions('builder.update')
  @Put('sites/:id/pages')
  upsertPage(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(pageSchema) body: any) {
    return this.studio.upsertPage(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete a site page' })
  @Permissions('builder.delete')
  @Delete('sites/:id/pages/:pageId')
  deletePage(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('pageId') pageId: string) {
    return this.studio.deletePage(req.user.tenantId, id, pageId);
  }

  // ── Chatbot ──
  @ApiOperation({ summary: 'Get chatbot config' })
  @Permissions('builder.read')
  @Get('sites/:id/chatbot')
  getChatbot(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.studio.getChatbot(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Update chatbot config' })
  @Permissions('builder.update')
  @Patch('sites/:id/chatbot')
  updateChatbot(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: any) {
    return this.studio.updateChatbot(req.user.tenantId, id, body);
  }
}
