import { ApiProperty } from '@nestjs/swagger';

export class VerifyJournalDto {
  @ApiProperty({ description: 'GL Journal Entry ID' })
  journalId!: string;

  @ApiProperty({ description: 'Current journal entry data to hash and verify' })
  currentEntryData!: Record<string, unknown>;
}
