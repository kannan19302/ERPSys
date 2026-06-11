import { Module } from '@nestjs/common';
import { HealthcareController } from './healthcare.controller';
import { HealthcareService } from './healthcare.service';

@Module({
  controllers: [HealthcareController],
  providers: [HealthcareService],
  exports: [HealthcareService],
})
export class HealthcareModule {}
