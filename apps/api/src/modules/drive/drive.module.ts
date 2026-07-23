import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { DriveService } from './drive.service';
import { DocumentStorageClientModule } from '../../common/integrations/document-storage-client.module';

@Module({
  imports: [DocumentStorageClientModule],
  controllers: [DriveController],
  providers: [DriveService],
  exports: [DriveService],
})
export class DriveModule {}
