import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { errorReportSchema, ErrorReportInput } from '@unerp/shared';
import { ErrorReportsService } from './error-reports.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('public/error-reports')
export class ErrorReportsController {
  constructor(private readonly errorReportsService: ErrorReportsService) {}

  @ApiOperation({ summary: 'Submit client-side error report' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitReport(
    @ZodBody(errorReportSchema) dto: ErrorReportInput,
  ) {
    return this.errorReportsService.createReport(dto);
  }
}
