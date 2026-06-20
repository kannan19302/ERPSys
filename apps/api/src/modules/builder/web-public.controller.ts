import { Controller, Get, Post, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { createWebFormSubmissionSchema, type CreateWebFormSubmissionInput, webCheckoutSchema, type WebCheckoutInput } from '@unerp/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { WebCollectionsService } from './web-collections.service';

/**
 * Public (unauthenticated) endpoints consumed by the live customer-facing
 * website: reading published collection content and capturing form submissions.
 * Tenant is resolved by slug (defaults to "system" to match the public page
 * renderer at apps/web/app/[slug]/page.tsx).
 */
@Controller('public/web')
export class WebPublicController {
  constructor(private readonly collections: WebCollectionsService) {}

  private async resolveTenantId(tenantSlug?: string): Promise<string> {
    const slug = tenantSlug || 'system';
    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) throw new NotFoundException('Site not found');
    return tenant.id;
  }

  @Get('collections/:slug')
  async getCollectionItems(@Param('slug') slug: string, @Query('tenant') tenant?: string) {
    const tenantId = await this.resolveTenantId(tenant);
    return this.collections.getPublicItems(tenantId, slug);
  }

  @Get('collections/:slug/:itemSlug')
  async getCollectionItem(
    @Param('slug') slug: string,
    @Param('itemSlug') itemSlug: string,
    @Query('tenant') tenant?: string,
  ) {
    const tenantId = await this.resolveTenantId(tenant);
    return this.collections.getPublicItem(tenantId, slug, itemSlug);
  }

  @Post('forms/submit')
  async submitForm(
    @Body(new ZodValidationPipe(createWebFormSubmissionSchema)) dto: CreateWebFormSubmissionInput,
    @Query('tenant') tenant?: string,
  ) {
    const tenantId = await this.resolveTenantId(tenant);
    await this.collections.createSubmission(tenantId, dto);
    return { success: true, message: 'Thanks! Your submission was received.' };
  }

  @Post('checkout')
  async checkout(
    @Body(new ZodValidationPipe(webCheckoutSchema)) dto: WebCheckoutInput,
    @Query('tenant') tenant?: string,
  ) {
    const tenantId = await this.resolveTenantId(tenant);
    return this.collections.checkout(tenantId, dto);
  }
}
