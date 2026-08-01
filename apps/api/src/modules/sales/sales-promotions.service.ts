import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesPromotionsService {
  async getPromotions(tenantId: string) {
    return prisma.salesPromotion.findMany({
      where: { tenantId },
      include: { _count: { select: { coupons: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPromotionById(tenantId: string, id: string) {
    const promotion = await prisma.salesPromotion.findFirst({
      where: { id, tenantId },
      include: { coupons: { orderBy: { createdAt: "desc" } } },
    });
    if (!promotion) throw new NotFoundException("Promotion not found");
    return promotion;
  }

  async createPromotion(tenantId: string, orgId: string, dto: any) {
    return prisma.salesPromotion.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        description: dto.description || null,
        type: dto.type,
        value: new Prisma.Decimal(dto.value),
        minOrderAmount:
          dto.minOrderAmount != null
            ? new Prisma.Decimal(dto.minOrderAmount)
            : null,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
        maxUsageCount: dto.maxUsageCount ?? null,
        appliesToAll: dto.appliesToAll ?? true,
        productIds: (dto.productIds ?? []) as Prisma.InputJsonValue,
        customerIds: (dto.customerIds ?? []) as Prisma.InputJsonValue,
      },
    });
  }

  async updatePromotion(tenantId: string, id: string, dto: any) {
    const existing = await prisma.salesPromotion.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Promotion not found");

    const data: Prisma.SalesPromotionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = new Prisma.Decimal(dto.value);
    if (dto.minOrderAmount !== undefined)
      data.minOrderAmount =
        dto.minOrderAmount != null
          ? new Prisma.Decimal(dto.minOrderAmount)
          : null;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined)
      data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.maxUsageCount !== undefined) data.maxUsageCount = dto.maxUsageCount;
    if (dto.appliesToAll !== undefined) data.appliesToAll = dto.appliesToAll;
    if (dto.productIds !== undefined)
      data.productIds = dto.productIds as Prisma.InputJsonValue;
    if (dto.customerIds !== undefined)
      data.customerIds = dto.customerIds as Prisma.InputJsonValue;

    return prisma.salesPromotion.update({ where: { id }, data });
  }

  async deletePromotion(tenantId: string, id: string) {
    const existing = await prisma.salesPromotion.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Promotion not found");
    return prisma.salesPromotion.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCoupons(tenantId: string, promotionId?: string) {
    const where: Prisma.SalesCouponWhereInput = { tenantId };
    if (promotionId) where.promotionId = promotionId;
    return prisma.salesCoupon.findMany({
      where,
      include: { promotion: { select: { id: true, name: true, type: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createCoupon(tenantId: string, dto: any) {
    const promotion = await prisma.salesPromotion.findFirst({
      where: { id: dto.promotionId, tenantId },
    });
    if (!promotion) throw new NotFoundException("Promotion not found");

    const existing = await prisma.salesCoupon.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new BadRequestException("Coupon code already exists");

    return prisma.salesCoupon.create({
      data: {
        tenantId,
        promotionId: dto.promotionId,
        code: dto.code,
        usageLimit: dto.usageLimit ?? null,
        isActive: dto.isActive ?? true,
        maxRedemptionsPerCustomer: dto.maxRedemptionsPerCustomer ?? null,
      },
    });
  }

  async updateCoupon(tenantId: string, id: string, dto: any) {
    const existing = await prisma.salesCoupon.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Coupon not found");

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await prisma.salesCoupon.findUnique({
        where: { tenantId_code: { tenantId, code: dto.code } },
      });
      if (duplicate)
        throw new BadRequestException("Coupon code already exists");
    }

    const data: Prisma.SalesCouponUpdateInput = {};
    if (dto.promotionId !== undefined) {
      data.promotion = { connect: { id: dto.promotionId } };
    }
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.maxRedemptionsPerCustomer !== undefined)
      data.maxRedemptionsPerCustomer = dto.maxRedemptionsPerCustomer;

    return prisma.salesCoupon.update({ where: { id }, data });
  }

  async deleteCoupon(tenantId: string, id: string) {
    const existing = await prisma.salesCoupon.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Coupon not found");
    return prisma.salesCoupon.delete({ where: { id } });
  }

  async applyCoupon(
    tenantId: string,
    code: string,
    orderSubtotal: number,
    customerId?: string,
    productIds?: string[],
  ) {
    const coupon = await prisma.salesCoupon.findUnique({
      where: { tenantId_code: { tenantId, code } },
      include: { promotion: true },
    });
    if (!coupon) throw new BadRequestException("Invalid coupon code");
    if (!coupon.isActive)
      throw new BadRequestException("Coupon is no longer active");
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException("Coupon usage limit reached");
    }

    const promotion = coupon.promotion;
    if (!promotion.isActive)
      throw new BadRequestException("Promotion is no longer active");

    const now = new Date();
    if (now < promotion.startDate)
      throw new BadRequestException("Promotion has not started yet");
    if (promotion.endDate && now > promotion.endDate)
      throw new BadRequestException("Promotion has expired");

    if (
      promotion.maxUsageCount &&
      promotion.usedCount >= promotion.maxUsageCount
    ) {
      throw new BadRequestException("Promotion usage limit reached");
    }

    if (
      promotion.minOrderAmount &&
      orderSubtotal < Number(promotion.minOrderAmount)
    ) {
      throw new BadRequestException(
        `Minimum order amount of ${promotion.minOrderAmount} required for this promotion`,
      );
    }

    if (!promotion.appliesToAll) {
      const promProductIds = promotion.productIds as string[];
      if (productIds && productIds.length > 0) {
        const applicable = productIds.some((pid) =>
          promProductIds.includes(pid),
        );
        if (!applicable) {
          throw new BadRequestException(
            "Products in order are not eligible for this promotion",
          );
        }
      }
    }

    if (
      promotion.customerIds &&
      (promotion.customerIds as string[]).length > 0
    ) {
      const promCustomerIds = promotion.customerIds as string[];
      if (customerId && !promCustomerIds.includes(customerId)) {
        throw new BadRequestException(
          "Customer is not eligible for this promotion",
        );
      }
    }

    let discountAmount = 0;
    switch (promotion.type) {
      case "PERCENTAGE":
        discountAmount = orderSubtotal * (Number(promotion.value) / 100);
        break;
      case "FIXED_AMOUNT":
        discountAmount = Number(promotion.value);
        break;
      case "FREE_SHIPPING":
      case "BOGO":
        break;
    }

    const finalAmount = Math.max(0, orderSubtotal - discountAmount);

    return {
      valid: true,
      discountAmount,
      promotionName: promotion.name,
      promotionType: promotion.type,
      finalAmount,
    };
  }
}
