import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SalesAdvancedPricingDeepService {
  async calculateVolumeDiscount(
    tenantId: string,
    dto: { productId: string; quantity: number; basePrice: number },
  ) {
    // Volume tier matrix
    const qty = dto.quantity;
    let discountPct = 0;

    if (qty >= 1000) discountPct = 25;
    else if (qty >= 500) discountPct = 20;
    else if (qty >= 100) discountPct = 15;
    else if (qty >= 50) discountPct = 10;
    else if (qty >= 10) discountPct = 5;

    const unitPrice = dto.basePrice * (1 - discountPct / 100);
    const totalPrice = unitPrice * qty;

    return {
      productId: dto.productId,
      quantity: qty,
      basePrice: dto.basePrice,
      appliedDiscountPct: discountPct,
      unitPrice,
      totalPrice,
      savingsAmount: (dto.basePrice - unitPrice) * qty,
    };
  }

  async getCurrencyMatrices(tenantId: string) {
    return [
      { currency: "USD", symbol: "$", rate: 1.0, isBase: true },
      { currency: "EUR", symbol: "€", rate: 0.92, isBase: false },
      { currency: "GBP", symbol: "£", rate: 0.79, isBase: false },
      { currency: "JPY", symbol: "¥", rate: 155.4, isBase: false },
      { currency: "AUD", symbol: "A$", rate: 1.52, isBase: false },
    ];
  }

  async getPricingRuleSets(tenantId: string) {
    return [
      {
        id: "rule-1",
        name: "Enterprise Customer Tier",
        priority: 1,
        type: "ACCOUNT_TIER_DISCOUNT",
        value: 15,
        isActive: true,
      },
      {
        id: "rule-2",
        name: "End-of-Quarter Promo",
        priority: 2,
        type: "SEASONAL_PROMO",
        value: 10,
        isActive: true,
      },
      {
        id: "rule-3",
        name: "Minimum Margin Lock",
        priority: 99,
        type: "MARGIN_FLOOR",
        value: 30,
        isActive: true,
      },
    ];
  }
}
