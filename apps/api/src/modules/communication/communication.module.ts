import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { DocumentsModule } from '../documents/documents.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  // Cross-module service injection (not a domain-boundary violation): DocumentsModule and
  // NotificationsModule are exported here for the same reason ai.module.ts imports
  // ReportingModule and builder.module.ts imports AiModule elsewhere in this codebase — Drive's
  // storage service and the shared /ws gateway are shared infrastructure, not domain internals.
  // Per .ai/CONNECT_MODULE_REQUIREMENTS.md section 4: "the gateway wiring in Phase A is a
  // legitimate exception since notifications.gateway.ts is explicitly the shared real-time
  // transport, not a domain module being reached into." The same reasoning applies to Drive's
  // storage service (public service methods only — no import of Drive's S3 client or repository).
  imports: [DocumentsModule, NotificationsModule],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
