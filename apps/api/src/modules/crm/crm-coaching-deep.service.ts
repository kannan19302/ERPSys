import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmCoachingDeepService {
  async getCoachingPrograms(..._args: any[]) {
    return { status: "ok", method: "getCoachingPrograms" };
  }
  async createCoachingProgram(..._args: any[]) {
    return { status: "ok", method: "createCoachingProgram" };
  }
  async getCoachingSessions(..._args: any[]) {
    return { status: "ok", method: "getCoachingSessions" };
  }
  async getCoachingFeedback(..._args: any[]) {
    return { status: "ok", method: "getCoachingFeedback" };
  }
}
