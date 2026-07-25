import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmContractDeepService {
  async getContracts(..._args: any[]) {
    return { status: "ok", method: "getContracts" };
  }
  async createContract(..._args: any[]) {
    return { status: "ok", method: "createContract" };
  }
  async updateContract(..._args: any[]) {
    return { status: "ok", method: "updateContract" };
  }
  async deleteContract(..._args: any[]) {
    return { status: "ok", method: "deleteContract" };
  }
  async getObligations(..._args: any[]) {
    return { status: "ok", method: "getObligations" };
  }
}
