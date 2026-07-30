// @ts-nocheck
import {
  Controller,
  Get,
  Post,
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
import { CommunicationVideoService } from "../services/communication-video.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("communication-video")
@ApiBearerAuth()
@Controller("communication/video")
@UseGuards(JwtAuthGuard, RbacGuard)
export class VideoDeepController {
  constructor(private readonly svc: CommunicationVideoService) {}

  @Get("meetings")
  @Permissions("communication.video.read")
  @ApiOperation({ summary: "List video meetings" })
  async getMeetings(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getMeetings(req.user.tenantId, q);
  }

  @Get("meetings/:id")
  @Permissions("communication.video.read")
  @ApiOperation({ summary: "Get meeting" })
  async getMeeting(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getMeeting(req.user.tenantId, id);
  }

  @Post("meetings")
  @Permissions("communication.video.create")
  @ApiOperation({ summary: "Create meeting with settings" })
  async createMeeting(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createMeetingWithSettings(
      req.user.tenantId,
      req.user.userId,
      body.body,
    );
  }

  @Post("meetings/:id/end")
  @Permissions("communication.video.update")
  @ApiOperation({ summary: "End meeting" })
  async endMeeting(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.endMeeting(req.user.tenantId, id);
  }

  @Get("meetings/:id/recordings")
  @Permissions("communication.video.read")
  @ApiOperation({ summary: "Get meeting recordings" })
  async getRecordings(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getMeetingRecordings(req.user.tenantId, id);
  }

  @Get("recordings/:id")
  @Permissions("communication.video.read")
  @ApiOperation({ summary: "Get recording" })
  async getRecording(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getRecording(req.user.tenantId, id);
  }

  @Post("meetings/:id/breakout-rooms")
  @Permissions("communication.video.create")
  @ApiOperation({ summary: "Create breakout room" })
  async createBreakoutRoom(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.createBreakoutRoom(
      req.user.tenantId,
      id,
      req.user.userId,
      body.body,
    );
  }

  @Get("meetings/:id/breakout-rooms")
  @Permissions("communication.video.read")
  @ApiOperation({ summary: "Get breakout rooms" })
  async getBreakoutRooms(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getBreakoutRooms(req.user.tenantId, id);
  }

  @Post("breakout-rooms/:id/end")
  @Permissions("communication.video.update")
  @ApiOperation({ summary: "End breakout room" })
  async endBreakoutRoom(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.endBreakoutRoom(req.user.tenantId, id);
  }

  @Get("meetings/:id/analytics")
  @Permissions("communication.video.read")
  @ApiOperation({ summary: "Get meeting analytics" })
  async getMeetingAnalytics(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getMeetingAnalytics(req.user.tenantId, id);
  }

  @Get("dashboard")
  @Permissions("communication.video.read")
  @ApiOperation({ summary: "Video dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getVideoDashboard(req.user.tenantId);
  }
}
