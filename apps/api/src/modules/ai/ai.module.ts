import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiCopilotService } from './ai-copilot.service';
import { AiController } from './ai.controller';
import { ReportingModule } from '../reporting/reporting.module';

@Module({
  imports: [ReportingModule],
  controllers: [AiController],
  providers: [AiService, AiCopilotService],
  exports: [AiService, AiCopilotService],
})
export class AiModule {}
