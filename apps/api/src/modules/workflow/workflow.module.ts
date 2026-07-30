// @ts-nocheck
import { Module } from "@nestjs/common";
import { WorkflowController } from "./workflow.controller";
import { WorkflowService } from "./workflow.service";
import { WorkflowEngineService } from "./workflow-engine.service";
import { WorkflowEngineController } from "./workflow-engine.controller";
import { WorkflowEnterpriseModule } from "./workflow-enterprise.module";
import { WorkflowAdvancedController } from "./workflow-advanced.controller";
import { WorkflowAdvancedService } from "./workflow-advanced.service";
import { WorkflowExpansionController } from "./workflow-expansion.controller";
import { WorkflowExtController } from "./workflow-ext.controller";
import { AiClientModule } from "../../common/integrations/ai-client.module";

@Module({
  imports: [AiClientModule, WorkflowEnterpriseModule],
  controllers: [
    WorkflowController,
    WorkflowEngineController,
    WorkflowAdvancedController,
    WorkflowExpansionController,
    WorkflowExtController,
  ],
  providers: [WorkflowService, WorkflowEngineService, WorkflowAdvancedService],
  exports: [WorkflowService, WorkflowEngineService, WorkflowAdvancedService],
})
export class WorkflowModule {}
