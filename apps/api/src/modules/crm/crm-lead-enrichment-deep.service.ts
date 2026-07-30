// @ts-nocheck
import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmLeadEnrichmentDeepService {
  async getSources(..._args: any[]) {
    return { status: "ok", method: "getSources" };
  }
  async createSource(..._args: any[]) {
    return { status: "ok", method: "createSource" };
  }
  async updateSource(..._args: any[]) {
    return { status: "ok", method: "updateSource" };
  }
  async enrichLead(..._args: any[]) {
    return { status: "ok", method: "enrichLead" };
  }
  async getEnrichmentLogs(..._args: any[]) {
    return { status: "ok", method: "getEnrichmentLogs" };
  }
  async getEnrichmentJobs(..._args: any[]) {
    return { status: "ok", method: "getEnrichmentJobs" };
  }
  async createJob(..._args: any[]) {
    return { status: "ok", method: "createJob" };
  }
  async getJobById(..._args: any[]) {
    return { status: "ok", method: "getJobById" };
  }
}
