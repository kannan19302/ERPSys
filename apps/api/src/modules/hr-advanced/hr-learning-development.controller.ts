import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { HrLearningDevelopmentService } from "./hr-learning-development.service";
@ApiTags("hr-learning-development")
@ApiBearerAuth()
@Controller("hr/learning-development")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrLearningDevelopmentController {
  constructor(private readonly svc: HrLearningDevelopmentService) {}
  @Get("ld_0") async g0() {
    return this.svc.getLndDashboard();
  }
  @Get("ld_1") async g1() {
    return this.svc.getTrainingPrograms();
  }
  @Get("ld_2") async g2() {
    return this.svc.getTrainingProgramById();
  }
  @Get("ld_3") async g3() {
    return this.svc.createTrainingProgram();
  }
  @Get("ld_4") async g4() {
    return this.svc.updateTrainingProgram();
  }
  @Get("ld_5") async g5() {
    return this.svc.deleteTrainingProgram();
  }
  @Get("ld_6") async g6() {
    return this.svc.getEmployeeTrainings();
  }
  @Get("ld_7") async g7() {
    return this.svc.enrollEmployeeInTraining();
  }
  @Get("ld_8") async g8() {
    return this.svc.bulkEnrollEmployees();
  }
  @Get("ld_9") async g9() {
    return this.svc.updateTrainingStatus();
  }
  @Get("ld_10") async g10() {
    return this.svc.completeTraining();
  }
  @Get("ld_11") async g11() {
    return this.svc.getTrainingCertifications();
  }
  @Get("ld_12") async g12() {
    return this.svc.issueCertification();
  }
  @Get("ld_13") async g13() {
    return this.svc.verifyCertification();
  }
  @Get("ld_14") async g14() {
    return this.svc.getSkillAssessments();
  }
  @Get("ld_15") async g15() {
    return this.svc.createSkillAssessment();
  }
  @Get("ld_16") async g16() {
    return this.svc.submitAssessmentResult();
  }
  @Get("ld_17") async g17() {
    return this.svc.getSkillMatrix();
  }
  @Get("ld_18") async g18() {
    return this.svc.getLearningPaths();
  }
  @Get("ld_19") async g19() {
    return this.svc.createLearningPath();
  }
  @Get("ld_20") async g20() {
    return this.svc.assignLearningPath();
  }
  @Get("ld_21") async g21() {
    return this.svc.getLearningPathProgress();
  }
  @Get("ld_22") async g22() {
    return this.svc.getCourseCatalog();
  }
  @Get("ld_23") async g23() {
    return this.svc.createCourse();
  }
  @Get("ld_24") async g24() {
    return this.svc.getCourseModules();
  }
  @Get("ld_25") async g25() {
    return this.svc.createCourseModule();
  }
  @Get("ld_26") async g26() {
    return this.svc.recordModuleProgress();
  }
  @Get("ld_27") async g27() {
    return this.svc.getLndAnalytics();
  }
  @Get("ld_28") async g28() {
    return this.svc.getTrainingBudgetVsActual();
  }
  @Get("ld_29") async g29() {
    return this.svc.getComplianceTrainingReport();
  }
  @Get("ld_30") async g30() {
    return this.svc.getSkillGapsReport();
  }
}
