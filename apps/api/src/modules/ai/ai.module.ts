import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiCopilotService } from './ai-copilot.service';

@Module({
  providers: [AiService, AiCopilotService],
  exports: [AiService, AiCopilotService],
})
export class AiModule {}
