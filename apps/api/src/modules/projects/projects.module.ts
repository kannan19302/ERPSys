import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectSchedulingService } from './project-scheduling.service';
import { ProjectsExpansionController } from './projects-expansion.controller';
import { ProjectsExpansionService } from './projects-expansion.service';

@Module({
  controllers: [ProjectsController, ProjectsExpansionController],
  providers: [ProjectsService, ProjectSchedulingService, ProjectsExpansionService],
  exports: [ProjectsService, ProjectSchedulingService, ProjectsExpansionService],
})
export class ProjectsModule {}
