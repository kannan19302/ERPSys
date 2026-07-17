import { ApiProperty } from '@nestjs/swagger';

export class VerifyDocumentDto {
  @ApiProperty({ description: 'Document ID (from PostgreSQL)' })
  documentId!: string;

  @ApiProperty({ description: 'Current SHA-256 hash of the document to verify against on-chain record' })
  currentHash!: string;
}
