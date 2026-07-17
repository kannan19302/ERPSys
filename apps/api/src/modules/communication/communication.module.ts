import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { DocumentStorageClientModule } from '../../common/integrations/document-storage-client.module';
import { RealtimeClientModule } from '../../common/integrations/realtime-client.module';

@Module({
  // Shared infrastructure is exposed through explicit common ports; this module
  // has no dependency on Documents or Notifications internals.
  imports: [DocumentStorageClientModule, RealtimeClientModule],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
