// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { BuilderAdvancedFormsService } from "../services/builder-advanced-forms.service";

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
export class AdvancedFormsController {
  constructor(private readonly service: BuilderAdvancedFormsService) {}

  @Get("advanced-forms")
  @Permissions("builder.advanced-forms.read")
  async getAdvancedForms(
    @Req() req: AuthenticatedRequest,
    @Query("search") search?: string,
  ) {
    return this.service.getAdvancedForms(req.user.tenantId, { search });
  }

  @Get("advanced-forms/:id")
  @Permissions("builder.advanced-forms.read")
  async getAdvancedFormById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getAdvancedFormById(req.user.tenantId, id);
  }

  @Post("advanced-forms")
  @Permissions("builder.advanced-forms.create")
  async createConditionalForm(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
  ) {
    return this.service.createConditionalForm(req.user.tenantId, dto);
  }

  @Patch("advanced-forms/:id")
  @Permissions("builder.advanced-forms.update")
  async updateAdvancedForm(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateAdvancedForm(req.user.tenantId, id, dto);
  }

  @Delete("advanced-forms/:id")
  @Permissions("builder.advanced-forms.delete")
  async deleteAdvancedForm(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteAdvancedForm(req.user.tenantId, id);
  }

  @Post("advanced-forms/:id/calculated-fields")
  @Permissions("builder.advanced-forms.update")
  async addCalculatedField(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.addCalculatedField(req.user.tenantId, id, dto);
  }

  @Post("advanced-forms/:id/pages")
  @Permissions("builder.advanced-forms.update")
  async addFormPage(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.addFormPage(req.user.tenantId, id, dto);
  }

  @Get("advanced-forms/:id/analytics")
  @Permissions("builder.advanced-forms.read")
  async getFormAnalytics(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getFormAnalytics(req.user.tenantId, id);
  }

  @Post("advanced-forms/:id/versions")
  @Permissions("builder.advanced-forms.create")
  async createFormVersion(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.createFormVersion(req.user.tenantId, id, dto);
  }

  @Get("advanced-forms/:id/versions")
  @Permissions("builder.advanced-forms.read")
  async getFormVersions(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getFormVersions(req.user.tenantId, id);
  }

  @Get("advanced-forms/:id/preview")
  @Permissions("builder.advanced-forms.read")
  async previewForm(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.previewForm(req.user.tenantId, id);
  }
}
