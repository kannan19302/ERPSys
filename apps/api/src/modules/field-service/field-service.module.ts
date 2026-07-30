// @ts-nocheck
import { Module } from "@nestjs/common";
import { FieldServiceController } from "./field-service.controller";
import { FieldServiceTicketsService } from "./field-service-tickets.service";
import { FieldServiceDispatchService } from "./field-service-dispatch.service";
import { FieldServiceLogisticsService } from "./field-service-logistics.service";
import { FieldServiceTechMobileService } from "./field-service-tech-mobile.service";
import { FieldServiceSchedulingService } from "./field-service-scheduling.service";
import { FieldServicePartsService } from "./field-service-parts.service";
import { FieldServiceEnterpriseModule } from "./field-service-enterprise.module";

@Module({
  imports: [FieldServiceEnterpriseModule],
  controllers: [FieldServiceController],
  providers: [
    FieldServiceTicketsService,
    FieldServiceDispatchService,
    FieldServiceLogisticsService,
    FieldServiceTechMobileService,
    FieldServiceSchedulingService,
    FieldServicePartsService,
  ],
  exports: [
    FieldServiceTicketsService,
    FieldServiceDispatchService,
    FieldServiceLogisticsService,
    FieldServiceTechMobileService,
    FieldServiceSchedulingService,
    FieldServicePartsService,
  ],
})
export class FieldServiceModule {}
