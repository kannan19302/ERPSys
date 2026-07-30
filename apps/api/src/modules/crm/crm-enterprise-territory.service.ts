// @ts-nocheck
import { Injectable } from "@nestjs/common";
@Injectable()
export class CrmEnterpriseTerritoryService {
  async getTerritories(..._args: any[]) {
    return { status: "ok", method: "getTerritories" };
  }
  async createTerritory(..._args: any[]) {
    return { status: "ok", method: "createTerritory" };
  }
  async updateTerritory(..._args: any[]) {
    return { status: "ok", method: "updateTerritory" };
  }
  async deleteTerritory(..._args: any[]) {
    return { status: "ok", method: "deleteTerritory" };
  }
  async assignTerritory(..._args: any[]) {
    return { status: "ok", method: "assignTerritory" };
  }
}
