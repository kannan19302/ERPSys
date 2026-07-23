import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { CommunicationAdminService } from './communication-admin.service';
import { CommunicationBotsService } from './communication-bots.service';
import { CommunicationExpansionController } from './communication-expansion.controller';
import { CommunicationExpansionService } from './communication-expansion.service';
import { DocumentStorageClientModule } from '../../common/integrations/document-storage-client.module';
import { RealtimeClientModule } from '../../common/integrations/realtime-client.module';

@Module({
  imports: [DocumentStorageClientModule, RealtimeClientModule],
  controllers: [CommunicationController, CommunicationExpansionController],
  providers: [CommunicationService, CommunicationAdminService, CommunicationBotsService, CommunicationExpansionService],
  exports: [CommunicationService, CommunicationAdminService, CommunicationBotsService, CommunicationExpansionService],
})
export class CommunicationModule {}
