import { Injectable } from "@nestjs/common";
@Injectable()
export class HrAnalyticsService {
  async getHeadcountPlans(..._args: any[]) {
    return { status: "ok", method: "getHeadcountPlans" };
  }
  async getHeadcountPlanById(..._args: any[]) {
    return { status: "ok", method: "getHeadcountPlanById" };
  }
  async createHeadcountPlan(..._args: any[]) {
    return { status: "ok", method: "createHeadcountPlan" };
  }
  async updateHeadcountPlan(..._args: any[]) {
    return { status: "ok", method: "updateHeadcountPlan" };
  }
  async approveHeadcountPlan(..._args: any[]) {
    return { status: "ok", method: "approveHeadcountPlan" };
  }
  async getHeadcountSummary(..._args: any[]) {
    return { status: "ok", method: "getHeadcountSummary" };
  }
  async getHeadcountPlanLines(..._args: any[]) {
    return { status: "ok", method: "getHeadcountPlanLines" };
  }
  async createHeadcountPlanLine(..._args: any[]) {
    return { status: "ok", method: "createHeadcountPlanLine" };
  }
  async updateHeadcountPlanLine(..._args: any[]) {
    return { status: "ok", method: "updateHeadcountPlanLine" };
  }
  async deleteHeadcountPlanLine(..._args: any[]) {
    return { status: "ok", method: "deleteHeadcountPlanLine" };
  }
  async getSuccessionPlans(..._args: any[]) {
    return { status: "ok", method: "getSuccessionPlans" };
  }
  async getSuccessionPlanById(..._args: any[]) {
    return { status: "ok", method: "getSuccessionPlanById" };
  }
  async createSuccessionPlan(..._args: any[]) {
    return { status: "ok", method: "createSuccessionPlan" };
  }
  async updateSuccessionPlan(..._args: any[]) {
    return { status: "ok", method: "updateSuccessionPlan" };
  }
}
