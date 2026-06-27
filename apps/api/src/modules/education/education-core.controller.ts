import { Controller, Get, Post, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { EducationCoreService } from './education-core.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('education')
@ApiBearerAuth()
@Controller('education/core')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class EducationCoreController {
  constructor(private readonly educationCore: EducationCoreService) {}

  @ApiOperation({ summary: 'Enrol student' })
  @Permissions('education.create')
  @Post('enrol')
  async enrolStudent(@Req() req: AuthReq, @ZodBody(z.any()) body: { studentId: string; courseId: string; academicYear: string }) {
    return this.educationCore.enrolStudent(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Record grade' })
  @Permissions('education.create')
  @Post('grades')
  async recordGrade(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.educationCore.recordGrade(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get transcript' })
  @Permissions('education.read')
  @Get('transcript/:studentId')
  async getTranscript(@Req() req: AuthReq, @Param('studentId') studentId: string) {
    return this.educationCore.getStudentTranscript(req.user.tenantId, studentId);
  }

  @ApiOperation({ summary: 'Record attendance' })
  @Permissions('education.create')
  @Post('attendance')
  async recordAttendance(@Req() req: AuthReq, @ZodBody(z.any()) body: any) {
    return this.educationCore.recordAttendance(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Generate fee' })
  @Permissions('education.create')
  @Post('fees/invoice')
  async generateFee(@Req() req: AuthReq, @ZodBody(z.any()) body: { studentId: string; feeStructureId: string }) {
    return this.educationCore.generateFeeInvoice(req.user.tenantId, body.studentId, body.feeStructureId);
  }
}
