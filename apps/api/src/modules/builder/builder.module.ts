// @ts-nocheck
import { Module } from "@nestjs/common";
import { BuilderController } from "./builder.controller";
import { BuilderService } from "./builder.service";
import { WebCollectionsService } from "./web-collections.service";
import { WebPublicController } from "./web-public.controller";
import { WebStudioController } from "./web-studio.controller";
import { WebStudioService } from "./web-studio.service";
import { BuilderGovernanceService } from "./builder-governance.service";
import { BuilderScriptingService } from "./builder-scripting.service";
import { BuilderAiService } from "./builder-ai.service";
import { GovernanceController } from "./governance.controller";
import { AiClientModule } from "../../common/integrations/ai-client.module";

// Decomposed Sub-services
import { BuilderFormsService } from "./builder-forms.service";
import { BuilderWorkflowsService } from "./builder-workflows.service";
import { BuilderStatsService } from "./builder-stats.service";
import { BuilderDashboardsService } from "./builder-dashboards.service";
import { BuilderDevOpsService } from "./builder-devops.service";
import { BuilderWebContentService } from "./builder-web-content.service";
import { BuilderExpansionController } from "./builder-expansion.controller";
import { BuilderExpansionService } from "./builder-expansion.service";

// Feature Pack Services
import { BuilderAdvancedFormsService } from "./services/builder-advanced-forms.service";
import { BuilderBpmnService } from "./services/builder-bpmn.service";
import { BuilderApiService } from "./services/builder-api.service";
import { BuilderRulesService } from "./services/builder-rules.service";
import { BuilderEtlService } from "./services/builder-etl.service";
import { BuilderMobileService } from "./services/builder-mobile.service";
import { BuilderThemeService } from "./services/builder-theme.service";
import { BuilderAbTestingService } from "./services/builder-ab-testing.service";

// Feature Pack Controllers
import { AdvancedFormsController } from "./controllers/advanced-forms.controller";
import { BpmnController } from "./controllers/bpmn.controller";
import { ApiBuilderController } from "./controllers/api-builder.controller";
import { RulesEngineController } from "./controllers/rules-engine.controller";
import { EtlController } from "./controllers/etl.controller";
import { MobileBuilderController } from "./controllers/mobile-builder.controller";
import { ThemeManagerController } from "./controllers/theme-manager.controller";
import { AbTestingController } from "./controllers/ab-testing.controller";

import { BuilderDeepExpansionController } from "./controllers/builder-deep-expansion.controller";
import { BuilderDeepExpansionService } from "./services/builder-deep-expansion.service";
import { BuilderEnterpriseModule } from "./builder-enterprise.module";

@Module({
  imports: [AiClientModule, BuilderEnterpriseModule],
  controllers: [
    BuilderDeepExpansionController,
    BuilderController,
    WebPublicController,
    WebStudioController,
    GovernanceController,
    BuilderExpansionController,
    AdvancedFormsController,
    BpmnController,
    ApiBuilderController,
    RulesEngineController,
    EtlController,
    MobileBuilderController,
    ThemeManagerController,
    AbTestingController,
  ],
  providers: [
    BuilderDeepExpansionService,
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
    BuilderExpansionService,
    BuilderAdvancedFormsService,
    BuilderBpmnService,
    BuilderApiService,
    BuilderRulesService,
    BuilderEtlService,
    BuilderMobileService,
    BuilderThemeService,
    BuilderAbTestingService,
  ],
  exports: [
    BuilderDeepExpansionService,
    BuilderService,
    WebCollectionsService,
    WebStudioService,
    BuilderGovernanceService,
    BuilderScriptingService,
  ],
})
export class BuilderModule {}
