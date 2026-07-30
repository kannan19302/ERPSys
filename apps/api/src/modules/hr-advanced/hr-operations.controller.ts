// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrOperationsService } from "./hr-operations.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  createHrTicketSchema,
  createEmployeeGrievanceSchema,
  createBackgroundCheckRequestSchema,
  createVisaRecordSchema,
  createEmployeeWellnessProgramSchema,
} from "@unerp/shared";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced-operations")
@ApiBearerAuth()
@Controller("hr-advanced/operations")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrOperationsController {
  constructor(private readonly hrOperationsService: HrOperationsService) {}

  // ══ TICKET CATEGORIES ══

  @Get("ticket-categories")
  @Permissions("hr.tickets.read")
  @ApiOperation({ summary: "List ticket categories" })
  async getTicketCategories(@Req() req: AuthenticatedRequest) {
    return this.hrOperationsService.getTicketCategories(req.user.tenantId);
  }

  @Get("ticket-categories/:id")
  @Permissions("hr.tickets.read")
  @ApiOperation({ summary: "Get ticket category by ID" })
  async getTicketCategoryById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.getTicketCategoryById(
      req.user.tenantId,
      id,
    );
  }

  @Post("ticket-categories")
  @Permissions("hr.tickets.create")
  @ApiOperation({ summary: "Create ticket category" })
  async createTicketCategory(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        slaHours: z.number().int().optional(),
      }),
    )
    dto: any,
  ) {
    return this.hrOperationsService.createTicketCategory(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("ticket-categories/:id")
  @Permissions("hr.tickets.update")
  @ApiOperation({ summary: "Update ticket category" })
  async updateTicketCategory(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        slaHours: z.number().int().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    dto: any,
  ) {
    return this.hrOperationsService.updateTicketCategory(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("ticket-categories/:id")
  @Permissions("hr.tickets.delete")
  @ApiOperation({ summary: "Delete ticket category" })
  async deleteTicketCategory(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.deleteTicketCategory(req.user.tenantId, id);
  }

  // ══ HR TICKETS ══

  @Get("tickets")
  @Permissions("hr.tickets.read")
  @ApiOperation({ summary: "List HR tickets with filters and pagination" })
  async getHrTickets(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrOperationsService.getHrTickets(req.user.tenantId, q);
  }

  @Get("tickets/dashboard")
  @Permissions("hr.tickets.read")
  @ApiOperation({ summary: "Get ticket dashboard counts" })
  async getTicketDashboard(@Req() req: AuthenticatedRequest) {
    return this.hrOperationsService.getTicketDashboard(req.user.tenantId);
  }

  @Get("tickets/:id")
  @Permissions("hr.tickets.read")
  @ApiOperation({ summary: "Get HR ticket by ID" })
  async getHrTicketById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.getHrTicketById(req.user.tenantId, id);
  }

  @Post("tickets")
  @Permissions("hr.tickets.create")
  @ApiOperation({ summary: "Create HR ticket" })
  async createHrTicket(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createHrTicketSchema) dto: any,
  ) {
    return this.hrOperationsService.createHrTicket(req.user.tenantId, dto);
  }

  @Patch("tickets/:id")
  @Permissions("hr.tickets.update")
  @ApiOperation({ summary: "Update HR ticket" })
  async updateHrTicket(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrOperationsService.updateHrTicket(req.user.tenantId, id, dto);
  }

  @Post("tickets/:id/assign")
  @Permissions("hr.tickets.update")
  @ApiOperation({ summary: "Assign ticket to an employee" })
  async assignHrTicket(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({ assigneeId: z.string().min(1), note: z.string().optional() }),
    )
    dto: any,
  ) {
    return this.hrOperationsService.assignHrTicket(req.user.tenantId, id, dto);
  }

  @Post("tickets/:id/resolve")
  @Permissions("hr.tickets.update")
  @ApiOperation({ summary: "Resolve an HR ticket" })
  async resolveHrTicket(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        resolution: z.string().min(1),
        satisfactionScore: z.number().int().min(1).max(5).optional(),
      }),
    )
    dto: any,
  ) {
    return this.hrOperationsService.resolveHrTicket(req.user.tenantId, id, dto);
  }

  @Delete("tickets/:id")
  @Permissions("hr.tickets.delete")
  @ApiOperation({ summary: "Delete HR ticket" })
  async deleteHrTicket(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.deleteHrTicket(req.user.tenantId, id);
  }

  // ══ GRIEVANCES ══

  @Get("grievances")
  @Permissions("hr.grievances.read")
  @ApiOperation({ summary: "List grievances by employeeId or status" })
  async getGrievances(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
    @Query("status") status?: string,
  ) {
    return this.hrOperationsService.getGrievances(
      req.user.tenantId,
      employeeId,
      status,
    );
  }

  @Get("grievances/:id")
  @Permissions("hr.grievances.read")
  @ApiOperation({ summary: "Get grievance by ID" })
  async getGrievanceById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.getGrievanceById(req.user.tenantId, id);
  }

  @Post("grievances")
  @Permissions("hr.grievances.create")
  @ApiOperation({ summary: "Create grievance" })
  async createGrievance(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createEmployeeGrievanceSchema) dto: any,
  ) {
    return this.hrOperationsService.createGrievance(req.user.tenantId, dto);
  }

  @Patch("grievances/:id")
  @Permissions("hr.grievances.update")
  @ApiOperation({ summary: "Update grievance" })
  async updateGrievance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrOperationsService.updateGrievance(req.user.tenantId, id, dto);
  }

  @Post("grievances/:id/resolve")
  @Permissions("hr.grievances.update")
  @ApiOperation({ summary: "Resolve grievance" })
  async resolveGrievance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ resolution: z.string().min(1) })) dto: any,
  ) {
    return this.hrOperationsService.resolveGrievance(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("grievances/:id")
  @Permissions("hr.grievances.delete")
  @ApiOperation({ summary: "Delete grievance" })
  async deleteGrievance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.deleteGrievance(req.user.tenantId, id);
  }

  // ══ DISPUTE RESOLUTIONS ══

  @Get("disputes")
  @Permissions("hr.disputes.read")
  @ApiOperation({ summary: "List dispute resolutions by status" })
  async getDisputeResolutions(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.hrOperationsService.getDisputeResolutions(
      req.user.tenantId,
      status,
    );
  }

  @Get("disputes/:id")
  @Permissions("hr.disputes.read")
  @ApiOperation({ summary: "Get dispute resolution by ID" })
  async getDisputeResolutionById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.getDisputeResolutionById(
      req.user.tenantId,
      id,
    );
  }

  @Post("disputes")
  @Permissions("hr.disputes.create")
  @ApiOperation({ summary: "Create dispute resolution" })
  async createDisputeResolution(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        disputeType: z.string().min(1),
        subject: z.string().min(1),
        description: z.string().min(1),
        initiatingParty: z.string().min(1),
        respondentId: z.string().optional(),
        mediatorId: z.string().optional(),
      }),
    )
    dto: any,
  ) {
    return this.hrOperationsService.createDisputeResolution(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("disputes/:id")
  @Permissions("hr.disputes.update")
  @ApiOperation({ summary: "Update dispute resolution" })
  async updateDisputeResolution(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrOperationsService.updateDisputeResolution(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("disputes/:id/resolve")
  @Permissions("hr.disputes.update")
  @ApiOperation({ summary: "Resolve a dispute" })
  async resolveDispute(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ resolution: z.string().min(1) })) dto: any,
  ) {
    return this.hrOperationsService.resolveDispute(req.user.tenantId, id, dto);
  }

  @Delete("disputes/:id")
  @Permissions("hr.disputes.delete")
  @ApiOperation({ summary: "Delete dispute resolution" })
  async deleteDisputeResolution(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.deleteDisputeResolution(
      req.user.tenantId,
      id,
    );
  }

  // ══ BACKGROUND CHECKS ══

  @Get("background-checks")
  @Permissions("hr.background-checks.read")
  @ApiOperation({ summary: "List background checks by status" })
  async getBackgroundChecks(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.hrOperationsService.getBackgroundChecks(
      req.user.tenantId,
      status,
    );
  }

  @Get("background-checks/:id")
  @Permissions("hr.background-checks.read")
  @ApiOperation({ summary: "Get background check by ID" })
  async getBackgroundCheckById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.getBackgroundCheckById(
      req.user.tenantId,
      id,
    );
  }

  @Post("background-checks")
  @Permissions("hr.background-checks.create")
  @ApiOperation({ summary: "Create background check request" })
  async createBackgroundCheck(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBackgroundCheckRequestSchema) dto: any,
  ) {
    return this.hrOperationsService.createBackgroundCheck(
      req.user.tenantId,
      dto,
      req.user.userId,
    );
  }

  @Patch("background-checks/:id")
  @Permissions("hr.background-checks.update")
  @ApiOperation({ summary: "Update background check" })
  async updateBackgroundCheck(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrOperationsService.updateBackgroundCheck(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("background-checks/:id/complete")
  @Permissions("hr.background-checks.update")
  @ApiOperation({ summary: "Complete background check with result" })
  async completeBackgroundCheck(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        result: z.string().min(1),
        isClear: z.boolean(),
        documentUrl: z.string().optional(),
      }),
    )
    dto: any,
  ) {
    return this.hrOperationsService.completeBackgroundCheck(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("background-checks/:id")
  @Permissions("hr.background-checks.delete")
  @ApiOperation({ summary: "Delete background check" })
  async deleteBackgroundCheck(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.deleteBackgroundCheck(
      req.user.tenantId,
      id,
    );
  }

  // ══ VISA RECORDS ══

  @Get("visas")
  @Permissions("hr.visa.read")
  @ApiOperation({ summary: "List visa records by employeeId" })
  async getVisaRecords(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrOperationsService.getVisaRecords(
      req.user.tenantId,
      employeeId,
    );
  }

  @Get("visas/expiring")
  @Permissions("hr.visa.read")
  @ApiOperation({ summary: "List visas expiring within N days" })
  async getExpiringVisas(
    @Req() req: AuthenticatedRequest,
    @Query("days") days?: string,
  ) {
    return this.hrOperationsService.getExpiringVisas(
      req.user.tenantId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get("visas/:id")
  @Permissions("hr.visa.read")
  @ApiOperation({ summary: "Get visa record by ID" })
  async getVisaRecordById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.getVisaRecordById(req.user.tenantId, id);
  }

  @Post("visas")
  @Permissions("hr.visa.create")
  @ApiOperation({ summary: "Create visa record" })
  async createVisaRecord(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createVisaRecordSchema) dto: any,
  ) {
    return this.hrOperationsService.createVisaRecord(req.user.tenantId, dto);
  }

  @Patch("visas/:id")
  @Permissions("hr.visa.update")
  @ApiOperation({ summary: "Update visa record" })
  async updateVisaRecord(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrOperationsService.updateVisaRecord(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("visas/:id")
  @Permissions("hr.visa.delete")
  @ApiOperation({ summary: "Delete visa record" })
  async deleteVisaRecord(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.deleteVisaRecord(req.user.tenantId, id);
  }

  // ══ IMMIGRATION DOCUMENTS ══

  @Get("immigration-documents")
  @Permissions("hr.immigration.read")
  @ApiOperation({ summary: "List immigration documents by employeeId" })
  async getImmigrationDocuments(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrOperationsService.getImmigrationDocuments(
      req.user.tenantId,
      employeeId,
    );
  }

  @Get("immigration-documents/expiring")
  @Permissions("hr.immigration.read")
  @ApiOperation({
    summary: "List immigration documents expiring within N days",
  })
  async getExpiringImmigrationDocuments(
    @Req() req: AuthenticatedRequest,
    @Query("days") days?: string,
  ) {
    return this.hrOperationsService.getExpiringImmigrationDocuments(
      req.user.tenantId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get("immigration-documents/:id")
  @Permissions("hr.immigration.read")
  @ApiOperation({ summary: "Get immigration document by ID" })
  async getImmigrationDocumentById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.getImmigrationDocumentById(
      req.user.tenantId,
      id,
    );
  }

  @Post("immigration-documents")
  @Permissions("hr.immigration.create")
  @ApiOperation({ summary: "Create immigration document" })
  async createImmigrationDocument(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        employeeId: z.string().min(1),
        documentType: z.string().min(1),
        documentNumber: z.string().min(1),
        issuingAuthority: z.string().min(1),
        issuedDate: z.string().min(1),
        expiryDate: z.string().optional(),
        isPermanent: z.boolean().optional(),
        notes: z.string().optional(),
      }),
    )
    dto: any,
  ) {
    return this.hrOperationsService.createImmigrationDocument(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("immigration-documents/:id")
  @Permissions("hr.immigration.update")
  @ApiOperation({ summary: "Update immigration document" })
  async updateImmigrationDocument(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrOperationsService.updateImmigrationDocument(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("immigration-documents/:id")
  @Permissions("hr.immigration.delete")
  @ApiOperation({ summary: "Delete immigration document" })
  async deleteImmigrationDocument(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.deleteImmigrationDocument(
      req.user.tenantId,
      id,
    );
  }

  // ══ WELLNESS PROGRAMS ══

  @Get("wellness-programs")
  @Permissions("hr.wellness-programs.read")
  @ApiOperation({
    summary: "List wellness programs filtered by programType/isActive",
  })
  async getWellnessPrograms(
    @Req() req: AuthenticatedRequest,
    @Query("programType") programType?: string,
    @Query("isActive") isActive?: string,
  ) {
    return this.hrOperationsService.getWellnessPrograms(
      req.user.tenantId,
      programType,
      isActive === "true" ? true : isActive === "false" ? false : undefined,
    );
  }

  @Get("wellness-programs/:id")
  @Permissions("hr.wellness-programs.read")
  @ApiOperation({ summary: "Get wellness program by ID" })
  async getWellnessProgramById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.getWellnessProgramById(
      req.user.tenantId,
      id,
    );
  }

  @Post("wellness-programs")
  @Permissions("hr.wellness-programs.create")
  @ApiOperation({ summary: "Create wellness program" })
  async createWellnessProgram(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createEmployeeWellnessProgramSchema) dto: any,
  ) {
    return this.hrOperationsService.createWellnessProgram(
      req.user.tenantId,
      dto,
    );
  }

  @Patch("wellness-programs/:id")
  @Permissions("hr.wellness-programs.update")
  @ApiOperation({ summary: "Update wellness program" })
  async updateWellnessProgram(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrOperationsService.updateWellnessProgram(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("wellness-programs/:id")
  @Permissions("hr.wellness-programs.delete")
  @ApiOperation({ summary: "Delete wellness program" })
  async deleteWellnessProgram(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.deleteWellnessProgram(
      req.user.tenantId,
      id,
    );
  }

  // ══ WELLNESS ACTIVITIES ══

  @Get("wellness-activities")
  @Permissions("hr.wellness-programs.read")
  @ApiOperation({
    summary: "List wellness activities by programId or employeeId",
  })
  async getWellnessActivities(
    @Req() req: AuthenticatedRequest,
    @Query("programId") programId?: string,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrOperationsService.getWellnessActivities(
      req.user.tenantId,
      programId,
      employeeId,
    );
  }

  @Get("wellness-activities/:id")
  @Permissions("hr.wellness-programs.read")
  @ApiOperation({ summary: "Get wellness activity by ID" })
  async getWellnessActivityById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.getWellnessActivityById(
      req.user.tenantId,
      id,
    );
  }

  @Post("wellness-activities")
  @Permissions("hr.wellness-programs.create")
  @ApiOperation({ summary: "Log a wellness activity" })
  async logWellnessActivity(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        programId: z.string().min(1),
        employeeId: z.string().min(1),
        activityType: z.string().min(1),
        activityDate: z.string().min(1),
        durationMin: z.number().int().optional(),
        metricValue: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    dto: any,
  ) {
    return this.hrOperationsService.logWellnessActivity(req.user.tenantId, dto);
  }

  @Patch("wellness-activities/:id")
  @Permissions("hr.wellness-programs.update")
  @ApiOperation({ summary: "Update wellness activity" })
  async updateWellnessActivity(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any()) dto: any,
  ) {
    return this.hrOperationsService.updateWellnessActivity(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("wellness-activities/:id")
  @Permissions("hr.wellness-programs.delete")
  @ApiOperation({ summary: "Delete wellness activity" })
  async deleteWellnessActivity(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrOperationsService.deleteWellnessActivity(
      req.user.tenantId,
      id,
    );
  }

  // ══ ANALYTICS ══

  @Get("analytics")
  @Permissions(
    "hr.tickets.read",
    "hr.grievances.read",
    "hr.background-checks.read",
    "hr.visa.read",
  )
  @ApiOperation({ summary: "Get operations analytics summary" })
  async getOperationsAnalytics(@Req() req: AuthenticatedRequest) {
    return this.hrOperationsService.getOperationsAnalytics(req.user.tenantId);
  }
}
