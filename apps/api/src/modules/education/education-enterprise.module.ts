import { Module } from "@nestjs/common";
import { EducationEnterpriseService } from "./education-enterprise.service";
import { EducationEnterpriseController } from "./education-enterprise.controller";

@Module({
  controllers: [EducationEnterpriseController],
  providers: [EducationEnterpriseService],
  exports: [EducationEnterpriseService],
})
export class EducationEnterpriseModule {}
