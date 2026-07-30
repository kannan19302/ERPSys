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
import { BuilderApiService } from "../services/builder-api.service";

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
export class ApiBuilderController {
  constructor(private readonly service: BuilderApiService) {}

  @Get("api-endpoints")
  @Permissions("builder.api-builder.read")
  async getApiEndpoints(
    @Req() req: AuthenticatedRequest,
    @Query("search") search?: string,
  ) {
    return this.service.getApiEndpoints(req.user.tenantId, { search });
  }

  @Get("api-endpoints/:id")
  @Permissions("builder.api-builder.read")
  async getApiEndpointById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getApiEndpointById(req.user.tenantId, id);
  }

  @Post("api-endpoints")
  @Permissions("builder.api-builder.create")
  async createApiEndpoint(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.createApiEndpoint(req.user.tenantId, dto);
  }

  @Patch("api-endpoints/:id")
  @Permissions("builder.api-builder.update")
  async updateApiEndpoint(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateApiEndpoint(req.user.tenantId, id, dto);
  }

  @Delete("api-endpoints/:id")
  @Permissions("builder.api-builder.delete")
  async deleteApiEndpoint(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteApiEndpoint(req.user.tenantId, id);
  }

  @Post("api-endpoints/:id/mappings")
  @Permissions("builder.api-builder.update")
  async addEndpointMapping(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.addEndpointMapping(req.user.tenantId, id, dto);
  }

  @Post("api-endpoints/:id/test")
  @Permissions("builder.api-builder.test")
  async testApiEndpoint(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.testApiEndpoint(req.user.tenantId, id, dto);
  }

  @Get("api-endpoints/:id/test-runs")
  @Permissions("builder.api-builder.read")
  async getApiTestRuns(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getApiTestRuns(req.user.tenantId, id);
  }

  @Get("api-endpoints/:id/docs")
  @Permissions("builder.api-builder.read")
  async generateApiDocs(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.generateApiDocs(req.user.tenantId, id);
  }

  @Get("api-builder/dashboard")
  @Permissions("builder.api-builder.read")
  async getApiDashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getApiDashboard(req.user.tenantId);
  }
}
