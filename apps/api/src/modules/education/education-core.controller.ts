import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { EducationCoreService } from './education-core.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('education/core')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class EducationCoreController {
  constructor(private readonly educationCore: EducationCoreService) {}

  @Post('enrol')
  async enrolStudent(@Req() req: AuthReq, @Body() body: { studentId: string; courseId: string; academicYear: string }) {
    return this.educationCore.enrolStudent(req.user.tenantId, body);
  }

  @Post('grades')
  async recordGrade(@Req() req: AuthReq, @Body() body: any) {
    return this.educationCore.recordGrade(req.user.tenantId, body);
  }

  @Get('transcript/:studentId')
  async getTranscript(@Req() req: AuthReq, @Param('studentId') studentId: string) {
    return this.educationCore.getStudentTranscript(req.user.tenantId, studentId);
  }

  @Post('attendance')
  async recordAttendance(@Req() req: AuthReq, @Body() body: any) {
    return this.educationCore.recordAttendance(req.user.tenantId, body);
  }

  @Post('fees/invoice')
  async generateFee(@Req() req: AuthReq, @Body() body: { studentId: string; feeStructureId: string }) {
    return this.educationCore.generateFeeInvoice(req.user.tenantId, body.studentId, body.feeStructureId);
  }
}
