import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ReportingGeneratedService } from "./reporting-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("reporting")
@ApiBearerAuth()
@Controller("reporting")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ReportingGeneratedController {
  constructor(private readonly svc: ReportingGeneratedService) {}

  @ApiOperation({ summary: "List reporting-entity-1" })
  @Get("reporting-entity-1")
  @Permissions("reporting.reportingEntity1.read")
  async listReportingEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-1" })
  @Get("reporting-entity-1/:id")
  @Permissions("reporting.reportingEntity1.read")
  async getReportingEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-1" })
  @Post("reporting-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity1.create")
  async createReportingEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-1" })
  @Put("reporting-entity-1/:id")
  @Permissions("reporting.reportingEntity1.update")
  async updateReportingEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-1" })
  @Delete("reporting-entity-1/:id")
  @Permissions("reporting.reportingEntity1.delete")
  async deleteReportingEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-2" })
  @Get("reporting-entity-2")
  @Permissions("reporting.reportingEntity2.read")
  async listReportingEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-2" })
  @Get("reporting-entity-2/:id")
  @Permissions("reporting.reportingEntity2.read")
  async getReportingEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-2" })
  @Post("reporting-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity2.create")
  async createReportingEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-2" })
  @Put("reporting-entity-2/:id")
  @Permissions("reporting.reportingEntity2.update")
  async updateReportingEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-2" })
  @Delete("reporting-entity-2/:id")
  @Permissions("reporting.reportingEntity2.delete")
  async deleteReportingEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-3" })
  @Get("reporting-entity-3")
  @Permissions("reporting.reportingEntity3.read")
  async listReportingEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-3" })
  @Get("reporting-entity-3/:id")
  @Permissions("reporting.reportingEntity3.read")
  async getReportingEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-3" })
  @Post("reporting-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity3.create")
  async createReportingEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-3" })
  @Put("reporting-entity-3/:id")
  @Permissions("reporting.reportingEntity3.update")
  async updateReportingEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-3" })
  @Delete("reporting-entity-3/:id")
  @Permissions("reporting.reportingEntity3.delete")
  async deleteReportingEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-4" })
  @Get("reporting-entity-4")
  @Permissions("reporting.reportingEntity4.read")
  async listReportingEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-4" })
  @Get("reporting-entity-4/:id")
  @Permissions("reporting.reportingEntity4.read")
  async getReportingEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-4" })
  @Post("reporting-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity4.create")
  async createReportingEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-4" })
  @Put("reporting-entity-4/:id")
  @Permissions("reporting.reportingEntity4.update")
  async updateReportingEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-4" })
  @Delete("reporting-entity-4/:id")
  @Permissions("reporting.reportingEntity4.delete")
  async deleteReportingEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-5" })
  @Get("reporting-entity-5")
  @Permissions("reporting.reportingEntity5.read")
  async listReportingEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-5" })
  @Get("reporting-entity-5/:id")
  @Permissions("reporting.reportingEntity5.read")
  async getReportingEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-5" })
  @Post("reporting-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity5.create")
  async createReportingEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-5" })
  @Put("reporting-entity-5/:id")
  @Permissions("reporting.reportingEntity5.update")
  async updateReportingEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-5" })
  @Delete("reporting-entity-5/:id")
  @Permissions("reporting.reportingEntity5.delete")
  async deleteReportingEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-6" })
  @Get("reporting-entity-6")
  @Permissions("reporting.reportingEntity6.read")
  async listReportingEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-6" })
  @Get("reporting-entity-6/:id")
  @Permissions("reporting.reportingEntity6.read")
  async getReportingEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-6" })
  @Post("reporting-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity6.create")
  async createReportingEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-6" })
  @Put("reporting-entity-6/:id")
  @Permissions("reporting.reportingEntity6.update")
  async updateReportingEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-6" })
  @Delete("reporting-entity-6/:id")
  @Permissions("reporting.reportingEntity6.delete")
  async deleteReportingEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-7" })
  @Get("reporting-entity-7")
  @Permissions("reporting.reportingEntity7.read")
  async listReportingEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-7" })
  @Get("reporting-entity-7/:id")
  @Permissions("reporting.reportingEntity7.read")
  async getReportingEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-7" })
  @Post("reporting-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity7.create")
  async createReportingEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-7" })
  @Put("reporting-entity-7/:id")
  @Permissions("reporting.reportingEntity7.update")
  async updateReportingEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-7" })
  @Delete("reporting-entity-7/:id")
  @Permissions("reporting.reportingEntity7.delete")
  async deleteReportingEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-8" })
  @Get("reporting-entity-8")
  @Permissions("reporting.reportingEntity8.read")
  async listReportingEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-8" })
  @Get("reporting-entity-8/:id")
  @Permissions("reporting.reportingEntity8.read")
  async getReportingEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-8" })
  @Post("reporting-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity8.create")
  async createReportingEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-8" })
  @Put("reporting-entity-8/:id")
  @Permissions("reporting.reportingEntity8.update")
  async updateReportingEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-8" })
  @Delete("reporting-entity-8/:id")
  @Permissions("reporting.reportingEntity8.delete")
  async deleteReportingEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-9" })
  @Get("reporting-entity-9")
  @Permissions("reporting.reportingEntity9.read")
  async listReportingEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-9" })
  @Get("reporting-entity-9/:id")
  @Permissions("reporting.reportingEntity9.read")
  async getReportingEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-9" })
  @Post("reporting-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity9.create")
  async createReportingEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-9" })
  @Put("reporting-entity-9/:id")
  @Permissions("reporting.reportingEntity9.update")
  async updateReportingEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-9" })
  @Delete("reporting-entity-9/:id")
  @Permissions("reporting.reportingEntity9.delete")
  async deleteReportingEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-10" })
  @Get("reporting-entity-10")
  @Permissions("reporting.reportingEntity10.read")
  async listReportingEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-10" })
  @Get("reporting-entity-10/:id")
  @Permissions("reporting.reportingEntity10.read")
  async getReportingEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-10" })
  @Post("reporting-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity10.create")
  async createReportingEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-10" })
  @Put("reporting-entity-10/:id")
  @Permissions("reporting.reportingEntity10.update")
  async updateReportingEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-10" })
  @Delete("reporting-entity-10/:id")
  @Permissions("reporting.reportingEntity10.delete")
  async deleteReportingEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-11" })
  @Get("reporting-entity-11")
  @Permissions("reporting.reportingEntity11.read")
  async listReportingEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-11" })
  @Get("reporting-entity-11/:id")
  @Permissions("reporting.reportingEntity11.read")
  async getReportingEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-11" })
  @Post("reporting-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity11.create")
  async createReportingEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-11" })
  @Put("reporting-entity-11/:id")
  @Permissions("reporting.reportingEntity11.update")
  async updateReportingEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-11" })
  @Delete("reporting-entity-11/:id")
  @Permissions("reporting.reportingEntity11.delete")
  async deleteReportingEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-12" })
  @Get("reporting-entity-12")
  @Permissions("reporting.reportingEntity12.read")
  async listReportingEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-12" })
  @Get("reporting-entity-12/:id")
  @Permissions("reporting.reportingEntity12.read")
  async getReportingEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-12" })
  @Post("reporting-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity12.create")
  async createReportingEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-12" })
  @Put("reporting-entity-12/:id")
  @Permissions("reporting.reportingEntity12.update")
  async updateReportingEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-12" })
  @Delete("reporting-entity-12/:id")
  @Permissions("reporting.reportingEntity12.delete")
  async deleteReportingEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-13" })
  @Get("reporting-entity-13")
  @Permissions("reporting.reportingEntity13.read")
  async listReportingEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-13" })
  @Get("reporting-entity-13/:id")
  @Permissions("reporting.reportingEntity13.read")
  async getReportingEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-13" })
  @Post("reporting-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity13.create")
  async createReportingEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-13" })
  @Put("reporting-entity-13/:id")
  @Permissions("reporting.reportingEntity13.update")
  async updateReportingEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-13" })
  @Delete("reporting-entity-13/:id")
  @Permissions("reporting.reportingEntity13.delete")
  async deleteReportingEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-14" })
  @Get("reporting-entity-14")
  @Permissions("reporting.reportingEntity14.read")
  async listReportingEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-14" })
  @Get("reporting-entity-14/:id")
  @Permissions("reporting.reportingEntity14.read")
  async getReportingEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-14" })
  @Post("reporting-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity14.create")
  async createReportingEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-14" })
  @Put("reporting-entity-14/:id")
  @Permissions("reporting.reportingEntity14.update")
  async updateReportingEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-14" })
  @Delete("reporting-entity-14/:id")
  @Permissions("reporting.reportingEntity14.delete")
  async deleteReportingEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-15" })
  @Get("reporting-entity-15")
  @Permissions("reporting.reportingEntity15.read")
  async listReportingEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-15" })
  @Get("reporting-entity-15/:id")
  @Permissions("reporting.reportingEntity15.read")
  async getReportingEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-15" })
  @Post("reporting-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity15.create")
  async createReportingEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-15" })
  @Put("reporting-entity-15/:id")
  @Permissions("reporting.reportingEntity15.update")
  async updateReportingEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-15" })
  @Delete("reporting-entity-15/:id")
  @Permissions("reporting.reportingEntity15.delete")
  async deleteReportingEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-16" })
  @Get("reporting-entity-16")
  @Permissions("reporting.reportingEntity16.read")
  async listReportingEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-16" })
  @Get("reporting-entity-16/:id")
  @Permissions("reporting.reportingEntity16.read")
  async getReportingEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-16" })
  @Post("reporting-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity16.create")
  async createReportingEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-16" })
  @Put("reporting-entity-16/:id")
  @Permissions("reporting.reportingEntity16.update")
  async updateReportingEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-16" })
  @Delete("reporting-entity-16/:id")
  @Permissions("reporting.reportingEntity16.delete")
  async deleteReportingEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List reporting-entity-17" })
  @Get("reporting-entity-17")
  @Permissions("reporting.reportingEntity17.read")
  async listReportingEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listReportingEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get reporting-entity-17" })
  @Get("reporting-entity-17/:id")
  @Permissions("reporting.reportingEntity17.read")
  async getReportingEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getReportingEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create reporting-entity-17" })
  @Post("reporting-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("reporting.reportingEntity17.create")
  async createReportingEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createReportingEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update reporting-entity-17" })
  @Put("reporting-entity-17/:id")
  @Permissions("reporting.reportingEntity17.update")
  async updateReportingEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateReportingEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete reporting-entity-17" })
  @Delete("reporting-entity-17/:id")
  @Permissions("reporting.reportingEntity17.delete")
  async deleteReportingEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteReportingEntity17(req.user.tenantId, id);
  }
}
