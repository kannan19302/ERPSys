import { Module } from "@nestjs/common";
import { HealthcareEnterpriseService } from "./healthcare-enterprise.service";
import { HealthcareEnterpriseController } from "./healthcare-enterprise.controller";

@Module({
  controllers: [HealthcareEnterpriseController],
  providers: [HealthcareEnterpriseService],
  exports: [HealthcareEnterpriseService],
})
export class HealthcareEnterpriseModule {}
