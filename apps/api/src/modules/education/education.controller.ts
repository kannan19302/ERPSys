import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { EducationService } from './education.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('education')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EducationController {
  constructor(private readonly service: EducationService) {}

  @Get('students')
  @Permissions('hr.employee.read')
  async getStudents(@Req() req: AuthenticatedRequest) {
    return this.service.getStudents(req.user.tenantId);
  }

  @Post('students')
  @Permissions('hr.employee.read')
  async createStudent(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { firstName: string; lastName: string; dateOfBirth: string; enrollmentNumber: string; parentContact: string }
  ) {
    return this.service.createStudent(req.user.tenantId, dto);
  }

  @Get('courses')
  @Permissions('hr.employee.read')
  async getCourses(@Req() req: AuthenticatedRequest) {
    return this.service.getCourses(req.user.tenantId);
  }

  @Post('courses')
  @Permissions('hr.employee.read')
  async createCourse(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; code: string; credits: number; description?: string }
  ) {
    return this.service.createCourse(req.user.tenantId, dto);
  }

  @Get('timetables')
  @Permissions('hr.employee.read')
  async getTimetables(@Req() req: AuthenticatedRequest) {
    return this.service.getTimetables(req.user.tenantId);
  }

  @Post('timetables')
  @Permissions('hr.employee.read')
  async createTimetable(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { courseId: string; room: string; weekday: string; startTime: string; endTime: string; instructorId: string }
  ) {
    return this.service.createTimetable(req.user.tenantId, dto);
  }

  @Get('fee-structures')
  @Permissions('hr.employee.read')
  async getFeeStructures(@Req() req: AuthenticatedRequest) {
    return this.service.getFeeStructures(req.user.tenantId);
  }

  @Post('fee-structures')
  @Permissions('hr.employee.read')
  async createFeeStructure(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; description?: string; amount: number; dueDate: string }
  ) {
    return this.service.createFeeStructure(req.user.tenantId, dto);
  }

  @Get('student-fees')
  @Permissions('hr.employee.read')
  async getStudentFees(@Req() req: AuthenticatedRequest) {
    return this.service.getStudentFees(req.user.tenantId);
  }

  @Post('student-fees/pay')
  @Permissions('hr.employee.read')
  async payStudentFee(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { studentFeeId: string; paymentAmount: number }
  ) {
    return this.service.payStudentFee(req.user.tenantId, dto);
  }

  @Get('books')
  @Permissions('hr.employee.read')
  async getBookRegister(@Req() req: AuthenticatedRequest) {
    return this.service.getBookRegister(req.user.tenantId);
  }

  @Post('books')
  @Permissions('hr.employee.read')
  async createBook(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { title: string; isbn: string; author: string; quantity: number }
  ) {
    return this.service.createBook(req.user.tenantId, dto);
  }

  @Get('book-transactions')
  @Permissions('hr.employee.read')
  async getBookTransactions(@Req() req: AuthenticatedRequest) {
    return this.service.getBookTransactions(req.user.tenantId);
  }

  @Post('books/checkout')
  @Permissions('hr.employee.read')
  async checkoutBook(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { studentId: string; bookId: string; dueDate: string }
  ) {
    return this.service.checkoutBook(req.user.tenantId, dto);
  }

  @Post('books/return')
  @Permissions('hr.employee.read')
  async returnBook(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { transactionId: string }
  ) {
    return this.service.returnBook(req.user.tenantId, dto);
  }
}
