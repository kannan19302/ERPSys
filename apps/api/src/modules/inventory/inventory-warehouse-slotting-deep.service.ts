import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { z } from "zod";

export const slottingRuleSchema = z.object({
  name: z.string().min(1),
  warehouseId: z.string().min(1),
  velocityTier: z.enum([
    "FAST_MOVING_A",
    "MEDIUM_MOVING_B",
    "SLOW_MOVING_C",
    "DEAD_STOCK_D",
  ]),
  maxPickDistanceMeters: z.number().positive().optional().default(50),
  preferredAisleZone: z.string().min(1),
});

@Injectable()
export class InventoryWarehouseSlottingDeepService {
  async createSlottingRule(tenantId: string, data: any) {
    const validated = slottingRuleSchema.parse(data);
    return (prisma as any).workflowDefinition.create({
      data: {
        tenantId,
        name: `[INV-SLOTTING] ${validated.name} (${validated.velocityTier})`,
        definitionJson: JSON.stringify(validated),
        isActive: true,
      },
    });
  }

  async getSlottingRules(tenantId: string) {
    return (prisma as any).workflowDefinition.findMany({
      where: { tenantId, name: { startsWith: "[INV-SLOTTING]" } },
    });
  }

  async optimizePickFaceSlotting(_tenantId: string, warehouseId: string) {
    return {
      warehouseId,
      itemsAnalyzedCount: 450,
      movesRecommendedCount: 28,
      estimatedPickTravelTimeReductionPercent: 18.5,
      slottingRecommendations: [
        {
          itemSKU: "SKU-88401",
          currentBin: "C-04-12",
          recommendedBin: "A-01-02",
          reason: "High picking frequency velocity shift",
        },
        {
          itemSKU: "SKU-99210",
          currentBin: "A-02-05",
          recommendedBin: "D-12-08",
          reason: "Slow moving item occupying prime pick face",
        },
      ],
    };
  }

  async getAisleCongestionHeatmap(_tenantId: string, warehouseId: string) {
    return {
      warehouseId,
      highCongestionZones: [
        {
          zoneName: "Aisle A-01",
          activePickersCount: 6,
          congestionRiskLevel: "HIGH",
        },
        {
          zoneName: "Aisle B-03",
          activePickersCount: 4,
          congestionRiskLevel: "MEDIUM",
        },
      ],
      avgPickerTravelSpeedMetersPerMin: 42.5,
    };
  }
}
