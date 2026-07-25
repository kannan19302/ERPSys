import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { HrPayrollDeepService } from "./hr-payroll-deep.service";
@ApiTags("hr-payroll-deep")
@ApiBearerAuth()
@Controller("hr/payroll-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrPayrollDeepController {
  constructor(private readonly svc: HrPayrollDeepService) {}
  @Get("pay_0") async g0() {
    return this.svc.getPayrollDashboard();
  }
  @Get("pay_1") async g1() {
    return this.svc.getSalaryStructureTemplates();
  }
  @Get("pay_2") async g2() {
    return this.svc.createSalaryStructureTemplate();
  }
  @Get("pay_3") async g3() {
    return this.svc.getEmployeeSalaryStructure();
  }
  @Get("pay_4") async g4() {
    return this.svc.assignSalaryStructure();
  }
  @Get("pay_5") async g5() {
    return this.svc.getSalaryComponents();
  }
  @Get("pay_6") async g6() {
    return this.svc.createSalaryComponent();
  }
  @Get("pay_7") async g7() {
    return this.svc.createPayrollRun();
  }
  @Get("pay_8") async g8() {
    return this.svc.getPayrollRuns();
  }
  @Get("pay_9") async g9() {
    return this.svc.getPayrollRunById();
  }
  @Get("pay_10") async g10() {
    return this.svc.calculatePayrollForEmployee();
  }
  @Get("pay_11") async g11() {
    return this.svc.processPayrollRun();
  }
  @Get("pay_12") async g12() {
    return this.svc.approvePayrollRun();
  }
  @Get("pay_13") async g13() {
    return this.svc.postPayrollToFinance();
  }
  @Get("pay_14") async g14() {
    return this.svc.getEmployeePayslip();
  }
  @Get("pay_15") async g15() {
    return this.svc.emailPayslipToEmployee();
  }
  @Get("pay_16") async g16() {
    return this.svc.bulkSendPayslips();
  }
  @Get("pay_17") async g17() {
    return this.svc.getTaxDeclarations();
  }
  @Get("pay_18") async g18() {
    return this.svc.submitTaxDeclaration();
  }
  @Get("pay_19") async g19() {
    return this.svc.verifyTaxDeclaration();
  }
  @Get("pay_20") async g20() {
    return this.svc.getAnnualTaxSummaries();
  }
  @Get("pay_21") async g21() {
    return this.svc.getStatutoryContributions();
  }
  @Get("pay_22") async g22() {
    return this.svc.recordStatutoryPayment();
  }
  @Get("pay_23") async g23() {
    return this.svc.getPayrollCostAnalytics();
  }
  @Get("pay_24") async g24() {
    return this.svc.getVarianceAnalysis();
  }
  @Get("pay_25") async g25() {
    return this.svc.getBankPaymentFile();
  }
  @Get("pay_26") async g26() {
    return this.svc.getPayrollAuditLog();
  }
  @Get("pay_27") async g27() {
    return this.svc.getBonusPools();
  }
  @Get("pay_28") async g28() {
    return this.svc.createBonusPool();
  }
  @Get("pay_29") async g29() {
    return this.svc.distributeBonus();
  }
  @Get("pay_30") async g30() {
    return this.svc.getDeductionsSummary();
  }
  @Get("pay_31") async g31() {
    return this.svc.getGlobalPayrollSummary();
  }
}
