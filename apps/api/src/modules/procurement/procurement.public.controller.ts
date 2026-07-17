import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { submitPublicBidSchema, SubmitPublicBidInput } from '@unerp/shared';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('procurement')
@Controller('procurement/public')
export class ProcurementPublicController {
  constructor(private readonly procurementService: ProcurementService) {}

  @ApiOperation({ summary: 'Get public r f q by number' })
  @Get('rfqs/:rfqNumber')
  async getPublicRFQByNumber(@Param('rfqNumber') rfqNumber: string) {
    return this.procurementService.getPublicRFQByNumber(rfqNumber);
  }

  @ApiOperation({ summary: 'Submit public bid' })
  @Post('rfqs/:rfqNumber/submit-bid')
  async submitPublicBid(
    @Param('rfqNumber') rfqNumber: string,
    @Body(new ZodValidationPipe(submitPublicBidSchema)) dto: SubmitPublicBidInput,
  ) {
    return this.procurementService.submitPublicBid(rfqNumber, dto);
  }
}
