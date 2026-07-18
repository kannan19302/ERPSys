import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, Req, Headers, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublicTenantResolverGuard, StorefrontRequest } from './guards/public-tenant-resolver.guard';
import { EcommercePublicService } from './ecommerce-public.service';
import { EcommerceCheckoutService } from './ecommerce-checkout.service';
import {
  createCartSchema,
  CreateCartDto,
  addCartItemSchema,
  AddCartItemDto,
  updateCartItemSchema,
  UpdateCartItemDto,
  checkoutSchema,
  CheckoutDto,
} from './dto/ecommerce.dto';
import { ZodBody } from '../../common/decorators/zod-body.decorator';

/**
 * ================================================================
 * PUBLIC / UNAUTHENTICATED STOREFRONT ROUTES — INTENTIONAL EXCEPTION
 * ================================================================
 * Every route in this controller serves anonymous external customers who
 * have no UniERP account — there is no JWT to verify and therefore no
 * `@Permissions()` decorator on any handler here. This is NOT an oversight:
 * it is the one deliberate, documented exception to AGENTS.md Rule 15
 * ("every endpoint MUST use @Permissions"), called out explicitly in
 * .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Section 7 and flagged in
 * .ai/DATA_MODEL.md Section 3.4's "Tenant-resolution note" for
 * security-auditor review. Tenant scoping here comes from
 * `PublicTenantResolverGuard` (resolves `:tenantSlug` -> `StorefrontConfig`),
 * NOT from `JwtAuthGuard`/`RbacGuard` — do not add those guards to this
 * controller; do not add `@Permissions()` to these handlers.
 *
 * If you are reviewing this file and think "this endpoint has no permission
 * guard, that must be a bug" — it is not. See the guard's own header comment
 * (guards/public-tenant-resolver.guard.ts) for the full tenant-resolution
 * design rationale.
 */
@ApiTags('ecommerce-storefront-public')
@Controller('store/:tenantSlug')
@UseGuards(PublicTenantResolverGuard)
export class EcommercePublicController {
  constructor(
    private readonly publicService: EcommercePublicService,
    private readonly checkoutService: EcommerceCheckoutService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: '[PUBLIC] Get storefront branding info (name, logo, currency)' })
  async getConfig(@Req() req: Request & StorefrontRequest) {
    return this.publicService.getPublicConfig(req.storefrontConfig!.tenantId);
  }

  @Get('categories')
  @ApiOperation({ summary: '[PUBLIC] List storefront categories' })
  async getCategories(@Req() req: Request & StorefrontRequest) {
    return this.publicService.getCategories(req.storefrontConfig!.tenantId);
  }

  @Get('products')
  @ApiOperation({ summary: '[PUBLIC] List published product listings, filterable by category, paginated' })
  async getProducts(
    @Req() req: Request & StorefrontRequest,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10) || 1) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10) || 25)) : 25;
    return this.publicService.getProducts(req.storefrontConfig!.tenantId, categoryId, pageNum, limitNum);
  }

  @Get('products/:listingId')
  @ApiOperation({ summary: '[PUBLIC] Get a single published product listing' })
  async getProductByListingId(@Req() req: Request & StorefrontRequest, @Param('listingId') listingId: string) {
    return this.publicService.getProductByListingId(req.storefrontConfig!.tenantId, listingId);
  }

  @Post('cart')
  @ApiOperation({ summary: '[PUBLIC] Create a new anonymous cart, returns a sessionToken' })
  async createCart(@Req() req: Request & StorefrontRequest, @ZodBody(createCartSchema) dto: CreateCartDto) {
    const currency = dto.currency || req.storefrontConfig!.currency;
    return this.publicService.createCart(req.storefrontConfig!.tenantId, currency);
  }

  @Get('cart/:sessionToken')
  @ApiOperation({ summary: '[PUBLIC] Get a cart and its items by sessionToken' })
  async getCart(@Req() req: Request & StorefrontRequest, @Param('sessionToken') sessionToken: string) {
    return this.publicService.getCart(req.storefrontConfig!.tenantId, sessionToken);
  }

  @Post('cart/:sessionToken/items')
  @ApiOperation({ summary: '[PUBLIC] Add an item to the cart (validates listing is published, snapshots price)' })
  async addCartItem(
    @Req() req: Request & StorefrontRequest,
    @Param('sessionToken') sessionToken: string,
    @ZodBody(addCartItemSchema) dto: AddCartItemDto,
  ) {
    return this.publicService.addCartItem(req.storefrontConfig!.tenantId, sessionToken, dto);
  }

  @Patch('cart/:sessionToken/items/:itemId')
  @ApiOperation({ summary: '[PUBLIC] Update a cart item\'s quantity' })
  async updateCartItem(
    @Req() req: Request & StorefrontRequest,
    @Param('sessionToken') sessionToken: string,
    @Param('itemId') itemId: string,
    @ZodBody(updateCartItemSchema) dto: UpdateCartItemDto,
  ) {
    return this.publicService.updateCartItem(req.storefrontConfig!.tenantId, sessionToken, itemId, dto);
  }

  @Delete('cart/:sessionToken/items/:itemId')
  @ApiOperation({ summary: '[PUBLIC] Remove an item from the cart' })
  async removeCartItem(
    @Req() req: Request & StorefrontRequest,
    @Param('sessionToken') sessionToken: string,
    @Param('itemId') itemId: string,
  ) {
    return this.publicService.removeCartItem(req.storefrontConfig!.tenantId, sessionToken, itemId);
  }

  @Post('checkout')
  @ApiOperation({
    summary:
      '[PUBLIC][MOCK PAYMENT] Check out a cart: writes a StorefrontCheckoutState and an ' +
      'ecommerce.checkout.completed outbox event. The Sales module consumer handler ' +
      'creates the SalesOrder asynchronously. Poll GET checkout/:sessionToken/status for completion.',
  })
  async checkout(@Req() req: Request & StorefrontRequest, @ZodBody(checkoutSchema) dto: CheckoutDto) {
    return this.checkoutService.checkout(
      req.storefrontConfig!.tenantId,
      req.storefrontConfig!.storeSlug,
      dto,
    );
  }

  @Get('checkout/:sessionToken/status')
  @ApiOperation({
    summary:
      '[PUBLIC] Poll the async checkout status. Returns the StorefrontCheckoutState ' +
      'so the frontend can display ORDER_COMPLETED / ORDER_FAILED and redirect accordingly.',
  })
  async getCheckoutStatus(
    @Req() req: Request & StorefrontRequest,
    @Param('sessionToken') sessionToken: string,
  ) {
    const state = await this.checkoutService.getCheckoutStateBySession(
      req.storefrontConfig!.tenantId,
      sessionToken,
    );
    if (!state) {
      throw new NotFoundException('Checkout state not found');
    }
    return state;
  }

  @Post('webhooks/stripe')
  @ApiOperation({ summary: '[PUBLIC] Stripe Webhook receiver for order payment completions' })
  async stripeWebhook(
    @Req() req: Request & StorefrontRequest & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw request body buffer.');
    }
    return this.checkoutService.handleStripeWebhook(
      req.rawBody,
      signature || '',
      req.storefrontConfig!.storeSlug,
    );
  }
}
