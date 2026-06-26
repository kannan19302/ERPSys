import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiCopilotService } from './ai-copilot.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [AiService, AiCopilotService],
  exports: [AiService, AiCopilotService],
})
export class AiModule {}
