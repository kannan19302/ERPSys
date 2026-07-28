import { Controller, Get, Post, Body, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PeopleOperationsService } from "./people-operations.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
  };
}

@Controller("people")
@UseGuards(JwtAuthGuard, RbacGuard)
export class PeopleOperationsController {
  constructor(private readonly service: PeopleOperationsService) {}

  @Get("onboarding")
  @Permissions("people.onboarding.read")
  async getOnboardingTasks(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getOnboardingTasks(req.user.tenantId, query);
  }

  @Post("onboarding")
  @Permissions("people.onboarding.create")
  async createOnboardingTask(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createOnboardingTask(req.user.tenantId, body);
  }

  @Get("time-off")
  @Permissions("people.time-off.read")
  async getTimeOffRequests(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getTimeOffRequests(req.user.tenantId, query);
  }

  @Post("time-off")
  @Permissions("people.time-off.create")
  async createTimeOffRequest(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createTimeOffRequest(req.user.tenantId, body);
  }

  @Get("recognition")
  @Permissions("people.recognition.read")
  async getPeerRecognitions(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getPeerRecognitions(req.user.tenantId, query);
  }

  @Post("recognition")
  @Permissions("people.recognition.create")
  async createPeerRecognition(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createPeerRecognition(req.user.tenantId, body);
  }
}
