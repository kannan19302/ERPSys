import { Module } from '@nestjs/common';
import { QualityComplianceController } from './quality-compliance.controller';
import { QualityComplianceService } from './quality-compliance.service';

@Module({
  controllers: [QualityComplianceController],
  providers: [QualityComplianceService],
  exports: [QualityComplianceService],
})
export class QualityComplianceModule {}
