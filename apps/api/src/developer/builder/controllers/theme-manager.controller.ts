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
import { BuilderThemeService } from "../services/builder-theme.service";

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
export class ThemeManagerController {
  constructor(private readonly service: BuilderThemeService) {}

  @Get("themes")
  @Permissions("builder.theme.read")
  async getThemes(@Req() req: AuthenticatedRequest) {
    return this.service.getThemes(req.user.tenantId);
  }

  @Get("themes/:id")
  @Permissions("builder.theme.read")
  async getThemeById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getThemeById(req.user.tenantId, id);
  }

  @Post("themes")
  @Permissions("builder.theme.create")
  async createTheme(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.createTheme(req.user.tenantId, dto);
  }

  @Patch("themes/:id")
  @Permissions("builder.theme.update")
  async updateTheme(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateTheme(req.user.tenantId, id, dto);
  }

  @Delete("themes/:id")
  @Permissions("builder.theme.delete")
  async deleteTheme(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.deleteTheme(req.user.tenantId, id);
  }

  @Post("themes/:id/tokens")
  @Permissions("builder.theme.update")
  async updateDesignTokens(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateDesignTokens(req.user.tenantId, id, dto);
  }

  @Get("themes/:id/tokens")
  @Permissions("builder.theme.read")
  async getDesignTokens(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getDesignTokens(req.user.tenantId, id);
  }

  @Get("themes/:id/preview")
  @Permissions("builder.theme.read")
  async previewTheme(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.previewTheme(req.user.tenantId, id);
  }

  @Get("themes/:id/export")
  @Permissions("builder.theme.read")
  async exportTheme(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.exportTheme(req.user.tenantId, id);
  }

  @Post("themes/:id/snapshots")
  @Permissions("builder.theme.update")
  async takeThemeSnapshot(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.takeThemeSnapshot(req.user.tenantId, id);
  }

  @Get("themes/:id/snapshots")
  @Permissions("builder.theme.read")
  async getThemeSnapshots(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getThemeSnapshots(req.user.tenantId, id);
  }

  @Get("theme-manager/dashboard")
  @Permissions("builder.theme.read")
  async getThemeDashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getThemeDashboard(req.user.tenantId);
  }
}
