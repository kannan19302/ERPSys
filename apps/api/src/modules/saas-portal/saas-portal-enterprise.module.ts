import { Module } from "@nestjs/common";
import { SaasPortalEnterpriseService } from "./saas-portal-enterprise.service";
import { SaasPortalEnterpriseController } from "./saas-portal-enterprise.controller";

@Module({
  controllers: [SaasPortalEnterpriseController],
  providers: [SaasPortalEnterpriseService],
  exports: [SaasPortalEnterpriseService],
})
export class SaasPortalEnterpriseModule {}
