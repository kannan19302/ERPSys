import { ApiProperty } from '@nestjs/swagger';

export class ThreeWayMatchDto {
  @ApiProperty({ description: 'Purchase Order ID to execute 3-way match for' })
  poId!: string;
}
