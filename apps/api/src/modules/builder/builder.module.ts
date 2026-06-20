import { Module } from '@nestjs/common';
import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';
import { WebCollectionsService } from './web-collections.service';
import { WebPublicController } from './web-public.controller';

@Module({
  controllers: [BuilderController, WebPublicController],
  providers: [BuilderService, WebCollectionsService],
  exports: [BuilderService, WebCollectionsService],
})
export class BuilderModule {}
