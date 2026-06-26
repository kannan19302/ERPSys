import { Module } from '@nestjs/common';
import { HealthcareController } from './healthcare.controller';
import { HealthcareService } from './healthcare.service';
import { HealthcareSmartController } from './healthcare-smart.controller';
import { HealthcareSmartService } from './healthcare-smart.service';
import { ClinicalService } from './clinical.service';

@Module({
  controllers: [HealthcareController, HealthcareSmartController],
  providers: [HealthcareService, HealthcareSmartService, ClinicalService],
  exports: [HealthcareService, HealthcareSmartService, ClinicalService],
})
export class HealthcareModule {}
