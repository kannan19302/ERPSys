import { Module } from '@nestjs/common';
import { DocumentsModule } from '../../modules/documents/documents.module';
import { DocumentsService } from '../../modules/documents/documents.service';
import { DocumentStorageClient } from './document-storage-client';

/** Composition-layer adapter for the shared Drive-backed storage capability. */
@Module({
  imports: [DocumentsModule],
  providers: [{ provide: DocumentStorageClient, useExisting: DocumentsService }],
  exports: [DocumentStorageClient],
})
export class DocumentStorageClientModule {}
