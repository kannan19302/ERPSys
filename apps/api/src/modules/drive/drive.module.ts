import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { DriveDeepController } from './drive-deep.controller';
import { DriveService } from './drive.service';
import { DriveDeepService } from './drive-deep.service';
import { DocumentStorageClientModule } from '../../common/integrations/document-storage-client.module';

@Module({
  imports: [DocumentStorageClientModule],
  controllers: [DriveController, DriveDeepController],
  providers: [DriveService, DriveDeepService],
  exports: [DriveService, DriveDeepService],
})
export class DriveModule {}
