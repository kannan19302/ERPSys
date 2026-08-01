import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmLeadRoutingService {
  async getRoutingRules(..._args: any[]) {
    return { status: "ok", method: "getRoutingRules" };
  }
  async createRoutingRule(..._args: any[]) {
    return { status: "ok", method: "createRoutingRule" };
  }
  async updateRoutingRule(..._args: any[]) {
    return { status: "ok", method: "updateRoutingRule" };
  }
  async deleteRoutingRule(..._args: any[]) {
    return { status: "ok", method: "deleteRoutingRule" };
  }
  async routeLead(..._args: any[]) {
    return { status: "ok", method: "routeLead" };
  }
  async getRoundRobinState(..._args: any[]) {
    return { status: "ok", method: "getRoundRobinState" };
  }
  async getRoutingHistory(..._args: any[]) {
    return { status: "ok", method: "getRoutingHistory" };
  }
}
