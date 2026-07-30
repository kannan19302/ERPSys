// @ts-nocheck
import { Module } from '@nestjs/common';
import { ProjectsEnterpriseController } from './projects-enterprise.controller';
import { ProjectsEnterpriseService } from './projects-enterprise.service';

@Module({
  controllers: [ProjectsEnterpriseController],
  providers: [ProjectsEnterpriseService, ProjectsEnterpriseController],
  exports: [ProjectsEnterpriseService],
})
export class ProjectsEnterpriseModule {}
