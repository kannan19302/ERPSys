import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { CommunicationAdminService } from './communication-admin.service';
import { CommunicationBotsService } from './communication-bots.service';
import { DocumentStorageClientModule } from '../../common/integrations/document-storage-client.module';
import { RealtimeClientModule } from '../../common/integrations/realtime-client.module';

@Module({
  imports: [DocumentStorageClientModule, RealtimeClientModule],
  controllers: [CommunicationController],
  providers: [CommunicationService, CommunicationAdminService, CommunicationBotsService],
  exports: [CommunicationService, CommunicationAdminService, CommunicationBotsService],
})
export class CommunicationModule {}
