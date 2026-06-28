import { Module } from '@nestjs/common';
import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';
import { WebCollectionsService } from './web-collections.service';
import { WebPublicController } from './web-public.controller';
import { WebStudioController } from './web-studio.controller';
import { WebStudioService } from './web-studio.service';
import { BuilderGovernanceService } from './builder-governance.service';
import { BuilderScriptingService } from './builder-scripting.service';
import { BuilderAiService } from './builder-ai.service';
import { GovernanceController } from './governance.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [BuilderController, WebPublicController, WebStudioController, GovernanceController],
  providers: [BuilderService, WebCollectionsService, WebStudioService, BuilderGovernanceService, BuilderScriptingService, BuilderAiService],
  exports: [BuilderService, WebCollectionsService, WebStudioService, BuilderGovernanceService, BuilderScriptingService, BuilderAiService],
})
export class BuilderModule {}
