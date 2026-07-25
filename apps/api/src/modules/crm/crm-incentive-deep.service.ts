import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmIncentiveDeepService {
  async getCommissionPlans(..._args: any[]) {
    return { status: "ok", method: "getCommissionPlans" };
  }
  async createCommissionPlan(..._args: any[]) {
    return { status: "ok", method: "createCommissionPlan" };
  }
  async calculateCommission(..._args: any[]) {
    return { status: "ok", method: "calculateCommission" };
  }
  async getClawbackRules(..._args: any[]) {
    return { status: "ok", method: "getClawbackRules" };
  }
  async createClawbackRule(..._args: any[]) {
    return { status: "ok", method: "createClawbackRule" };
  }
}
