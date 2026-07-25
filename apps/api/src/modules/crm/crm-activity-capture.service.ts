import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmActivityCaptureService {
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
}
