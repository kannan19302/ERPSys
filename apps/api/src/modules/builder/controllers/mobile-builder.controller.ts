// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { BuilderMobileService } from "../services/builder-mobile.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller("builder")
@UseGuards(JwtAuthGuard, RbacGuard)
export class MobileBuilderController {
  constructor(private readonly service: BuilderMobileService) {}

  @Get("mobile-apps")
  @Permissions("builder.mobile-builder.read")
  async getMobileApps(@Req() req: AuthenticatedRequest) {
    return this.service.getMobileApps(req.user.tenantId);
  }

  @Get("mobile-apps/:id")
  @Permissions("builder.mobile-builder.read")
  async getMobileAppById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getMobileAppById(req.user.tenantId, id);
  }

  @Post("mobile-apps")
  @Permissions("builder.mobile-builder.create")
  async createMobileApp(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.createMobileApp(req.user.tenantId, dto);
  }

  @Patch("mobile-apps/:id")
  @Permissions("builder.mobile-builder.update")
  async updateMobileApp(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateMobileApp(req.user.tenantId, id, dto);
  }

  @Delete("mobile-apps/:id")
  @Permissions("builder.mobile-builder.delete")
  async deleteMobileApp(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteMobileApp(req.user.tenantId, id);
  }

  @Get("mobile-apps/:id/screens")
  @Permissions("builder.mobile-builder.read")
  async getMobileScreens(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getMobileScreens(req.user.tenantId, id);
  }

  @Post("mobile-apps/:id/screens")
  @Permissions("builder.mobile-builder.create")
  async addMobileScreen(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.addMobileScreen(req.user.tenantId, id, dto);
  }

  @Patch("mobile-apps/screens/:screenId")
  @Permissions("builder.mobile-builder.update")
  async updateMobileScreen(
    @Req() req: AuthenticatedRequest,
    @Param("screenId") screenId: string,
    @Body() dto: any,
  ) {
    return this.service.updateMobileScreen(req.user.tenantId, screenId, dto);
  }

  @Delete("mobile-apps/screens/:screenId")
  @Permissions("builder.mobile-builder.delete")
  async deleteMobileScreen(
    @Req() req: AuthenticatedRequest,
    @Param("screenId") screenId: string,
  ) {
    return this.service.deleteMobileScreen(req.user.tenantId, screenId);
  }

  @Post("mobile-apps/:id/push-config")
  @Permissions("builder.mobile-builder.update")
  async configurePushNotifications(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.configurePushNotifications(req.user.tenantId, id, dto);
  }

  @Get("mobile-apps/:id/push-config")
  @Permissions("builder.mobile-builder.read")
  async getPushConfig(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getPushConfig(req.user.tenantId, id);
  }

  @Get("mobile-apps/:id/preview")
  @Permissions("builder.mobile-builder.read")
  async previewMobileApp(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.previewMobileApp(req.user.tenantId, id);
  }

  @Post("mobile-apps/:id/deploy")
  @Permissions("builder.mobile-builder.deploy")
  async deployMobileBuild(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.deployMobileBuild(req.user.tenantId, id, dto);
  }

  @Get("mobile-apps/:id/builds")
  @Permissions("builder.mobile-builder.read")
  async getMobileBuilds(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getMobileBuilds(req.user.tenantId, id);
  }
}
