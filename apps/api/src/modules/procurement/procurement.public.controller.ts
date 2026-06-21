import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { submitPublicBidSchema, SubmitPublicBidInput } from '@unerp/shared';

@Controller('procurement/public')
export class ProcurementPublicController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('rfqs/:rfqNumber')
  async getPublicRFQByNumber(@Param('rfqNumber') rfqNumber: string) {
    // Note: in a multi-tenant context, RFQ number is unique across tenant-org.
    // Let's find by matching the rfqNumber field
    const prisma = require('@unerp/database').prisma;
    const rfqObj = await prisma.rFQ.findFirst({
      where: { rfqNumber, deletedAt: null },
      include: {
        lineItems: { include: { product: true } },
      },
    });
    if (!rfqObj) {
      throw new Error(`RFQ number ${rfqNumber} not found`);
    }
    return {
      id: rfqObj.id,
      rfqNumber: rfqObj.rfqNumber,
      notes: rfqObj.notes,
      expectedDate: rfqObj.expectedDate,
      lineItems: rfqObj.lineItems.map((li: any) => ({
        id: li.id,
        productId: li.productId,
        description: li.description,
        quantity: Number(li.quantity),
        product: li.product ? { name: li.product.name, sku: li.product.sku } : null,
      })),
    };
  }

  @Post('rfqs/:rfqNumber/submit-bid')
  async submitPublicBid(
    @Param('rfqNumber') rfqNumber: string,
    @Body(new ZodValidationPipe(submitPublicBidSchema)) dto: SubmitPublicBidInput,
  ) {
    return this.procurementService.submitPublicBid(rfqNumber, dto);
  }
}
