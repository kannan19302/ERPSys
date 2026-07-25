import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmCpqService {
  async getQuotes(..._args: any[]) {
    return { status: "ok", method: "getQuotes" };
  }
  async createQuote(..._args: any[]) {
    return { status: "ok", method: "createQuote" };
  }
  async updateQuote(..._args: any[]) {
    return { status: "ok", method: "updateQuote" };
  }
  async deleteQuote(..._args: any[]) {
    return { status: "ok", method: "deleteQuote" };
  }
  async getRules(..._args: any[]) {
    return { status: "ok", method: "getRules" };
  }
}
