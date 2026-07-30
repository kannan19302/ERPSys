// @ts-nocheck
import { ServiceManagementGeneratedController } from "./service-management-generated.controller";
import { ServiceManagementGeneratedService } from "./service-management-generated.service";
import { Module } from "@nestjs/common";
import { TicketLifecycleService } from "./services/ticket-lifecycle.service";
import { SlaManagementService } from "./services/sla-management.service";
import { TicketAssignmentService } from "./services/ticket-assignment.service";
import { TicketController } from "./controllers/ticket.controller";

@Module({
  imports: [],
  providers: [
    ServiceManagementGeneratedService,
    TicketLifecycleService,
    SlaManagementService,
    TicketAssignmentService,
  ],
  controllers: [ServiceManagementGeneratedController, TicketController],
  exports: [ServiceManagementGeneratedService, TicketLifecycleService],
})
export class ServiceManagementModule {}
