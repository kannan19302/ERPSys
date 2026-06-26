import { Module } from '@nestjs/common';
import { BuilderController } from './builder.controller';
import { BuilderService } from './builder.service';
import { WebCollectionsService } from './web-collections.service';
import { WebPublicController } from './web-public.controller';
import { BuilderGovernanceService } from './builder-governance.service';
import { BuilderScriptingService } from './builder-scripting.service';
import { GovernanceController } from './governance.controller';

@Module({
  controllers: [BuilderController, WebPublicController, GovernanceController],
  providers: [BuilderService, WebCollectionsService, BuilderGovernanceService, BuilderScriptingService],
  exports: [BuilderService, WebCollectionsService, BuilderGovernanceService, BuilderScriptingService],
})
export class BuilderModule {}
