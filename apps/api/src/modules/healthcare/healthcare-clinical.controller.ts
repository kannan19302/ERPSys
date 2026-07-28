import { Controller, Get, Post, Body, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HealthcareClinicalService } from "./healthcare-clinical.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
  };
}

@Controller("healthcare")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HealthcareClinicalController {
  constructor(private readonly service: HealthcareClinicalService) {}

  @Get("clinical-notes")
  @Permissions("healthcare.clinical-notes.read")
  async getClinicalNotes(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getClinicalNotes(req.user.tenantId, query);
  }

  @Post("clinical-notes")
  @Permissions("healthcare.clinical-notes.create")
  async createClinicalNote(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createClinicalNote(req.user.tenantId, body);
  }

  @Get("telehealth-sessions")
  @Permissions("healthcare.telehealth.read")
  async getTelehealthSessions(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getTelehealthSessions(req.user.tenantId, query);
  }

  @Post("telehealth-sessions")
  @Permissions("healthcare.telehealth.create")
  async createTelehealthSession(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createTelehealthSession(req.user.tenantId, body);
  }

  @Get("medical-bills")
  @Permissions("healthcare.medical-bills.read")
  async getMedicalBills(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getMedicalBills(req.user.tenantId, query);
  }

  @Post("medical-bills")
  @Permissions("healthcare.medical-bills.create")
  async createMedicalBill(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createMedicalBill(req.user.tenantId, body);
  }
}
