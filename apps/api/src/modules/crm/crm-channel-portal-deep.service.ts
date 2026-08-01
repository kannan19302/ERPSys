import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmChannelPortalDeepService {
  async getPartnerPortals(..._args: any[]) {
    return { status: "ok", method: "getPartnerPortals" };
  }
  async createPartnerPortal(..._args: any[]) {
    return { status: "ok", method: "createPartnerPortal" };
  }
  async getDealRegistrations(..._args: any[]) {
    return { status: "ok", method: "getDealRegistrations" };
  }
  async registerDeal(..._args: any[]) {
    return { status: "ok", method: "registerDeal" };
  }
}
