import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { AppInstalledGuard } from '../../common/guards/app-installed.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { EducationService } from './education.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('education')
@ApiBearerAuth()
@Controller('education')
@UseGuards(JwtAuthGuard, RbacGuard, AppInstalledGuard)
export class EducationController {
  constructor(private readonly service: EducationService) {}

  @ApiOperation({ summary: 'Get students' })
  @Get('students')
  @Permissions('hr.employee.read')
  async getStudents(@Req() req: AuthenticatedRequest) {
    return this.service.getStudents(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create student' })
  @Post('students')
  @Permissions('hr.employee.read')
  async createStudent(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { firstName: string; lastName: string; dateOfBirth: string; enrollmentNumber: string; parentContact: string }
  ) {
    return this.service.createStudent(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get courses' })
  @Get('courses')
  @Permissions('hr.employee.read')
  async getCourses(@Req() req: AuthenticatedRequest) {
    return this.service.getCourses(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create course' })
  @Post('courses')
  @Permissions('hr.employee.read')
  async createCourse(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; code: string; credits: number; description?: string }
  ) {
    return this.service.createCourse(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get timetables' })
  @Get('timetables')
  @Permissions('hr.employee.read')
  async getTimetables(@Req() req: AuthenticatedRequest) {
    return this.service.getTimetables(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create timetable' })
  @Post('timetables')
  @Permissions('hr.employee.read')
  async createTimetable(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { courseId: string; room: string; weekday: string; startTime: string; endTime: string; instructorId: string }
  ) {
    return this.service.createTimetable(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get fee structures' })
  @Get('fee-structures')
  @Permissions('hr.employee.read')
  async getFeeStructures(@Req() req: AuthenticatedRequest) {
    return this.service.getFeeStructures(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create fee structure' })
  @Post('fee-structures')
  @Permissions('hr.employee.read')
  async createFeeStructure(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; description?: string; amount: number; dueDate: string }
  ) {
    return this.service.createFeeStructure(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get student fees' })
  @Get('student-fees')
  @Permissions('hr.employee.read')
  async getStudentFees(@Req() req: AuthenticatedRequest) {
    return this.service.getStudentFees(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Pay student fee' })
  @Post('student-fees/pay')
  @Permissions('hr.employee.read')
  async payStudentFee(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { studentFeeId: string; paymentAmount: number }
  ) {
    return this.service.payStudentFee(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get book register' })
  @Get('books')
  @Permissions('hr.employee.read')
  async getBookRegister(@Req() req: AuthenticatedRequest) {
    return this.service.getBookRegister(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create book' })
  @Post('books')
  @Permissions('hr.employee.read')
  async createBook(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { title: string; isbn: string; author: string; quantity: number }
  ) {
    return this.service.createBook(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get book transactions' })
  @Get('book-transactions')
  @Permissions('hr.employee.read')
  async getBookTransactions(@Req() req: AuthenticatedRequest) {
    return this.service.getBookTransactions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Checkout book' })
  @Post('books/checkout')
  @Permissions('hr.employee.read')
  async checkoutBook(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { studentId: string; bookId: string; dueDate: string }
  ) {
    return this.service.checkoutBook(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Return book' })
  @Post('books/return')
  @Permissions('hr.employee.read')
  async returnBook(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { transactionId: string }
  ) {
    return this.service.returnBook(req.user.tenantId, dto);
  }
}
