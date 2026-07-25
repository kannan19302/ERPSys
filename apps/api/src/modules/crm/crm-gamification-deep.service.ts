import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmGamificationDeepService {
  async getGamificationDashboard(..._args: any[]) {
    return { status: "ok", method: "getGamificationDashboard" };
  }
  async getSalesContests(..._args: any[]) {
    return { status: "ok", method: "getSalesContests" };
  }
  async createSalesContest(..._args: any[]) {
    return { status: "ok", method: "createSalesContest" };
  }
  async getLeaderboard(..._args: any[]) {
    return { status: "ok", method: "getLeaderboard" };
  }
  async getBadges(..._args: any[]) {
    return { status: "ok", method: "getBadges" };
  }
  async awardBadge(..._args: any[]) {
    return { status: "ok", method: "awardBadge" };
  }
  async getPointsHistory(..._args: any[]) {
    return { status: "ok", method: "getPointsHistory" };
  }
}
