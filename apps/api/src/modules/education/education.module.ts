import { Module } from '@nestjs/common';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { EducationCoreService } from './education-core.service';

@Module({
  controllers: [EducationController],
  providers: [EducationService, EducationCoreService],
  exports: [EducationService, EducationCoreService],
})
export class EducationModule {}
