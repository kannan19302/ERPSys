// @ts-nocheck
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmPartnerDeepTwoService } from "./crm-partner-deep-two.service";
@ApiTags("crm-partner-deep-two")
@ApiBearerAuth()
@Controller("crm/partner-deep-two")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPartnerDeepTwoController {
  constructor(private readonly svc: CrmPartnerDeepTwoService) {}
  @Get("pt_0") async g0() {
    return this.svc.getPartnerContracts();
  }
  @Get("pt_1") async g1() {
    return this.svc.createContract();
  }
  @Get("pt_2") async g2() {
    return this.svc.updateContract();
  }
  @Get("pt_3") async g3() {
    return this.svc.deleteContract();
  }
  @Get("pt_4") async g4() {
    return this.svc.getTierRequirements();
  }
  @Get("pt_5") async g5() {
    return this.svc.createRequirement();
  }
  @Get("pt_6") async g6() {
    return this.svc.updateRequirement();
  }
  @Get("pt_7") async g7() {
    return this.svc.deleteRequirement();
  }
  @Get("pt_8") async g8() {
    return this.svc.evaluatePartnerTier();
  }
  @Get("pt_9") async g9() {
    return this.svc.getPartnerReferrals();
  }
  @Get("pt_10") async g10() {
    return this.svc.createReferral();
  }
  @Get("pt_11") async g11() {
    return this.svc.updateReferralStatus();
  }
  @Get("pt_12") async g12() {
    return this.svc.getPartnerPerformanceMetrics();
  }
  @Get("pt_13") async g13() {
    return this.svc.calculatePartnerPerformance();
  }
  @Get("pt_14") async g14() {
    return this.svc.getPartnerDashboard();
  }
  @Get("pt_15") async g15() {
    return this.svc.getPartnerCertifications();
  }
  @Get("pt_16") async g16() {
    return this.svc.createCertification();
  }
  @Get("pt_17") async g17() {
    return this.svc.getPartnerTrainingCompletion();
  }
  @Get("pt_18") async g18() {
    return this.svc.createTraining();
  }
  @Get("pt_19") async g19() {
    return this.svc.getPartnerRevenueContribution();
  }
  @Get("pt_20") async g20() {
    return this.svc.getPartnerAttribution();
  }
}
