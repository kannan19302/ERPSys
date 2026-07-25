import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmGuidedSellingDeepService {
  async getPlaybooks(..._args: any[]) {
    return { status: "ok", method: "getPlaybooks" };
  }
  async createPlaybook(..._args: any[]) {
    return { status: "ok", method: "createPlaybook" };
  }
  async getRecommendedActions(..._args: any[]) {
    return { status: "ok", method: "getRecommendedActions" };
  }
  async getBattlecards(..._args: any[]) {
    return { status: "ok", method: "getBattlecards" };
  }
}
