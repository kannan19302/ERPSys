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
import { BuilderAbTestingService } from "../services/builder-ab-testing.service";

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
export class AbTestingController {
  constructor(private readonly service: BuilderAbTestingService) {}

  @Get("ab-tests")
  @Permissions("builder.ab-testing.read")
  async getABTests(
    @Req() req: AuthenticatedRequest,
    @Query("search") search?: string,
  ) {
    return this.service.getABTests(req.user.tenantId, { search });
  }

  @Get("ab-tests/:id")
  @Permissions("builder.ab-testing.read")
  async getABTestById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getABTestById(req.user.tenantId, id);
  }

  @Post("ab-tests")
  @Permissions("builder.ab-testing.create")
  async createABTest(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.createABTest(req.user.tenantId, dto);
  }

  @Patch("ab-tests/:id")
  @Permissions("builder.ab-testing.update")
  async updateABTest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateABTest(req.user.tenantId, id, dto);
  }

  @Delete("ab-tests/:id")
  @Permissions("builder.ab-testing.delete")
  async deleteABTest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteABTest(req.user.tenantId, id);
  }

  @Post("ab-tests/:id/start")
  @Permissions("builder.ab-testing.update")
  async startABTest(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.startABTest(req.user.tenantId, id);
  }

  @Get("ab-tests/:id/variants")
  @Permissions("builder.ab-testing.read")
  async getVariants(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.getVariants(req.user.tenantId, id);
  }

  @Post("ab-tests/:id/variants")
  @Permissions("builder.ab-testing.create")
  async addVariant(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.addVariant(req.user.tenantId, id, dto);
  }

  @Patch("ab-tests/variants/:variantId")
  @Permissions("builder.ab-testing.update")
  async updateVariant(
    @Req() req: AuthenticatedRequest,
    @Param("variantId") variantId: string,
    @Body() dto: any,
  ) {
    return this.service.updateVariant(req.user.tenantId, variantId, dto);
  }

  @Delete("ab-tests/variants/:variantId")
  @Permissions("builder.ab-testing.delete")
  async deleteVariant(
    @Req() req: AuthenticatedRequest,
    @Param("variantId") variantId: string,
  ) {
    return this.service.deleteVariant(req.user.tenantId, variantId);
  }

  @Post("ab-tests/:id/analyze")
  @Permissions("builder.ab-testing.analyze")
  async analyzeResults(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.analyzeResults(req.user.tenantId, id);
  }

  @Get("segments")
  @Permissions("builder.ab-testing.read")
  async getSegments(@Req() req: AuthenticatedRequest) {
    return this.service.getSegments(req.user.tenantId);
  }

  @Get("segments/:id")
  @Permissions("builder.ab-testing.read")
  async getSegmentById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getSegmentById(req.user.tenantId, id);
  }

  @Post("segments")
  @Permissions("builder.ab-testing.create")
  async defineSegment(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.defineSegment(req.user.tenantId, dto);
  }

  @Patch("segments/:id")
  @Permissions("builder.ab-testing.update")
  async updateSegment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateSegment(req.user.tenantId, id, dto);
  }

  @Delete("segments/:id")
  @Permissions("builder.ab-testing.delete")
  async deleteSegment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteSegment(req.user.tenantId, id);
  }

  @Get("ab-testing/dashboard")
  @Permissions("builder.ab-testing.read")
  async getPersonalizationDashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getPersonalizationDashboard(req.user.tenantId);
  }
}
