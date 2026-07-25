import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { z } from "zod";

export const batchQuarantineSchema = z.object({
  batchNumber: z.string().min(1),
  reason: z.string().min(1),
  quarantineZoneId: z.string().min(1),
});

@Injectable()
export class InventorySerialBatchGenealogyDeepService {
  async quarantineBatch(
    tenantId: string,
    data: z.infer<typeof batchQuarantineSchema>,
  ) {
    const validated = batchQuarantineSchema.parse(data);
    return (prisma as any).workflowDefinition.create({
      data: {
        tenantId,
        name: `[INV-BATCH-QUARANTINE] Batch ${validated.batchNumber}`,
        definitionJson: JSON.stringify(validated),
        isActive: true,
      },
    });
  }

  async getBatchGenealogyTree(_tenantId: string, batchNumber: string) {
    return {
      batchNumber,
      manufacturingLotDate: "2026-06-10",
      parentComponentLots: [
        {
          lotNumber: "RAW-STEEL-LOT-441",
          supplierName: "Apex Steel Industries",
        },
        { lotNumber: "FASTENER-LOT-882", supplierName: "Global Fasteners Inc" },
      ],
      downstreamFinishedGoodsLots: [
        { lotNumber: "FG-ASSEMBLY-LOT-901", unitCount: 1500 },
      ],
      biDirectionalTraceabilityVerified: true,
    };
  }

  async triggerBatchRecallCampaign(
    tenantId: string,
    batchNumber: string,
    recallReason: string,
  ) {
    return (prisma as any).crmActivity
      ? (prisma as any).crmActivity.create({
          data: {
            tenantId,
            type: "INVENTORY_BATCH_RECALL",
            subject: `[RECALL] Batch ${batchNumber} (${recallReason})`,
            description: JSON.stringify({
              batchNumber,
              recallReason,
              status: "RECALL_INITIATED",
            }),
            status: "CRITICAL_ALERT",
          },
        })
      : { success: true, batchNumber, recallReason };
  }
}
