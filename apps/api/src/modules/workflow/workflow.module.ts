import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowEngineController } from './workflow-engine.controller';
import { AiClientModule } from '../../common/integrations/ai-client.module';

@Module({
  imports: [AiClientModule],
  controllers: [WorkflowController, WorkflowEngineController],
  providers: [WorkflowService, WorkflowEngineService],
  exports: [WorkflowService, WorkflowEngineService],
})
export class WorkflowModule {}
