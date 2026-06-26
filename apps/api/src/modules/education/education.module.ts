import { Module } from '@nestjs/common';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { EducationCoreService } from './education-core.service';
import { EducationCoreController } from './education-core.controller';

@Module({
  controllers: [EducationController, EducationCoreController],
  providers: [EducationService, EducationCoreService],
  exports: [EducationService, EducationCoreService],
})
export class EducationModule {}
