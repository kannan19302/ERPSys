// @ts-nocheck
import { Module } from "@nestjs/common";
import { AiEnterpriseService } from "./ai-enterprise.service";
import { AiEnterpriseController } from "./ai-enterprise.controller";

@Module({
  controllers: [AiEnterpriseController],
  providers: [AiEnterpriseService],
  exports: [AiEnterpriseService],
})
export class AiEnterpriseModule {}
