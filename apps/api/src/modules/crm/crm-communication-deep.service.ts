import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmCommunicationDeepService {
  async getChannels(..._args: any[]) {
    return { status: "ok", method: "getChannels" };
  }
  async createChannel(..._args: any[]) {
    return { status: "ok", method: "createChannel" };
  }
  async getTemplates(..._args: any[]) {
    return { status: "ok", method: "getTemplates" };
  }
  async sendCommunication(..._args: any[]) {
    return { status: "ok", method: "sendCommunication" };
  }
  async getCommunicationLogs(..._args: any[]) {
    return { status: "ok", method: "getCommunicationLogs" };
  }
}
