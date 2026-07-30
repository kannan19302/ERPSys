// @ts-nocheck
import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmCustomerSuccessDeepService {
  async getHealthProfiles(..._args: any[]) {
    return { status: "ok", method: "getHealthProfiles" };
  }
  async createHealthProfile(..._args: any[]) {
    return { status: "ok", method: "createHealthProfile" };
  }
  async getRiskAlerts(..._args: any[]) {
    return { status: "ok", method: "getRiskAlerts" };
  }
  async getNpsSurveys(..._args: any[]) {
    return { status: "ok", method: "getNpsSurveys" };
  }
}
