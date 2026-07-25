import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmCustomerJourneyService {
  async getJourneys(..._args: any[]) {
    return { status: "ok", method: "getJourneys" };
  }
  async createJourney(..._args: any[]) {
    return { status: "ok", method: "createJourney" };
  }
  async getMilestones(..._args: any[]) {
    return { status: "ok", method: "getMilestones" };
  }
  async getHealthScores(..._args: any[]) {
    return { status: "ok", method: "getHealthScores" };
  }
}
