import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmCompetitorIntelligenceService {
  async getCompetitors(..._args: any[]) {
    return { status: "ok", method: "getCompetitors" };
  }
  async createCompetitor(..._args: any[]) {
    return { status: "ok", method: "createCompetitor" };
  }
  async getBattlecards(..._args: any[]) {
    return { status: "ok", method: "getBattlecards" };
  }
  async getWinLossAnalysis(..._args: any[]) {
    return { status: "ok", method: "getWinLossAnalysis" };
  }
}
