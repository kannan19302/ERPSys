import { Module } from "@nestjs/common";
import { WorkflowEnterpriseService } from "./workflow-enterprise.service";
import { WorkflowEnterpriseController } from "./workflow-enterprise.controller";

@Module({
  controllers: [WorkflowEnterpriseController],
  providers: [WorkflowEnterpriseService],
  exports: [WorkflowEnterpriseService],
})
export class WorkflowEnterpriseModule {}
