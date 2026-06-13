import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdvancedHrService } from './advanced-hr.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('advanced-hr')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AdvancedHrController {
  constructor(private readonly hrService: AdvancedHrService) {}

  @Get('salaries')
  @Permissions('hr.employee.read')
  async getSalaryStructures(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getSalaryStructures(req.user.tenantId);
  }

  @Post('salaries')
  @Permissions('hr.employee.create')
  async createSalaryStructure(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { employeeId: string; baseSalary: number; allowances?: unknown; deductions?: unknown }
  ): Promise<unknown> {
    return this.hrService.createSalaryStructure(req.user.tenantId, dto);
  }

  @Get('payroll')
  @Permissions('hr.payroll.read')
  async getPayrollRuns(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hrService.getPayrollRuns(req.user.tenantId);
  }

  @Post('payroll/run')
  @Permissions('hr.payroll.create')
  async runPayroll(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { periodStart: string; periodEnd: string }
  ): Promise<unknown> {
    return this.hrService.runPayroll(req.user.tenantId, dto);
  }

  @Get('leaves/policies')
  @Permissions('hr.leave.read')
  async getLeavePolicies(@Req() req: AuthenticatedRequest) {
    return this.hrService.getLeavePolicies(req.user.tenantId);
  }

  @Post('leaves/policies')
  @Permissions('hr.leave.create')
  async createLeavePolicy(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; leaveType: string; annualAllocation: number }
  ) {
    return this.hrService.createLeavePolicy(req.user.tenantId, dto);
  }

  @Get('leaves/requests')
  @Permissions('hr.leave.read')
  async getLeaveRequests(@Req() req: AuthenticatedRequest) {
    return this.hrService.getLeaveRequests(req.user.tenantId);
  }

  @Post('leaves/requests')
  @Permissions('hr.leave.create')
  async createLeaveRequest(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { employeeId: string; policyId: string; startDate: string; endDate: string; reason?: string }
  ) {
    return this.hrService.createLeaveRequest(req.user.tenantId, dto);
  }

  @Put('leaves/requests/:id/approve')
  @Permissions('hr.leave.create')
  async approveLeaveRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { status: 'APPROVED' | 'REJECTED' }
  ) {
    const approverId = req.user.userId || 'system';
    return this.hrService.approveLeaveRequest(req.user.tenantId, id, dto.status, approverId);
  }

  @Get('shifts')
  @Permissions('hr.employee.read')
  async getShiftSchedules(@Req() req: AuthenticatedRequest) {
    return this.hrService.getShiftSchedules(req.user.tenantId);
  }

  @Post('shifts')
  @Permissions('hr.employee.create')
  async createShiftSchedule(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { employeeId: string; startTime: string; endTime: string; note?: string }
  ) {
    return this.hrService.createShiftSchedule(req.user.tenantId, dto);
  }

  @Get('appraisals')
  @Permissions('hr.employee.read')
  async getAppraisals(@Req() req: AuthenticatedRequest) {
    return this.hrService.getAppraisals(req.user.tenantId);
  }

  @Post('appraisals')
  @Permissions('hr.employee.create')
  async createAppraisal(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { employeeId: string; reviewerId?: string; appraisalPeriod: string; score: number; feedback?: string }
  ) {
    const reviewerId = dto.reviewerId || req.user.userId || 'system';
    return this.hrService.createAppraisal(req.user.tenantId, {
      employeeId: dto.employeeId,
      reviewerId,
      appraisalPeriod: dto.appraisalPeriod,
      score: dto.score,
      feedback: dto.feedback
    });
  }

  @Get('trainings')
  @Permissions('hr.employee.read')
  async getTrainings(@Req() req: AuthenticatedRequest) {
    return this.hrService.getTrainings(req.user.tenantId);
  }

  @Post('trainings')
  @Permissions('hr.employee.create')
  async createTraining(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; description?: string; instructor?: string; startDate: string; endDate: string }
  ) {
    return this.hrService.createTraining(req.user.tenantId, dto);
  }
}
