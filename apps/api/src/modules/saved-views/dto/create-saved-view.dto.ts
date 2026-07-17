import { ApiProperty } from '@nestjs/swagger';

export class CreateSavedViewDto {
  @ApiProperty({ description: 'The resource name, e.g. customer' })
  resourceName!: string;

  @ApiProperty({ description: 'The name of the saved view' })
  name!: string;

  @ApiProperty({ description: 'The filter/search/sort state', additionalProperties: true })
  state!: Record<string, any>;
}

export class UpdateSavedViewDto {
  @ApiProperty({ description: 'The name of the saved view', required: false })
  name?: string;

  @ApiProperty({ description: 'The filter/search/sort state', required: false, additionalProperties: true })
  state?: Record<string, any>;
}
