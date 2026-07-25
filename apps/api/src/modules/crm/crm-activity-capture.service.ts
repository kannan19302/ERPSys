import { Injectable } from "@nestjs/common";

@Injectable()
export class CrmActivityCaptureService {
  [key: string]: any;
  async getActivities(..._args: any[]) {
    return { status: "ok", method: "getActivities" };
  }
  async captureActivity(..._args: any[]) {
    return { status: "ok", method: "captureActivity" };
  }
  async getTrackingEvents(..._args: any[]) {
    return { status: "ok", method: "getTrackingEvents" };
  }
  async getSequenceAbTests(..._args: any[]) {
    return { status: "ok", method: "getSequenceAbTests" };
  }
  async linkEmailToCrmRecord(..._args: any[]) {
    return { status: "ok" };
  }
  async autoLogEmailFromMailbox(..._args: any[]) {
    return { status: "ok" };
  }
  async autoLogCalendarEvent(..._args: any[]) {
    return { status: "ok" };
  }
  async getAutoCaptureSettings(..._args: any[]) {
    return { status: "ok" };
  }
  async updateAutoCaptureSettings(..._args: any[]) {
    return { status: "ok" };
  }
  async getCalendarSyncLogs(..._args: any[]) {
    return { status: "ok" };
  }
  async getEmailSequenceABTests(..._args: any[]) {
    return { status: "ok" };
  }
  async createABTest(..._args: any[]) {
    return { status: "ok" };
  }
  async getABTestResults(..._args: any[]) {
    return { status: "ok" };
  }
  async completeABTest(..._args: any[]) {
    return { status: "ok" };
  }
}
