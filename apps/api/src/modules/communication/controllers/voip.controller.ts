import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { CommunicationVoipService } from "../services/communication-voip.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("communication-voip")
@ApiBearerAuth()
@Controller("communication/voip")
@UseGuards(JwtAuthGuard, RbacGuard)
export class VoipController {
  constructor(private readonly svc: CommunicationVoipService) {}

  @Get("calls")
  @Permissions("communication.voip.read")
  @ApiOperation({ summary: "List VoIP calls" })
  async getCalls(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getCalls(req.user.tenantId, q);
  }

  @Get("calls/:id")
  @Permissions("communication.voip.read")
  @ApiOperation({ summary: "Get call" })
  async getCall(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getCall(req.user.tenantId, id);
  }

  @Post("calls")
  @Permissions("communication.voip.create")
  @ApiOperation({ summary: "Initiate call" })
  async initiateCall(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.initiateCall(req.user.tenantId, req.user.userId, body.body);
  }

  @Patch("calls/:id/status")
  @Permissions("communication.voip.update")
  @ApiOperation({ summary: "Update call status" })
  async updateCallStatus(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.updateCallStatus(req.user.tenantId, id, body.body);
  }

  @Post("incoming")
  @Permissions("communication.voip.create")
  @ApiOperation({ summary: "Route incoming call" })
  async routeIncomingCall(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.routeIncomingCall(req.user.tenantId, body.body);
  }

  @Get("voicemail")
  @Permissions("communication.voip.read")
  @ApiOperation({ summary: "Get voicemail list" })
  async getVoicemail(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getVoicemail(req.user.tenantId, q);
  }

  @Post("voicemail/:id/read")
  @Permissions("communication.voip.update")
  @ApiOperation({ summary: "Mark voicemail as read" })
  async markVoicemailRead(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.markVoicemailRead(req.user.tenantId, id);
  }

  @Get("ivr-menus")
  @Permissions("communication.voip.read")
  @ApiOperation({ summary: "List IVR menus" })
  async getIvrMenus(@Req() req: AuthReq) {
    return this.svc.getIvrMenus(req.user.tenantId);
  }

  @Post("ivr-menus")
  @Permissions("communication.voip.create")
  @ApiOperation({ summary: "Create IVR menu" })
  async createIvrMenu(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createIvrMenu(req.user.tenantId, body.body);
  }

  @Post("ivr-menus/:id/options")
  @Permissions("communication.voip.create")
  @ApiOperation({ summary: "Create IVR option" })
  async createIvrOption(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.createIvrOption(req.user.tenantId, id, body.body);
  }

  @Get("analytics")
  @Permissions("communication.voip.read")
  @ApiOperation({ summary: "Get call analytics" })
  async getCallAnalytics(@Req() req: AuthReq) {
    return this.svc.getCallAnalytics(req.user.tenantId);
  }

  @Get("dashboard")
  @Permissions("communication.voip.read")
  @ApiOperation({ summary: "VoIP dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getVoipDashboard(req.user.tenantId);
  }
}
