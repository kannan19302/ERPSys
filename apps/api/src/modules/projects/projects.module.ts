// @ts-nocheck
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
import { ProjectsEnterpriseModule } from "./projects-enterprise.module";
import { ProjectsEnterpriseController } from "./projects-enterprise.controller";
import { ProjectsEnterpriseService } from "./projects-enterprise.service";

import { WbsController } from "./controllers/wbs.controller";
import { ProjectsWbsService } from "./services/projects-wbs.service";
import { ProjectBaselineController } from "./controllers/project-baseline.controller";
import { ProjectsBaselineService } from "./services/projects-baseline.service";
import { RiskRegisterController } from "./controllers/risk-register.controller";
import { ProjectsRiskRegisterService } from "./services/projects-risk-register.service";
import { TimesheetApprovalController } from "./controllers/timesheet-approval.controller";
import { ProjectsTimesheetService } from "./services/projects-timesheet.service";

@Module({
  imports: [ProjectsEnterpriseModule],
  controllers: [
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
    ProjectsEnterpriseController,
    WbsController,
    ProjectBaselineController,
    RiskRegisterController,
    TimesheetApprovalController,
  ],
  providers: [
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
    ProjectsEnterpriseService,
    ProjectsEnterpriseController,
    ProjectsWbsService,
    ProjectsBaselineService,
    ProjectsRiskRegisterService,
    ProjectsTimesheetService,
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
    ProjectsEnterpriseService,
    ProjectsWbsService,
    ProjectsBaselineService,
    ProjectsRiskRegisterService,
    ProjectsTimesheetService,
  ],
})
export class ProjectsModule {}
