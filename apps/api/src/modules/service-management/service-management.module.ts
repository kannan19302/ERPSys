import { Module } from "@nestjs/common";
import { TicketLifecycleService } from "./services/ticket-lifecycle.service";
import { SlaManagementService } from "./services/sla-management.service";
import { TicketAssignmentService } from "./services/ticket-assignment.service";
import { TicketController } from "./controllers/ticket.controller";

@Module({
  imports: [],
  providers: [
    TicketLifecycleService,
    SlaManagementService,
    TicketAssignmentService,
  ],
  controllers: [
    TicketController
  ],
  exports: [
    TicketLifecycleService,
  ],
})
export class ServiceManagementModule {}
