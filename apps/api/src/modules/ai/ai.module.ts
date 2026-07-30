// @ts-nocheck
import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiCopilotService } from './ai-copilot.service';
import { AiAgentService } from './ai-agent.service';
import { AiConfigService } from './ai-config.service';
import { OllamaProcessService } from './ollama-process.service';
import { AiController } from './ai.controller';
import { AiAdminController } from './ai-admin.controller';
import { AiExpansionController } from './ai-expansion.controller';
import { AiExpansionService } from './ai-expansion.service';
import { AiDeepService } from './ai-deep.service';
import { AiDeepController } from './ai-deep.controller';
import { AiEnterpriseModule } from './ai-enterprise.module';
import { ReportingQueryClientModule } from '../../common/integrations/reporting-query-client.module';

@Module({
  imports: [ReportingQueryClientModule, AiEnterpriseModule],
  controllers: [AiController, AiAdminController, AiExpansionController, AiDeepController],
  providers: [AiService, AiCopilotService, AiAgentService, AiConfigService, OllamaProcessService, AiExpansionService, AiDeepService],
  exports: [AiService, AiCopilotService, AiAgentService, AiConfigService, OllamaProcessService, AiExpansionService, AiDeepService],
})
export class AiModule {}
