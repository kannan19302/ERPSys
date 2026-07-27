import { ProjectsDeepController } from "./controllers/projects-deep-suite.controller";
import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectSchedulingService } from "./project-scheduling.service";
import { ProjectsExpansionController } from "./projects-expansion.controller";
import { ProjectsExpansionService } from "./projects-expansion.service";
import { ProgramManagementController } from "./controllers/program-management.controller";
import { ProjectsProgramService } from "./services/projects-program.service";
import { AgileController } from "./controllers/agile.controller";
import { ProjectsAgileService } from "./services/projects-agile.service";
import { ResourceSkillsController } from "./controllers/resource-skills.controller";
import { ProjectsResourceSkillsService } from "./services/projects-resource-skills.service";
import { AdvancedEvmController } from "./controllers/advanced-evm.controller";
import { ProjectsAdvancedEvmService } from "./services/projects-advanced-evm.service";
import { CapexController } from "./controllers/capex.controller";
import { ProjectsCapexService } from "./services/projects-capex.service";
import { ClaimsController } from "./controllers/claims.controller";
import { ProjectsClaimsService } from "./services/projects-claims.service";
import { PmoController } from "./controllers/pmo.controller";
import { ProjectsPmoService } from "./services/projects-pmo.service";
import { CollaborationController } from "./controllers/collaboration.controller";
import { ProjectsCollaborationService } from "./services/projects-collaboration.service";

import { PpmDeepExpansionController } from "./controllers/ppm-deep-expansion.controller";
import { PpmDeepExpansionService } from "./services/ppm-deep-expansion.service";

@Module({
  controllers: [
    ProjectsDeepController,
    PpmDeepExpansionController,
    ProjectsController,
    ProjectsExpansionController,
    ProgramManagementController,
    AgileController,
    ResourceSkillsController,
    AdvancedEvmController,
    CapexController,
    ClaimsController,
    PmoController,
    CollaborationController,
  ],
  providers: [
    ProjectsDeepController,
    PpmDeepExpansionService,
    ProjectsService,
    ProjectSchedulingService,
    ProjectsExpansionService,
    ProjectsProgramService,
    ProjectsAgileService,
    ProjectsResourceSkillsService,
    ProjectsAdvancedEvmService,
    ProjectsCapexService,
    ProjectsClaimsService,
    ProjectsPmoService,
    ProjectsCollaborationService,
  ],
  exports: [
    PpmDeepExpansionService,
    PpmDeepExpansionService,
    ProjectsService,
    ProjectSchedulingService,
    ProjectsExpansionService,
    ProjectsProgramService,
    ProjectsAgileService,
    ProjectsResourceSkillsService,
    ProjectsAdvancedEvmService,
    ProjectsCapexService,
    ProjectsClaimsService,
    ProjectsPmoService,
    ProjectsCollaborationService,
  ],
})
export class ProjectsModule {}
