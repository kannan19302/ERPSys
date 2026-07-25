import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmDealDeskService {
  async getDealAlerts(..._args: any[]) {
    return { status: "ok", method: "getDealAlerts" };
  }
  async createDealAlert(..._args: any[]) {
    return { status: "ok", method: "createDealAlert" };
  }
  async getAutomationRules(..._args: any[]) {
    return { status: "ok", method: "getAutomationRules" };
  }
  async createAutomationRule(..._args: any[]) {
    return { status: "ok", method: "createAutomationRule" };
  }
  async updateAutomationRule(..._args: any[]) {
    return { status: "ok", method: "updateAutomationRule" };
  }
  async deleteAutomationRule(..._args: any[]) {
    return { status: "ok", method: "deleteAutomationRule" };
  }
  async getApprovers(..._args: any[]) {
    return { status: "ok", method: "getApprovers" };
  }
}
