import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { prisma } from '@unerp/database';
import { AddCartItemDto, UpdateCartItemDto } from './dto/ecommerce.dto';

const CART_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

/**
 * Public (unauthenticated) catalog + cart service for the storefront's
 * `store/:tenantSlug/*` routes. Every method takes an already-resolved
 * `tenantId` (from `PublicTenantResolverGuard`, never a client-supplied value)
 * and scopes every query by it explicitly, in addition to the Prisma
 * tenant-scope extension picking it up from the AsyncLocalStorage session —
 * defense in depth, matching how `sales.service.ts` scopes everywhere.
 * See .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Flow B.
 */
@Injectable()
export class EcommercePublicService {
  // ─── Public branding ─────────────────────────────────

  async getPublicConfig(tenantId: string) {
    const config = await prisma.storefrontConfig.findUnique({ where: { tenantId } });
    if (!config || !config.isEnabled) throw new NotFoundException('Storefront not found');

    // Deliberately narrow projection — never leak internal fields (id, etc.)
    return {
      storeName: config.storeName,
      storeSlug: config.storeSlug,
      currency: config.currency,
      logoUrl: config.logoUrl,
      primaryColor: config.primaryColor,
    };
  }

  // ─── Categories ───────────────────────────────────────

  async getCategories(tenantId: string) {
    const categories = await prisma.storefrontCategory.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
    return categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description }));
  }

  // ─── Products (published listings only) ──────────────

  async getProducts(tenantId: string, categoryId: string | undefined, page: number, limit: number) {
    const where = {
      tenantId,
      isPublished: true,
      ...(categoryId ? { categoryId } : {}),
    };

    const [listings, total] = await Promise.all([
      prisma.productListing.findMany({
        where,
        include: { product: true, category: true },
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productListing.count({ where }),
    ]);

    return {
      data: listings.map((l) => this.toPublicListing(l)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProductByListingId(tenantId: string, listingId: string) {
    const listing = await prisma.productListing.findFirst({
      where: { id: listingId, tenantId, isPublished: true },
      include: { product: true, category: true },
    });
    if (!listing) throw new NotFoundException('Product not found');
    return this.toPublicListing(listing);
  }

  private toPublicListing(listing: {
    id: string;
    productId: string;
    displayName: string | null;
    description: string | null;
    priceOverride: unknown;
    categoryId: string | null;
    category: { id: string; name: string } | null;
    product: { name: string; sku: string; description: string | null; images: unknown; sellPrice: unknown };
  }) {
    return {
      listingId: listing.id,
      productId: listing.productId,
      name: listing.displayName || listing.product.name,
      description: listing.description || listing.product.description,
      sku: listing.product.sku,
      images: listing.product.images,
      categoryId: listing.categoryId,
      categoryName: listing.category?.name || null,
      price: listing.priceOverride != null ? Number(listing.priceOverride) : Number(listing.product.sellPrice),
    };
  }

  // ─── Cart ─────────────────────────────────────────────

  async createCart(tenantId: string, currency: string) {
    return prisma.cart.create({
      data: {
        tenantId,
        sessionToken: randomUUID(),
        status: 'ACTIVE',
        currency,
        expiresAt: new Date(Date.now() + CART_TTL_MS),
      },
    });
  }

  async getCart(tenantId: string, sessionToken: string) {
    const cart = await this.findCartOrThrow(tenantId, sessionToken);
    return this.toCartResponse(cart);
  }

  async addCartItem(tenantId: string, sessionToken: string, dto: AddCartItemDto) {
    const cart = await this.findCartOrThrow(tenantId, sessionToken);
    if (cart.status !== 'ACTIVE') {
      throw new BadRequestException(`Cart is ${cart.status.toLowerCase()} and can no longer be modified`);
    }

    const listing = await prisma.productListing.findFirst({
      where: { id: dto.productListingId, tenantId, isPublished: true },
      include: { product: true },
    });
    if (!listing) throw new NotFoundException('Product listing not found or not published');

    const effectivePrice = listing.priceOverride != null ? Number(listing.priceOverride) : Number(listing.product.sellPrice);

    // Merge into an existing line for the same listing rather than creating a
    // duplicate row — the more correct behavior for a shopping cart and what
    // a customer clicking "Add to cart" twice on the same product expects.
    const existingItem = await prisma.cartItem.findFirst({
      where: { tenantId, cartId: cart.id, productListingId: dto.productListingId },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + dto.quantity,
          unitPriceSnapshot: effectivePrice, // refresh snapshot to current effective price
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          tenantId,
          cartId: cart.id,
          productListingId: dto.productListingId,
          quantity: dto.quantity,
          unitPriceSnapshot: effectivePrice,
        },
      });
    }

    const updated = await this.findCartOrThrow(tenantId, sessionToken);
    return this.toCartResponse(updated);
  }

  async updateCartItem(tenantId: string, sessionToken: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.findCartOrThrow(tenantId, sessionToken);
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, tenantId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');

    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });

    const updated = await this.findCartOrThrow(tenantId, sessionToken);
    return this.toCartResponse(updated);
  }

  async removeCartItem(tenantId: string, sessionToken: string, itemId: string) {
    const cart = await this.findCartOrThrow(tenantId, sessionToken);
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, tenantId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');

    await prisma.cartItem.delete({ where: { id: itemId } });

    const updated = await this.findCartOrThrow(tenantId, sessionToken);
    return this.toCartResponse(updated);
  }

  private async findCartOrThrow(tenantId: string, sessionToken: string) {
    const cart = await prisma.cart.findFirst({
      where: { tenantId, sessionToken },
      include: { items: { include: { productListing: { include: { product: true } } } } },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  private toCartResponse(cart: {
    id: string;
    sessionToken: string;
    status: string;
    currency: string;
    items: Array<{
      id: string;
      productListingId: string;
      quantity: number;
      unitPriceSnapshot: unknown;
      productListing: { displayName: string | null; product: { name: string; sku: string } };
    }>;
  }) {
    const items = cart.items.map((item) => ({
      id: item.id,
      productListingId: item.productListingId,
      productName: item.productListing.displayName || item.productListing.product.name,
      sku: item.productListing.product.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPriceSnapshot),
      lineTotal: Number(item.unitPriceSnapshot) * item.quantity,
    }));

    return {
      sessionToken: cart.sessionToken,
      status: cart.status,
      currency: cart.currency,
      items,
      subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
    };
  }
}
