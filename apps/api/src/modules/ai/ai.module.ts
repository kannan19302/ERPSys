import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiCopilotService } from './ai-copilot.service';
import { AiAgentService } from './ai-agent.service';
import { AiConfigService } from './ai-config.service';
import { OllamaProcessService } from './ollama-process.service';
import { AiController } from './ai.controller';
import { AiAdminController } from './ai-admin.controller';
import { ReportingModule } from '../reporting/reporting.module';

@Module({
  imports: [ReportingModule],
  controllers: [AiController, AiAdminController],
  providers: [AiService, AiCopilotService, AiAgentService, AiConfigService, OllamaProcessService],
  exports: [AiService, AiCopilotService, AiAgentService, AiConfigService, OllamaProcessService],
})
export class AiModule {}
