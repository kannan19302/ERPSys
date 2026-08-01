import { Module } from "@nestjs/common";
import { CommunicationEnterpriseController } from "./communication-enterprise.controller";
import { CommunicationEnterpriseService } from "./communication-enterprise.service";

@Module({
  controllers: [CommunicationEnterpriseController],
  providers: [
    CommunicationEnterpriseService,
    CommunicationEnterpriseController,
  ],
  exports: [CommunicationEnterpriseService],
})
export class CommunicationEnterpriseModule {}
