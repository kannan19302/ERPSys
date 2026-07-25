import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmContentManagementService {
  async getContentItems(..._args: any[]) {
    return { status: "ok", method: "getContentItems" };
  }
  async createContentItem(..._args: any[]) {
    return { status: "ok", method: "createContentItem" };
  }
  async updateContentItem(..._args: any[]) {
    return { status: "ok", method: "updateContentItem" };
  }
  async deleteContentItem(..._args: any[]) {
    return { status: "ok", method: "deleteContentItem" };
  }
  async getContentAnalytics(..._args: any[]) {
    return { status: "ok", method: "getContentAnalytics" };
  }
}
