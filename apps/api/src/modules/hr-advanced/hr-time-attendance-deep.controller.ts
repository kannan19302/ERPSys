// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrTimeAttendanceDeepService } from "./hr-time-attendance-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced / time-attendance-deep")
@ApiBearerAuth()
@Controller("hr-advanced/time-attendance-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrTimeAttendanceDeepController {
  constructor(private readonly svc: HrTimeAttendanceDeepService) {}

  @Post("geo-clock-in")
  @Permissions("hr.attendance.clock.create")
  @ApiOperation({ summary: "Geo-fenced mobile time clock-in verification" })
  async geoClockIn(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      employeeId: string;
      latitude?: number;
      longitude?: number;
      deviceIdentifier?: string;
    },
  ) {
    return { data: await this.svc.geoClockIn(req.user.tenantId, body) };
  }

  @Post("shift-swaps")
  @Permissions("hr.attendance.swap.create")
  @ApiOperation({ summary: "Request peer-to-peer shift swap approval" })
  async requestShiftSwap(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      requesterEmployeeId: string;
      targetEmployeeId: string;
      shiftDate: string;
      reason?: string;
    },
  ) {
    return { data: await this.svc.requestShiftSwap(req.user.tenantId, body) };
  }

  @Get("overtime-calculator")
  @Permissions("hr.attendance.overtime.read")
  @ApiOperation({
    summary: "Get 1.5x and 2.0x overtime multiplier pay calculations",
  })
  async getOvertimeMultiplierCalculations(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId: string,
    @Query("hoursWorked") hoursWorked: string,
  ) {
    return {
      data: await this.svc.getOvertimeMultiplierCalculations(
        req.user.tenantId,
        employeeId,
        parseFloat(hoursWorked || "45"),
      ),
    };
  }

  @Get("meal-break-compliance")
  @Permissions("hr.attendance.break.read")
  @ApiOperation({
    summary: "Get mandatory meal & rest break compliance report",
  })
  async getMealBreakComplianceReport(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getMealBreakComplianceReport(req.user.tenantId),
    };
  }
}
