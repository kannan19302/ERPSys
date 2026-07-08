import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowEngineController } from './workflow-engine.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [WorkflowController, WorkflowEngineController],
  providers: [WorkflowService, WorkflowEngineService],
  exports: [WorkflowService, WorkflowEngineService],
})
export class WorkflowModule {}
