// @ts-nocheck
import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmSalesCadenceDeepService {
  async getCadences(..._args: any[]) {
    return { status: "ok", method: "getCadences" };
  }
  async createCadence(..._args: any[]) {
    return { status: "ok", method: "createCadence" };
  }
  async updateCadence(..._args: any[]) {
    return { status: "ok", method: "updateCadence" };
  }
  async deleteCadence(..._args: any[]) {
    return { status: "ok", method: "deleteCadence" };
  }
  async enrollLead(..._args: any[]) {
    return { status: "ok", method: "enrollLead" };
  }
  async getCadenceAnalytics(..._args: any[]) {
    return { status: "ok", method: "getCadenceAnalytics" };
  }
}
