import { Module } from '@nestjs/common';
import { HealthcareController } from './healthcare.controller';
import { HealthcareService } from './healthcare.service';
import { HealthcareSmartController } from './healthcare-smart.controller';
import { HealthcareSmartService } from './healthcare-smart.service';

@Module({
  controllers: [HealthcareController, HealthcareSmartController],
  providers: [HealthcareService, HealthcareSmartService],
  exports: [HealthcareService, HealthcareSmartService],
})
export class HealthcareModule {}
