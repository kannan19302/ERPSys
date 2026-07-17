import { ApiProperty } from '@nestjs/swagger';

export class IssueRecallDto {
  @ApiProperty({ description: 'Batch/lot ID to recall' })
  batchId!: string;

  @ApiProperty({ description: 'Product ID to recall' })
  productId!: string;

  @ApiProperty({ description: 'Reason for recall' })
  reason!: string;

  @ApiProperty({ description: 'Recall severity', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  severity!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ description: 'User ID issuing the recall' })
  issuedBy!: string;

  @ApiProperty({ description: 'ISO timestamp when recall is issued' })
  issuedAt!: string;
}
