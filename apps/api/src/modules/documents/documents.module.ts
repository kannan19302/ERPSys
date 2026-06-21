import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [DriveController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
