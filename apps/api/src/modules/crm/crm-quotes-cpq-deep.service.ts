import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmQuotesCpqDeepService {
  async generateQuoteBundle(..._args: any[]) {
    return { status: "ok", method: "generateQuoteBundle" };
  }
  async getQuoteBundles(..._args: any[]) {
    return { status: "ok", method: "getQuoteBundles" };
  }
  async getDiscountApprovalMatrix(..._args: any[]) {
    return { status: "ok", method: "getDiscountApprovalMatrix" };
  }
  async getMarginAnalysis(..._args: any[]) {
    return { status: "ok", method: "getMarginAnalysis" };
  }
}
