import { Module } from "@nestjs/common";
import { BuilderEnterpriseService } from "./builder-enterprise.service";
import { BuilderEnterpriseController } from "./builder-enterprise.controller";

@Module({
  controllers: [BuilderEnterpriseController],
  providers: [BuilderEnterpriseService],
  exports: [BuilderEnterpriseService],
})
export class BuilderEnterpriseModule {}
