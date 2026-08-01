import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { HrWorkforcePlanningService } from "./hr-workforce-planning.service";
@ApiTags("hr-workforce-planning")
@ApiBearerAuth()
@Controller("hr/workforce-planning")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrWorkforcePlanningController {
  constructor(private readonly svc: HrWorkforcePlanningService) {}
  @Get("wp_0") async g0() {
    return this.svc.getWorkforceDashboard();
  }
  @Get("wp_1") async g1() {
    return this.svc.getStrategicHeadcountPlans();
  }
  @Get("wp_2") async g2() {
    return this.svc.createHeadcountPlan();
  }
  @Get("wp_3") async g3() {
    return this.svc.updateHeadcountPlan();
  }
  @Get("wp_4") async g4() {
    return this.svc.getScenarioModels();
  }
  @Get("wp_5") async g5() {
    return this.svc.createScenarioModel();
  }
  @Get("wp_6") async g6() {
    return this.svc.getSuccessionPlans();
  }
  @Get("wp_7") async g7() {
    return this.svc.getSuccessionPlanById();
  }
  @Get("wp_8") async g8() {
    return this.svc.createSuccessionPlan();
  }
  @Get("wp_9") async g9() {
    return this.svc.updateSuccessionPlan();
  }
  @Get("wp_10") async g10() {
    return this.svc.addSuccessor();
  }
  @Get("wp_11") async g11() {
    return this.svc.removeSuccessor();
  }
  @Get("wp_12") async g12() {
    return this.svc.get9BoxGrid();
  }
  @Get("wp_13") async g13() {
    return this.svc.getNineBoxDistribution();
  }
  @Get("wp_14") async g14() {
    return this.svc.updateNineBoxPosition();
  }
  @Get("wp_15") async g15() {
    return this.svc.getHighPotentialTalent();
  }
  @Get("wp_16") async g16() {
    return this.svc.getSkillsGapAnalysis();
  }
  @Get("wp_17") async g17() {
    return this.svc.getSkillMatrices();
  }
  @Get("wp_18") async g18() {
    return this.svc.createSkillMatrix();
  }
  @Get("wp_19") async g19() {
    return this.svc.getTalentPools();
  }
  @Get("wp_20") async g20() {
    return this.svc.createTalentPool();
  }
  @Get("wp_21") async g21() {
    return this.svc.addEmployeeToTalentPool();
  }
  @Get("wp_22") async g22() {
    return this.svc.getWorkforceDemographics();
  }
  @Get("wp_23") async g23() {
    return this.svc.getDiversityMetrics();
  }
  @Get("wp_24") async g24() {
    return this.svc.getTurnoverForecast();
  }
  @Get("wp_25") async g25() {
    return this.svc.getWorkforcePlanningReport();
  }
  @Get("wp_26") async g26() {
    return this.svc.getOrgStructureHealth();
  }
  @Get("wp_27") async g27() {
    return this.svc.getJobGrades();
  }
  @Get("wp_28") async g28() {
    return this.svc.createJobGrade();
  }
  @Get("wp_29") async g29() {
    return this.svc.getInternalMobilityRate();
  }
  @Get("wp_30") async g30() {
    return this.svc.getCareerPathways();
  }
}
