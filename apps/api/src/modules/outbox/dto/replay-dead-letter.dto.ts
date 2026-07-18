import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const ReplayDeadLetterSchema = z.object({
  outboxDeliveryId: z.string().min(1, 'outboxDeliveryId is required'),
});

export type ReplayDeadLetterInput = z.infer<typeof ReplayDeadLetterSchema>;

export class ReplayDeadLetterDto {
  @ApiProperty({ description: 'ID of the DEAD outbox delivery to re-drive' })
  outboxDeliveryId!: string;
}

export class ReplayDeadLetterResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  deliveryId!: string;

  @ApiProperty({ required: false })
  error?: string;
}
