// @ts-nocheck
import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmSalesGamificationEventsService {
  async getLeaderboard(..._args: any[]) {
    return { status: "ok", method: "getLeaderboard" };
  }
  async triggerGongEvent(..._args: any[]) {
    return { status: "ok", method: "triggerGongEvent" };
  }
  async getUserBadges(..._args: any[]) {
    return { status: "ok", method: "getUserBadges" };
  }
  async getGamificationAnalytics(..._args: any[]) {
    return { status: "ok", method: "getGamificationAnalytics" };
  }
}
