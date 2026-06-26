import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectSchedulingService } from './project-scheduling.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectSchedulingService],
  exports: [ProjectsService, ProjectSchedulingService],
})
export class ProjectsModule {}
