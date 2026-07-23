import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Req, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { HrService } from './hr.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('hr')
@ApiBearerAuth()
@Controller('hr')
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ── Dashboard ──
  @Get('dashboard')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get HR dashboard stats' })
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return this.hrService.getDashboard(req.user.tenantId);
  }

  // ── Employees ──
  @Get('employees')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List employees' })
  async getEmployees(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrService.getEmployees(req.user.tenantId, q);
  }

  @Get('employees/stats')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get employee stats' })
  async getEmployeeStats(@Req() req: AuthenticatedRequest) {
    return this.hrService.getEmployeeStats(req.user.tenantId);
  }

  @Get('employees/:id')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get employee by ID' })
  async getEmployeeById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getEmployeeById(req.user.tenantId, id);
  }

  @Post('employees')
  @Permissions('hr.employee.create')
  @ApiOperation({ summary: 'Create employee' })
  async createEmployee(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createEmployee(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('employees/:id')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Update employee' })
  async updateEmployee(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateEmployee(req.user.tenantId, id, dto);
  }

  @Delete('employees/:id')
  @Permissions('hr.employee.delete')
  @ApiOperation({ summary: 'Delete employee' })
  async deleteEmployee(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteEmployee(req.user.tenantId, id);
  }

  @Post('employees/bulk')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Bulk action on employees' })
  async bulkAction(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.bulkAction(req.user.tenantId, dto.action, dto.ids, dto.data);
  }

  @Post('employees/:id/upload-document')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Upload employee document' })
  async uploadDocument(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.createEmployeeDocument(req.user.tenantId, { ...dto, employeeId: id });
  }

  @Post('employees/:id/assign-asset')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Assign asset to employee' })
  async assignAsset(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.assignAsset(req.user.tenantId, { ...dto, employeeId: id });
  }

  // ── Departments ──
  @Get('departments')
  @Permissions('hr.department.read')
  @ApiOperation({ summary: 'List departments' })
  async getDepartments(@Req() req: AuthenticatedRequest) {
    return this.hrService.getDepartments(req.user.tenantId);
  }

  @Get('departments/:id')
  @Permissions('hr.department.read')
  @ApiOperation({ summary: 'Get department by ID' })
  async getDepartmentById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getDepartmentById(req.user.tenantId, id);
  }

  @Post('departments')
  @Permissions('hr.department.create')
  @ApiOperation({ summary: 'Create department' })
  async createDepartment(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createDepartment(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('departments/:id')
  @Permissions('hr.department.update')
  @ApiOperation({ summary: 'Update department' })
  async updateDepartment(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateDepartment(req.user.tenantId, id, dto);
  }

  @Delete('departments/:id')
  @Permissions('hr.department.delete')
  @ApiOperation({ summary: 'Delete department' })
  async deleteDepartment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteDepartment(req.user.tenantId, id);
  }

  @Get('departments/tree')
  @Permissions('hr.department.read')
  @ApiOperation({ summary: 'Get department tree' })
  async getDepartmentTree(@Req() req: AuthenticatedRequest) {
    return this.hrService.getDepartmentTree(req.user.tenantId);
  }

  // ── Positions ──
  @Get('positions')
  @Permissions('hr.department.read')
  @ApiOperation({ summary: 'List positions' })
  async getPositions(@Req() req: AuthenticatedRequest) {
    return this.hrService.getPositions(req.user.tenantId);
  }

  @Get('positions/:id')
  @Permissions('hr.department.read')
  @ApiOperation({ summary: 'Get position by ID' })
  async getPositionById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getPositionById(req.user.tenantId, id);
  }

  @Post('positions')
  @Permissions('hr.department.create')
  @ApiOperation({ summary: 'Create position' })
  async createPosition(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createPosition(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('positions/:id')
  @Permissions('hr.department.update')
  @ApiOperation({ summary: 'Update position' })
  async updatePosition(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updatePosition(req.user.tenantId, id, dto);
  }

  @Delete('positions/:id')
  @Permissions('hr.department.delete')
  @ApiOperation({ summary: 'Delete position' })
  async deletePosition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deletePosition(req.user.tenantId, id);
  }

  // ── Attendance ──
  @Get('attendance')
  @Permissions('hr.attendance.read')
  @ApiOperation({ summary: 'List attendance records' })
  async getAttendance(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrService.getAttendance(req.user.tenantId, q);
  }

  @Get('attendance/:id')
  @Permissions('hr.attendance.read')
  @ApiOperation({ summary: 'Get attendance by ID' })
  async getAttendanceById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getAttendanceById(req.user.tenantId, id);
  }

  @Post('attendance')
  @Permissions('hr.attendance.read')
  @ApiOperation({ summary: 'Create attendance record' })
  async createAttendance(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createAttendance(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('attendance/:id')
  @Permissions('hr.attendance.read')
  @ApiOperation({ summary: 'Update attendance' })
  async updateAttendance(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateAttendance(req.user.tenantId, id, dto);
  }

  @Post('attendance/bulk')
  @Permissions('hr.attendance.read')
  @ApiOperation({ summary: 'Bulk create attendance' })
  async bulkAttendance(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.bulkCreateAttendance(req.user.tenantId, dto.records);
  }

  @Get('attendance/summary/:employeeId/:year/:month')
  @Permissions('hr.attendance.read')
  @ApiOperation({ summary: 'Get attendance summary' })
  async getAttendanceSummary(@Req() req: AuthenticatedRequest, @Param('employeeId') employeeId: string, @Param('year') year: string, @Param('month') month: string) {
    return this.hrService.getAttendanceSummary(req.user.tenantId, employeeId, parseInt(year), parseInt(month));
  }

  @Get('attendance/overview/:year/:month')
  @Permissions('hr.attendance.read')
  @ApiOperation({ summary: 'Get attendance overview' })
  async getAttendanceOverview(@Req() req: AuthenticatedRequest, @Param('year') year: string, @Param('month') month: string) {
    return this.hrService.getAttendanceOverview(req.user.tenantId, parseInt(year), parseInt(month));
  }

  // ── Shifts ──
  @Get('shifts')
  @Permissions('hr.shift.read')
  @ApiOperation({ summary: 'List shifts' })
  async getShifts(@Req() req: AuthenticatedRequest) {
    return this.hrService.getShifts(req.user.tenantId);
  }

  @Get('shifts/:id')
  @Permissions('hr.shift.read')
  @ApiOperation({ summary: 'Get shift by ID' })
  async getShiftById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getShiftById(req.user.tenantId, id);
  }

  @Post('shifts')
  @Permissions('hr.shift.create')
  @ApiOperation({ summary: 'Create shift' })
  async createShift(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createShift(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('shifts/:id')
  @Permissions('hr.shift.create')
  @ApiOperation({ summary: 'Update shift' })
  async updateShift(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateShift(req.user.tenantId, id, dto);
  }

  @Delete('shifts/:id')
  @Permissions('hr.shift.create')
  @ApiOperation({ summary: 'Delete shift' })
  async deleteShift(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteShift(req.user.tenantId, id);
  }

  @Post('shifts/:id/assign')
  @Permissions('hr.shift.create')
  @ApiOperation({ summary: 'Assign employees to shift' })
  async assignShift(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.assignShiftToEmployees(req.user.tenantId, id, dto.employeeIds);
  }

  // ── Leave Types ──
  @Get('leave-types')
  @Permissions('hr.leave-policy.read')
  @ApiOperation({ summary: 'List leave types' })
  async getLeaveTypes(@Req() req: AuthenticatedRequest) {
    return this.hrService.getLeaveTypes(req.user.tenantId);
  }

  @Post('leave-types')
  @Permissions('hr.leave-policy.create')
  @ApiOperation({ summary: 'Create leave type' })
  async createLeaveType(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createLeaveType(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('leave-types/:id')
  @Permissions('hr.leave-policy.create')
  @ApiOperation({ summary: 'Update leave type' })
  async updateLeaveType(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateLeaveType(req.user.tenantId, id, dto);
  }

  @Delete('leave-types/:id')
  @Permissions('hr.leave-policy.create')
  @ApiOperation({ summary: 'Delete leave type' })
  async deleteLeaveType(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteLeaveType(req.user.tenantId, id);
  }

  // ── Leave Requests ──
  @Get('leave-requests')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'List leave requests' })
  async getLeaveRequests(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrService.getLeaveRequests(req.user.tenantId, q);
  }

  @Get('leave-requests/:id')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'Get leave request by ID' })
  async getLeaveRequestById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getLeaveRequestById(req.user.tenantId, id);
  }

  @Post('leave-requests')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'Create leave request' })
  async createLeaveRequest(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createLeaveRequest(req.user.tenantId, req.user.orgId || 'default', req.user.userId, dto);
  }

  @Patch('leave-requests/:id')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'Update leave request' })
  async updateLeaveRequest(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateLeaveRequest(req.user.tenantId, id, dto);
  }

  @Post('leave-requests/:id/approve')
  @Permissions('hr.leave.approve')
  @ApiOperation({ summary: 'Approve leave request' })
  async approveLeave(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.approveLeaveRequest(req.user.tenantId, id, req.user.userId);
  }

  @Post('leave-requests/:id/reject')
  @Permissions('hr.leave.approve')
  @ApiOperation({ summary: 'Reject leave request' })
  async rejectLeave(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.rejectLeaveRequest(req.user.tenantId, id, req.user.userId, dto.reason);
  }

  @Post('leave-requests/:id/cancel')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'Cancel leave request' })
  async cancelLeave(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.cancelLeaveRequest(req.user.tenantId, id);
  }

  @Post('leave-requests/:id/reclaim')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'Reclaim leave (undo approval)' })
  async reclaimLeave(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.reclaimLeaveRequest(req.user.tenantId, id);
  }

  @Delete('leave-requests/:id')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'Delete leave request' })
  async deleteLeaveRequest(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteLeaveRequest(req.user.tenantId, id);
  }

  // ── Leave Balances ──
  @Get('leave-balances')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'List leave balances' })
  async getLeaveBalances(@Req() req: AuthenticatedRequest, @Query('employeeId') employeeId?: string) {
    return this.hrService.getLeaveBalances(req.user.tenantId, employeeId);
  }

  @Get('leave-balances/:employeeId')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'Get employee leave balance' })
  async getEmployeeLeaveBalances(@Req() req: AuthenticatedRequest, @Param('employeeId') employeeId: string) {
    return this.hrService.getEmployeeLeaveBalances(req.user.tenantId, employeeId);
  }

  @Post('leave-balances')
  @Permissions('hr.leave-policy.create')
  @ApiOperation({ summary: 'Allocate leave balance' })
  async allocateLeaveBalance(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.allocateLeaveBalance(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  // ── Salary Structures ──
  @Get('salary-structures')
  @Permissions('hr.employee.salary')
  @ApiOperation({ summary: 'List salary structures' })
  async getSalaryStructures(@Req() req: AuthenticatedRequest) {
    return this.hrService.getSalaryStructures(req.user.tenantId);
  }

  @Get('salary-structures/:id')
  @Permissions('hr.employee.salary')
  @ApiOperation({ summary: 'Get salary structure by ID' })
  async getSalaryStructureById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getSalaryStructureById(req.user.tenantId, id);
  }

  @Get('salary-structures/employee/:employeeId')
  @Permissions('hr.employee.salary')
  @ApiOperation({ summary: 'Get salary structure by employee' })
  async getSalaryStructureByEmployee(@Req() req: AuthenticatedRequest, @Param('employeeId') employeeId: string) {
    return this.hrService.getSalaryStructureByEmployee(req.user.tenantId, employeeId);
  }

  @Post('salary-structures')
  @Permissions('hr.employee.salary')
  @ApiOperation({ summary: 'Create salary structure' })
  async createSalaryStructure(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createSalaryStructure(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('salary-structures/:id')
  @Permissions('hr.employee.salary')
  @ApiOperation({ summary: 'Update salary structure' })
  async updateSalaryStructure(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateSalaryStructure(req.user.tenantId, id, dto);
  }

  @Delete('salary-structures/:id')
  @Permissions('hr.employee.salary')
  @ApiOperation({ summary: 'Delete salary structure' })
  async deleteSalaryStructure(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteSalaryStructure(req.user.tenantId, id);
  }

  // ── Pay Runs ──
  @Get('pay-runs')
  @Permissions('hr.payroll.read')
  @ApiOperation({ summary: 'List pay runs' })
  async getPayRuns(@Req() req: AuthenticatedRequest) {
    return this.hrService.getPayRuns(req.user.tenantId);
  }

  @Get('pay-runs/:id')
  @Permissions('hr.payroll.read')
  @ApiOperation({ summary: 'Get pay run by ID' })
  async getPayRunById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getPayRunById(req.user.tenantId, id);
  }

  @Post('pay-runs')
  @Permissions('hr.payroll.create')
  @ApiOperation({ summary: 'Create pay run' })
  async createPayRun(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createPayRun(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('pay-runs/:id')
  @Permissions('hr.payroll.create')
  @ApiOperation({ summary: 'Update pay run' })
  async updatePayRun(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updatePayRun(req.user.tenantId, id, dto);
  }

  @Post('pay-runs/:id/process')
  @Permissions('hr.payroll.create')
  @ApiOperation({ summary: 'Process pay run' })
  async processPayRun(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.processPayRun(req.user.tenantId, id);
  }

  @Post('pay-runs/:id/approve')
  @Permissions('hr.payroll.approve')
  @ApiOperation({ summary: 'Approve pay run' })
  async approvePayRun(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.approvePayRun(req.user.tenantId, id);
  }

  @Post('pay-runs/:id/submit')
  @Permissions('hr.payroll.create')
  @ApiOperation({ summary: 'Submit pay run for approval' })
  async submitPayRun(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.submitPayRun(req.user.tenantId, id);
  }

  @Delete('pay-runs/:id')
  @Permissions('hr.payroll.create')
  @ApiOperation({ summary: 'Delete pay run' })
  async deletePayRun(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deletePayRun(req.user.tenantId, id);
  }

  // ── Pay Run Items ──
  @Get('pay-run-items/:payRunId')
  @Permissions('hr.payroll.read')
  @ApiOperation({ summary: 'List pay run items' })
  async getPayRunItems(@Req() req: AuthenticatedRequest, @Param('payRunId') payRunId: string) {
    return this.hrService.getPayRunItems(req.user.tenantId, payRunId);
  }

  @Post('pay-run-items')
  @Permissions('hr.payroll.create')
  @ApiOperation({ summary: 'Create pay run item' })
  async createPayRunItem(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createPayRunItem(req.user.tenantId, dto);
  }

  @Patch('pay-run-items/:id')
  @Permissions('hr.payroll.create')
  @ApiOperation({ summary: 'Update pay run item' })
  async updatePayRunItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updatePayRunItem(req.user.tenantId, id, dto);
  }

  // ── Performance Reviews ──
  @Get('performance-reviews')
  @Permissions('hr.appraisal.read')
  @ApiOperation({ summary: 'List performance reviews' })
  async getPerformanceReviews(@Req() req: AuthenticatedRequest) {
    return this.hrService.getPerformanceReviews(req.user.tenantId);
  }

  @Get('performance-reviews/:id')
  @Permissions('hr.appraisal.read')
  @ApiOperation({ summary: 'Get performance review by ID' })
  async getPerformanceReviewById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getPerformanceReviewById(req.user.tenantId, id);
  }

  @Post('performance-reviews')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Create performance review' })
  async createPerformanceReview(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createPerformanceReview(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('performance-reviews/:id')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Update performance review' })
  async updatePerformanceReview(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updatePerformanceReview(req.user.tenantId, id, dto);
  }

  @Post('performance-reviews/:id/submit')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Submit performance review' })
  async submitReview(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.submitPerformanceReview(req.user.tenantId, id);
  }

  @Post('performance-reviews/:id/acknowledge')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Acknowledge performance review' })
  async acknowledgeReview(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.acknowledgePerformanceReview(req.user.tenantId, id);
  }

  @Delete('performance-reviews/:id')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Delete performance review' })
  async deletePerformanceReview(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deletePerformanceReview(req.user.tenantId, id);
  }

  // ── Training Courses ──
  @Get('training-courses')
  @Permissions('hr.training.read')
  @ApiOperation({ summary: 'List training courses' })
  async getTrainingCourses(@Req() req: AuthenticatedRequest) {
    return this.hrService.getTrainingCourses(req.user.tenantId);
  }

  @Get('training-courses/:id')
  @Permissions('hr.training.read')
  @ApiOperation({ summary: 'Get training course by ID' })
  async getTrainingCourseById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getTrainingCourseById(req.user.tenantId, id);
  }

  @Post('training-courses')
  @Permissions('hr.training.create')
  @ApiOperation({ summary: 'Create training course' })
  async createTrainingCourse(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createTrainingCourse(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('training-courses/:id')
  @Permissions('hr.training.create')
  @ApiOperation({ summary: 'Update training course' })
  async updateTrainingCourse(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateTrainingCourse(req.user.tenantId, id, dto);
  }

  @Delete('training-courses/:id')
  @Permissions('hr.training.create')
  @ApiOperation({ summary: 'Delete training course' })
  async deleteTrainingCourse(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteTrainingCourse(req.user.tenantId, id);
  }

  // ── Training Sessions ──
  @Get('training-sessions')
  @Permissions('hr.training.read')
  @ApiOperation({ summary: 'List training sessions' })
  async getTrainingSessions(@Req() req: AuthenticatedRequest) {
    return this.hrService.getTrainingSessions(req.user.tenantId);
  }

  @Post('training-sessions')
  @Permissions('hr.training.create')
  @ApiOperation({ summary: 'Create training session' })
  async createTrainingSession(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createTrainingSession(req.user.tenantId, dto);
  }

  @Patch('training-sessions/:id')
  @Permissions('hr.training.create')
  @ApiOperation({ summary: 'Update training session' })
  async updateTrainingSession(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateTrainingSession(req.user.tenantId, id, dto);
  }

  @Post('training-sessions/:id/enroll')
  @Permissions('hr.training.create')
  @ApiOperation({ summary: 'Enroll employee in training' })
  async enrollTraining(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.enrollInTraining(req.user.tenantId, id, dto.employeeId);
  }

  @Post('training-enrollments/:id/complete')
  @Permissions('hr.training.create')
  @ApiOperation({ summary: 'Mark training as completed' })
  async completeTraining(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.completeTrainingEnrollment(req.user.tenantId, id, dto);
  }

  // ── Employee Documents ──
  @Get('documents')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List employee documents' })
  async getDocuments(@Req() req: AuthenticatedRequest, @Query('employeeId') employeeId?: string) {
    return this.hrService.getEmployeeDocuments(req.user.tenantId, employeeId);
  }

  @Get('documents/:id')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocumentById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getEmployeeDocumentById(req.user.tenantId, id);
  }

  @Post('documents')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Create document' })
  async createDocument(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createEmployeeDocument(req.user.tenantId, dto);
  }

  @Delete('documents/:id')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Delete document' })
  async deleteDocument(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteEmployeeDocument(req.user.tenantId, id);
  }

  // ── Employee Skills ──
  @Get('skills')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List employee skills' })
  async getSkills(@Req() req: AuthenticatedRequest, @Query('employeeId') employeeId?: string) {
    return this.hrService.getEmployeeSkills(req.user.tenantId, employeeId);
  }

  @Get('skills/:id')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get skill by ID' })
  async getSkillById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getEmployeeSkillById(req.user.tenantId, id);
  }

  @Post('skills')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Create skill' })
  async createSkill(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createEmployeeSkill(req.user.tenantId, dto);
  }

  @Patch('skills/:id')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Update skill' })
  async updateSkill(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateEmployeeSkill(req.user.tenantId, id, dto);
  }

  @Delete('skills/:id')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Delete skill' })
  async deleteSkill(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteEmployeeSkill(req.user.tenantId, id);
  }

  // ── Goals ──
  @Get('goals')
  @Permissions('hr.appraisal.read')
  @ApiOperation({ summary: 'List goals' })
  async getGoals(@Req() req: AuthenticatedRequest, @Query('employeeId') employeeId?: string) {
    return this.hrService.getGoals(req.user.tenantId, employeeId);
  }

  @Get('goals/:id')
  @Permissions('hr.appraisal.read')
  @ApiOperation({ summary: 'Get goal by ID' })
  async getGoalById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getGoalById(req.user.tenantId, id);
  }

  @Post('goals')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Create goal' })
  async createGoal(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createGoal(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('goals/:id')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Update goal' })
  async updateGoal(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateGoal(req.user.tenantId, id, dto);
  }

  @Post('goals/:id/update-progress')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Update goal progress' })
  async updateGoalProgress(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateGoalProgress(req.user.tenantId, id, dto.progress);
  }

  @Delete('goals/:id')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Delete goal' })
  async deleteGoal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteGoal(req.user.tenantId, id);
  }

  // ── 360 Feedback ──
  @Get('feedback')
  @Permissions('hr.appraisal.read')
  @ApiOperation({ summary: 'List 360 feedback' })
  async getFeedback(@Req() req: AuthenticatedRequest) {
    return this.hrService.getFeedback360(req.user.tenantId);
  }

  @Get('feedback/:id')
  @Permissions('hr.appraisal.read')
  @ApiOperation({ summary: 'Get feedback by ID' })
  async getFeedbackById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getFeedback360ById(req.user.tenantId, id);
  }

  @Post('feedback')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Create 360 feedback' })
  async createFeedback(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createFeedback360(req.user.tenantId, dto);
  }

  @Post('feedback/:id/submit')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Submit 360 feedback' })
  async submitFeedback(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.submitFeedback360(req.user.tenantId, id);
  }

  // ── Onboarding ──
  @Get('onboarding')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List onboarding checklists' })
  async getOnboardingChecklists(@Req() req: AuthenticatedRequest) {
    return this.hrService.getOnboardingChecklists(req.user.tenantId);
  }

  @Get('onboarding/:id')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get onboarding by ID' })
  async getOnboardingById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getOnboardingById(req.user.tenantId, id);
  }

  @Post('onboarding')
  @Permissions('hr.employee.create')
  @ApiOperation({ summary: 'Create onboarding checklist' })
  async createOnboarding(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createOnboardingChecklist(req.user.tenantId, dto);
  }

  @Patch('onboarding/:id/complete-item/:itemId')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Complete onboarding item' })
  async completeOnboardingItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.hrService.completeOnboardingItem(req.user.tenantId, id, itemId);
  }

  // ── Offboarding ──
  @Get('offboarding')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List offboarding checklists' })
  async getOffboardingChecklists(@Req() req: AuthenticatedRequest) {
    return this.hrService.getOffboardingChecklists(req.user.tenantId);
  }

  @Post('offboarding')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Create offboarding checklist' })
  async createOffboarding(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createOffboardingChecklist(req.user.tenantId, dto);
  }

  // ── Job Postings (Recruitment) ──
  @Get('job-postings')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List job postings' })
  async getJobPostings(@Req() req: AuthenticatedRequest) {
    return this.hrService.getJobPostings(req.user.tenantId);
  }

  @Get('job-postings/:id')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get job posting by ID' })
  async getJobPostingById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getJobPostingById(req.user.tenantId, id);
  }

  @Post('job-postings')
  @Permissions('hr.employee.create')
  @ApiOperation({ summary: 'Create job posting' })
  async createJobPosting(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createJobPosting(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('job-postings/:id')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Update job posting' })
  async updateJobPosting(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateJobPosting(req.user.tenantId, id, dto);
  }

  @Post('job-postings/:id/close')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Close job posting' })
  async closeJobPosting(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.closeJobPosting(req.user.tenantId, id);
  }

  @Delete('job-postings/:id')
  @Permissions('hr.employee.delete')
  @ApiOperation({ summary: 'Delete job posting' })
  async deleteJobPosting(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteJobPosting(req.user.tenantId, id);
  }

  // ── Applicants ──
  @Get('applicants')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List applicants' })
  async getApplicants(@Req() req: AuthenticatedRequest) {
    return this.hrService.getApplicants(req.user.tenantId);
  }

  @Get('applicants/:id')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get applicant by ID' })
  async getApplicantById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getApplicantById(req.user.tenantId, id);
  }

  @Post('applicants')
  @Permissions('hr.employee.create')
  @ApiOperation({ summary: 'Create applicant' })
  async createApplicant(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createApplicant(req.user.tenantId, req.user.orgId || 'default', dto);
  }

  @Patch('applicants/:id')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Update applicant' })
  async updateApplicant(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateApplicant(req.user.tenantId, id, dto);
  }

  @Post('applicants/:id/advance-stage')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Advance applicant stage' })
  async advanceApplicantStage(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.advanceApplicantStage(req.user.tenantId, id, dto.stage);
  }

  @Post('applicants/:id/convert-to-employee')
  @Permissions('hr.employee.create')
  @ApiOperation({ summary: 'Convert applicant to employee' })
  async convertApplicant(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.convertApplicantToEmployee(req.user.tenantId, req.user.orgId || 'default', id, dto);
  }

  // ── Interviews ──
  @Get('interviews')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List interviews' })
  async getInterviews(@Req() req: AuthenticatedRequest) {
    return this.hrService.getInterviews(req.user.tenantId);
  }

  @Get('interviews/:id')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get interview by ID' })
  async getInterviewById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getInterviewById(req.user.tenantId, id);
  }

  @Post('interviews')
  @Permissions('hr.employee.create')
  @ApiOperation({ summary: 'Create interview' })
  async createInterview(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createInterview(req.user.tenantId, dto);
  }

  @Patch('interviews/:id')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Update interview' })
  async updateInterview(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateInterview(req.user.tenantId, id, dto);
  }

  @Post('interviews/:id/complete')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Complete interview with feedback' })
  async completeInterview(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.completeInterview(req.user.tenantId, id, dto);
  }

  // ── HR Tickets ──
  @Get('tickets')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List HR tickets' })
  async getTickets(@Req() req: AuthenticatedRequest) {
    return this.hrService.getHrTickets(req.user.tenantId);
  }

  @Get('tickets/:id')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Get HR ticket by ID' })
  async getTicketById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getHrTicketById(req.user.tenantId, id);
  }

  @Post('tickets')
  @Permissions('hr.employee.create')
  @ApiOperation({ summary: 'Create HR ticket' })
  async createTicket(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createHrTicket(req.user.tenantId, dto);
  }

  @Patch('tickets/:id')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Update HR ticket' })
  async updateTicket(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateHrTicket(req.user.tenantId, id, dto);
  }

  @Post('tickets/:id/resolve')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Resolve HR ticket' })
  async resolveTicket(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.resolveHrTicket(req.user.tenantId, id, dto.resolution);
  }

  // ── Succession Plans ──
  @Get('succession-plans')
  @Permissions('hr.appraisal.read')
  @ApiOperation({ summary: 'List succession plans' })
  async getSuccessionPlans(@Req() req: AuthenticatedRequest) {
    return this.hrService.getSuccessionPlans(req.user.tenantId);
  }

  @Post('succession-plans')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Create succession plan' })
  async createSuccessionPlan(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: any) {
    return this.hrService.createSuccessionPlan(req.user.tenantId, dto);
  }

  @Patch('succession-plans/:id')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Update succession plan' })
  async updateSuccessionPlan(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: any) {
    return this.hrService.updateSuccessionPlan(req.user.tenantId, id, dto);
  }

  @Delete('succession-plans/:id')
  @Permissions('hr.appraisal.create')
  @ApiOperation({ summary: 'Delete succession plan' })
  async deleteSuccessionPlan(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteSuccessionPlan(req.user.tenantId, id);
  }

  // ── Asset Assignments ──
  @Get('asset-assignments')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'List asset assignments' })
  async getAssetAssignments(@Req() req: AuthenticatedRequest) {
    return this.hrService.getAssetAssignments(req.user.tenantId);
  }

  @Post('asset-assignments/:id/return')
  @Permissions('hr.employee.update')
  @ApiOperation({ summary: 'Return asset' })
  async returnAsset(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.returnAsset(req.user.tenantId, id);
  }

  // ── Reports ──
  @Get('reports/headcount')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Headcount report' })
  async getHeadcountReport(@Req() req: AuthenticatedRequest) {
    return this.hrService.getHeadcountReport(req.user.tenantId);
  }

  @Get('reports/attendance')
  @Permissions('hr.attendance.read')
  @ApiOperation({ summary: 'Attendance report' })
  async getAttendanceReport(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrService.getAttendanceReport(req.user.tenantId, q);
  }

  @Get('reports/leave')
  @Permissions('hr.leave.read')
  @ApiOperation({ summary: 'Leave analytics report' })
  async getLeaveReport(@Req() req: AuthenticatedRequest) {
    return this.hrService.getLeaveAnalytics(req.user.tenantId);
  }

  @Get('reports/payroll')
  @Permissions('hr.payroll.read')
  @ApiOperation({ summary: 'Payroll summary report' })
  async getPayrollReport(@Req() req: AuthenticatedRequest) {
    return this.hrService.getPayrollSummary(req.user.tenantId);
  }

  @Get('reports/turnover')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Employee turnover report' })
  async getTurnoverReport(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrService.getTurnoverReport(req.user.tenantId, q);
  }

  @Get('reports/birthday')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Upcoming birthdays' })
  async getUpcomingBirthdays(@Req() req: AuthenticatedRequest, @Query('days') days?: string) {
    return this.hrService.getUpcomingBirthdays(req.user.tenantId, days ? parseInt(days) : 30);
  }

  @Get('reports/work-anniversary')
  @Permissions('hr.employee.read')
  @ApiOperation({ summary: 'Upcoming work anniversaries' })
  async getUpcomingAnniversaries(@Req() req: AuthenticatedRequest, @Query('days') days?: string) {
    return this.hrService.getUpcomingAnniversaries(req.user.tenantId, days ? parseInt(days) : 30);
  }
}
