import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsTimesheetService } from "../services/projects-timesheet.service";
import {
  CreatePpmTimesheetSchema,
  SubmitTimesheetSchema,
  ApproveTimesheetSchema,
  RejectTimesheetSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags("projects-timesheet-approval")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class TimesheetApprovalController {
  constructor(private readonly service: ProjectsTimesheetService) {}

  @ApiOperation({ summary: "Get timesheets" })
  @Get("timesheets")
  @Permissions("projects.timesheet.read")
  async getTimesheets(
    @Req() req: AuthenticatedRequest,
    @Query("userId") userId?: string,
    @Query("status") status?: string,
  ) {
    return this.service.getTimesheets(req.user.tenantId, userId, status);
  }

  @ApiOperation({ summary: "Get timesheet by ID" })
  @Get("timesheets/:id")
  @Permissions("projects.timesheet.read")
  async getTimesheetById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getTimesheetById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create a timesheet" })
  @Post("timesheets")
  @Permissions("projects.timesheet.create")
  async createTimesheet(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreatePpmTimesheetSchema) dto: unknown,
  ) {
    return this.service.createTimesheet(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: "Submit a timesheet for approval" })
  @Post("timesheets/:timesheetId/submit")
  @Permissions("projects.timesheet.submit")
  async submitTimesheet(
    @Req() req: AuthenticatedRequest,
    @Param("timesheetId") timesheetId: string,
  ) {
    return this.service.submitTimesheet(req.user.tenantId, timesheetId);
  }

  @ApiOperation({ summary: "Approve a timesheet" })
  @Post("timesheets/:timesheetId/approve")
  @Permissions("projects.timesheet.approve")
  async approveTimesheet(
    @Req() req: AuthenticatedRequest,
    @Param("timesheetId") timesheetId: string,
    @ZodBody(ApproveTimesheetSchema) dto: unknown,
  ) {
    return this.service.approveTimesheet(
      req.user.tenantId,
      timesheetId,
      req.user.userId,
      (dto as any).notes,
    );
  }

  @ApiOperation({ summary: "Reject a timesheet" })
  @Post("timesheets/:timesheetId/reject")
  @Permissions("projects.timesheet.approve")
  async rejectTimesheet(
    @Req() req: AuthenticatedRequest,
    @Param("timesheetId") timesheetId: string,
    @ZodBody(RejectTimesheetSchema) dto: unknown,
  ) {
    return this.service.rejectTimesheet(
      req.user.tenantId,
      timesheetId,
      (dto as any).reason,
    );
  }

  @ApiOperation({ summary: "Get utilization rate" })
  @Get("utilization-rate")
  @Permissions("projects.timesheet.read")
  async getUtilizationRate(
    @Req() req: AuthenticatedRequest,
    @Query("userId") userId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.service.getUtilizationRate(
      req.user.tenantId,
      userId,
      startDate,
      endDate,
    );
  }

  @ApiOperation({ summary: "Get timesheet dashboard" })
  @Get("timesheet-dashboard")
  @Permissions("projects.timesheet.read")
  async getTimesheetDashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getTimesheetDashboard(req.user.tenantId);
  }
}
