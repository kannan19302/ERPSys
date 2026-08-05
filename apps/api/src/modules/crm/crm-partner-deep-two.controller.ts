import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { CrmPartnerDeepTwoService } from "./crm-partner-deep-two.service";
import { Permissions } from "../../common/decorators/permissions.decorator";
@ApiTags("crm-partner-deep-two")
@ApiBearerAuth()
@Controller("crm/partner-deep-two")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPartnerDeepTwoController {
  constructor(private readonly svc: CrmPartnerDeepTwoService) {}
  @Permissions("crm.partner-contract.read")
  @Get("pt_0")
  async g0() {
    return this.svc.getPartnerContracts();
  }
  @Permissions("crm.contract.create")
  @Get("pt_1")
  async g1() {
    return this.svc.createContract();
  }
  @Permissions("crm.contract.update")
  @Get("pt_2")
  async g2() {
    return this.svc.updateContract();
  }
  @Permissions("crm.contract.delete")
  @Get("pt_3")
  async g3() {
    return this.svc.deleteContract();
  }
  @Permissions("crm.tier-requirement.read")
  @Get("pt_4")
  async g4() {
    return this.svc.getTierRequirements();
  }
  @Permissions("crm.requirement.create")
  @Get("pt_5")
  async g5() {
    return this.svc.createRequirement();
  }
  @Permissions("crm.requirement.update")
  @Get("pt_6")
  async g6() {
    return this.svc.updateRequirement();
  }
  @Permissions("crm.requirement.delete")
  @Get("pt_7")
  async g7() {
    return this.svc.deleteRequirement();
  }
  @Permissions("crm.partner-tier.evaluate")
  @Get("pt_8")
  async g8() {
    return this.svc.evaluatePartnerTier();
  }
  @Permissions("crm.partner-referral.read")
  @Get("pt_9")
  async g9() {
    return this.svc.getPartnerReferrals();
  }
  @Permissions("crm.referral.create")
  @Get("pt_10")
  async g10() {
    return this.svc.createReferral();
  }
  @Permissions("crm.referral-status.update")
  @Get("pt_11")
  async g11() {
    return this.svc.updateReferralStatus();
  }
  @Permissions("crm.partner-performance-metrics.read")
  @Get("pt_12")
  async g12() {
    return this.svc.getPartnerPerformanceMetrics();
  }
  @Permissions("crm.partner-performance.calculate")
  @Get("pt_13")
  async g13() {
    return this.svc.calculatePartnerPerformance();
  }
  @Permissions("crm.partner-dashboard.read")
  @Get("pt_14")
  async g14() {
    return this.svc.getPartnerDashboard();
  }
  @Permissions("crm.partner-certification.read")
  @Get("pt_15")
  async g15() {
    return this.svc.getPartnerCertifications();
  }
  @Permissions("crm.certification.create")
  @Get("pt_16")
  async g16() {
    return this.svc.createCertification();
  }
  @Permissions("crm.partner-training-completion.read")
  @Get("pt_17")
  async g17() {
    return this.svc.getPartnerTrainingCompletion();
  }
  @Permissions("crm.training.create")
  @Get("pt_18")
  async g18() {
    return this.svc.createTraining();
  }
  @Permissions("crm.partner-revenue-contribution.read")
  @Get("pt_19")
  async g19() {
    return this.svc.getPartnerRevenueContribution();
  }
  @Permissions("crm.partner-attribution.read")
  @Get("pt_20")
  async g20() {
    return this.svc.getPartnerAttribution();
  }
}
