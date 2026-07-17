import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetProvenanceDto {
  @ApiProperty({ description: 'Product ID to get provenance for' })
  productId!: string;

  @ApiPropertyOptional({ description: 'Batch/lot ID to filter by' })
  batchId?: string;
}
