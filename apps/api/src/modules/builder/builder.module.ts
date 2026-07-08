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

// Decomposed Sub-services
import { BuilderFormsService } from './builder-forms.service';
import { BuilderWorkflowsService } from './builder-workflows.service';
import { BuilderStatsService } from './builder-stats.service';
import { BuilderDashboardsService } from './builder-dashboards.service';
import { BuilderDevOpsService } from './builder-devops.service';
import { BuilderWebContentService } from './builder-web-content.service';

@Module({
  imports: [AiModule],
  controllers: [BuilderController, WebPublicController, WebStudioController, GovernanceController],
  providers: [
    BuilderService,
    WebCollectionsService,
    WebStudioService,
    BuilderGovernanceService,
    BuilderScriptingService,
    BuilderAiService,
    BuilderFormsService,
    BuilderWorkflowsService,
    BuilderStatsService,
    BuilderDashboardsService,
    BuilderDevOpsService,
    BuilderWebContentService,
  ],
  exports: [
    BuilderService,
    WebCollectionsService,
    WebStudioService,
    BuilderGovernanceService,
    BuilderScriptingService,
    BuilderAiService,
    BuilderFormsService,
    BuilderWorkflowsService,
    BuilderStatsService,
    BuilderDashboardsService,
    BuilderDevOpsService,
    BuilderWebContentService,
  ],
})
export class BuilderModule {}

