// @ts-nocheck
import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmRevenueAttributionDeepService {
  async getAttributionDashboard(..._args: any[]) {
    return { status: "ok", method: "getAttributionDashboard" };
  }
  async getTouchpoints(..._args: any[]) {
    return { status: "ok", method: "getTouchpoints" };
  }
  async createTouchpoint(..._args: any[]) {
    return { status: "ok", method: "createTouchpoint" };
  }
  async calculateAttribution(..._args: any[]) {
    return { status: "ok", method: "calculateAttribution" };
  }
  async getMultiTouchModels(..._args: any[]) {
    return { status: "ok", method: "getMultiTouchModels" };
  }
}
