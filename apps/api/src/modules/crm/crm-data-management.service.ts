import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmDataManagementService {
  async getDeduplicationJobs(..._args: any[]) {
    return { status: "ok", method: "getDeduplicationJobs" };
  }
  async createJob(..._args: any[]) {
    return { status: "ok", method: "createJob" };
  }
  async mergeRecords(..._args: any[]) {
    return { status: "ok", method: "mergeRecords" };
  }
  async getExportHistory(..._args: any[]) {
    return { status: "ok", method: "getExportHistory" };
  }
}
