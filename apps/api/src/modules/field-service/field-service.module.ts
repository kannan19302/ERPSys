import { Module } from "@nestjs/common";
import { FieldServiceController } from "./field-service.controller";
import { FieldServiceTicketsService } from "./field-service-tickets.service";
import { FieldServiceDispatchService } from "./field-service-dispatch.service";
import { FieldServiceLogisticsService } from "./field-service-logistics.service";

@Module({
  controllers: [FieldServiceController],
  providers: [
    FieldServiceTicketsService,
    FieldServiceDispatchService,
    FieldServiceLogisticsService,
  ],
  exports: [
    FieldServiceTicketsService,
    FieldServiceDispatchService,
    FieldServiceLogisticsService,
  ],
})
export class FieldServiceModule {}
