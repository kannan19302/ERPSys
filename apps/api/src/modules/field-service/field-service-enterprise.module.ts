// @ts-nocheck
import { Module } from "@nestjs/common";
import { FieldServiceEnterpriseService } from "./field-service-enterprise.service";
import { FieldServiceEnterpriseController } from "./field-service-enterprise.controller";

@Module({
  controllers: [FieldServiceEnterpriseController],
  providers: [FieldServiceEnterpriseService],
  exports: [FieldServiceEnterpriseService],
})
export class FieldServiceEnterpriseModule {}
