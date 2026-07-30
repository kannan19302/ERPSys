// @ts-nocheck
import { Controller, Get, Post, Body, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { RealEstatePropertyService } from "./real-estate-property.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
  };
}

@Controller("real-estate")
@UseGuards(JwtAuthGuard, RbacGuard)
export class RealEstatePropertyController {
  constructor(private readonly service: RealEstatePropertyService) {}

  @Get("inspections")
  @Permissions("real-estate.inspections.read")
  async getInspections(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getInspections(req.user.tenantId, query);
  }

  @Post("inspections")
  @Permissions("real-estate.inspections.create")
  async createInspection(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createInspection(req.user.tenantId, body);
  }

  @Get("rent-collection")
  @Permissions("real-estate.rent-collection.read")
  async getRentCollectionLogs(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getRentCollectionLogs(req.user.tenantId, query);
  }

  @Post("rent-collection")
  @Permissions("real-estate.rent-collection.create")
  async createRentCollectionLog(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createRentCollectionLog(req.user.tenantId, body);
  }

  @Get("syndicate")
  @Permissions("real-estate.syndicate.read")
  async getListingSyndicates(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.service.getListingSyndicates(req.user.tenantId, query);
  }

  @Post("syndicate")
  @Permissions("real-estate.syndicate.create")
  async createListingSyndicate(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.service.createListingSyndicate(req.user.tenantId, body);
  }
}
