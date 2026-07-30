// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SubscriptionCouponService {
  async getCoupons(tenantId: string) {
    return prisma.subscriptionCoupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createCoupon(
    tenantId: string,
    dto: {
      code: string;
      description?: string;
      discountType: string;
      discountValue: number;
      maxRedemptions?: number;
      appliesTo?: string;
      planId?: string;
      validFrom: string;
      validUntil?: string;
    },
  ) {
    const exists = await prisma.subscriptionCoupon.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (exists) throw new BadRequestException("Coupon code already exists");
    return prisma.subscriptionCoupon.create({
      data: {
        tenantId,
        ...dto,
        discountValue: new Prisma.Decimal(dto.discountValue),
        validFrom: new Date(dto.validFrom),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        isActive: true,
      },
    });
  }

  async updateCoupon(
    tenantId: string,
    id: string,
    dto: Partial<{
      description: string;
      discountType: string;
      discountValue: number;
      maxRedemptions: number;
      appliesTo: string;
      planId: string;
      validFrom: string;
      validUntil: string;
      isActive: boolean;
    }>,
  ) {
    const coupon = await prisma.subscriptionCoupon.findFirst({
      where: { tenantId, id },
    });
    if (!coupon) throw new NotFoundException("Coupon not found");
    const data: Record<string, unknown> = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.discountType !== undefined) data.discountType = dto.discountType;
    if (dto.discountValue !== undefined)
      data.discountValue = new Prisma.Decimal(dto.discountValue);
    if (dto.maxRedemptions !== undefined)
      data.maxRedemptions = dto.maxRedemptions;
    if (dto.appliesTo !== undefined) data.appliesTo = dto.appliesTo;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.validFrom !== undefined) data.validFrom = new Date(dto.validFrom);
    if (dto.validUntil !== undefined)
      data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    return prisma.subscriptionCoupon.update({ where: { id }, data });
  }

  async deleteCoupon(tenantId: string, id: string) {
    const coupon = await prisma.subscriptionCoupon.findFirst({
      where: { tenantId, id },
    });
    if (!coupon) throw new NotFoundException("Coupon not found");
    await prisma.subscriptionCoupon.delete({ where: { id } });
    return { success: true };
  }

  async redeemCoupon(
    tenantId: string,
    couponCode: string,
    subscriptionId: string,
  ) {
    const coupon = await prisma.subscriptionCoupon.findFirst({
      where: { tenantId, code: couponCode, isActive: true },
    });
    if (!coupon) throw new NotFoundException("Coupon not found or inactive");
    const now = new Date();
    if (now < coupon.validFrom)
      throw new BadRequestException("Coupon not yet valid");
    if (coupon.validUntil && now > coupon.validUntil)
      throw new BadRequestException("Coupon has expired");
    if (
      coupon.maxRedemptions &&
      coupon.currentRedemptions >= coupon.maxRedemptions
    )
      throw new BadRequestException("Coupon fully redeemed");
    const sub = await prisma.subscription.findFirst({
      where: { tenantId, id: subscriptionId },
    });
    if (!sub) throw new NotFoundException("Subscription not found");
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE")
      discountAmount =
        Number(sub.unitAmount) *
        sub.quantity *
        (Number(coupon.discountValue) / 100);
    else if (coupon.discountType === "FIXED_AMOUNT")
      discountAmount = Number(coupon.discountValue);
    else if (coupon.discountType === "FREE_MONTHS")
      discountAmount =
        Number(sub.unitAmount) * sub.quantity * Number(coupon.discountValue);
    return prisma.$transaction(async (tx) => {
      await tx.subscriptionCoupon.update({
        where: { id: coupon.id },
        data: { currentRedemptions: { increment: 1 } },
      });
      return tx.subscriptionCouponRedemption.create({
        data: {
          tenantId,
          couponId: coupon.id,
          subscriptionId,
          discountAmount: new Prisma.Decimal(discountAmount),
          redeemedAt: new Date(),
        },
      });
    });
  }

  async createCouponSimple(tenantId: string, body: any) {
    return prisma.subscriptionCoupon.create({
      data: { ...body, tenantId } as any,
    });
  }

  async getRedemptions(tenantId: string, couponId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (couponId) where.couponId = couponId;
    return prisma.subscriptionCouponRedemption.findMany({
      where,
      orderBy: { redeemedAt: "desc" },
    });
  }
}
