import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmForecastGovernanceService {
  async getGovernanceRules(..._args: any[]) {
    return { status: "ok", method: "getGovernanceRules" };
  }
  async createGovernanceRule(..._args: any[]) {
    return { status: "ok", method: "createGovernanceRule" };
  }
  async getForecastAuditTrail(..._args: any[]) {
    return { status: "ok", method: "getForecastAuditTrail" };
  }
  async getRollupSummary(..._args: any[]) {
    return { status: "ok", method: "getRollupSummary" };
  }
}
