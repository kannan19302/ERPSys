import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, HttpCode, HttpStatus, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ReportingGeneratedService } from "./reporting-generated.service";

interface AuthenticatedRequest extends Request { user: { userId: string; tenantId: string; email: string; roles: string[] }; }

@ApiTags("reporting")
@ApiBearerAuth()
@Controller("reporting")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ReportingGeneratedController {
  constructor(private readonly svc: ReportingGeneratedService) {}

  @ApiOperation({ summary: "List reporting-entity-1" }) @Get("reporting-entity-1") @Permissions("reporting.reportingEntity1.read")
  async listReportingEntity1(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity1(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-1" }) @Get("reporting-entity-1/:id") @Permissions("reporting.reportingEntity1.read")
  async getReportingEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-1" }) @Post("reporting-entity-1") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity1.create")
  async createReportingEntity1(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity1(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-1" }) @Put("reporting-entity-1/:id") @Permissions("reporting.reportingEntity1.update")
  async updateReportingEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity1(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-1" }) @Delete("reporting-entity-1/:id") @Permissions("reporting.reportingEntity1.delete")
  async deleteReportingEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-2" }) @Get("reporting-entity-2") @Permissions("reporting.reportingEntity2.read")
  async listReportingEntity2(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity2(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-2" }) @Get("reporting-entity-2/:id") @Permissions("reporting.reportingEntity2.read")
  async getReportingEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-2" }) @Post("reporting-entity-2") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity2.create")
  async createReportingEntity2(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity2(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-2" }) @Put("reporting-entity-2/:id") @Permissions("reporting.reportingEntity2.update")
  async updateReportingEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity2(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-2" }) @Delete("reporting-entity-2/:id") @Permissions("reporting.reportingEntity2.delete")
  async deleteReportingEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-3" }) @Get("reporting-entity-3") @Permissions("reporting.reportingEntity3.read")
  async listReportingEntity3(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity3(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-3" }) @Get("reporting-entity-3/:id") @Permissions("reporting.reportingEntity3.read")
  async getReportingEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-3" }) @Post("reporting-entity-3") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity3.create")
  async createReportingEntity3(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity3(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-3" }) @Put("reporting-entity-3/:id") @Permissions("reporting.reportingEntity3.update")
  async updateReportingEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity3(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-3" }) @Delete("reporting-entity-3/:id") @Permissions("reporting.reportingEntity3.delete")
  async deleteReportingEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-4" }) @Get("reporting-entity-4") @Permissions("reporting.reportingEntity4.read")
  async listReportingEntity4(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity4(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-4" }) @Get("reporting-entity-4/:id") @Permissions("reporting.reportingEntity4.read")
  async getReportingEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-4" }) @Post("reporting-entity-4") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity4.create")
  async createReportingEntity4(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity4(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-4" }) @Put("reporting-entity-4/:id") @Permissions("reporting.reportingEntity4.update")
  async updateReportingEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity4(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-4" }) @Delete("reporting-entity-4/:id") @Permissions("reporting.reportingEntity4.delete")
  async deleteReportingEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-5" }) @Get("reporting-entity-5") @Permissions("reporting.reportingEntity5.read")
  async listReportingEntity5(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity5(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-5" }) @Get("reporting-entity-5/:id") @Permissions("reporting.reportingEntity5.read")
  async getReportingEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-5" }) @Post("reporting-entity-5") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity5.create")
  async createReportingEntity5(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity5(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-5" }) @Put("reporting-entity-5/:id") @Permissions("reporting.reportingEntity5.update")
  async updateReportingEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity5(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-5" }) @Delete("reporting-entity-5/:id") @Permissions("reporting.reportingEntity5.delete")
  async deleteReportingEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-6" }) @Get("reporting-entity-6") @Permissions("reporting.reportingEntity6.read")
  async listReportingEntity6(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity6(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-6" }) @Get("reporting-entity-6/:id") @Permissions("reporting.reportingEntity6.read")
  async getReportingEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-6" }) @Post("reporting-entity-6") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity6.create")
  async createReportingEntity6(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity6(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-6" }) @Put("reporting-entity-6/:id") @Permissions("reporting.reportingEntity6.update")
  async updateReportingEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity6(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-6" }) @Delete("reporting-entity-6/:id") @Permissions("reporting.reportingEntity6.delete")
  async deleteReportingEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-7" }) @Get("reporting-entity-7") @Permissions("reporting.reportingEntity7.read")
  async listReportingEntity7(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity7(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-7" }) @Get("reporting-entity-7/:id") @Permissions("reporting.reportingEntity7.read")
  async getReportingEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-7" }) @Post("reporting-entity-7") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity7.create")
  async createReportingEntity7(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity7(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-7" }) @Put("reporting-entity-7/:id") @Permissions("reporting.reportingEntity7.update")
  async updateReportingEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity7(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-7" }) @Delete("reporting-entity-7/:id") @Permissions("reporting.reportingEntity7.delete")
  async deleteReportingEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-8" }) @Get("reporting-entity-8") @Permissions("reporting.reportingEntity8.read")
  async listReportingEntity8(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity8(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-8" }) @Get("reporting-entity-8/:id") @Permissions("reporting.reportingEntity8.read")
  async getReportingEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-8" }) @Post("reporting-entity-8") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity8.create")
  async createReportingEntity8(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity8(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-8" }) @Put("reporting-entity-8/:id") @Permissions("reporting.reportingEntity8.update")
  async updateReportingEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity8(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-8" }) @Delete("reporting-entity-8/:id") @Permissions("reporting.reportingEntity8.delete")
  async deleteReportingEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-9" }) @Get("reporting-entity-9") @Permissions("reporting.reportingEntity9.read")
  async listReportingEntity9(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity9(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-9" }) @Get("reporting-entity-9/:id") @Permissions("reporting.reportingEntity9.read")
  async getReportingEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-9" }) @Post("reporting-entity-9") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity9.create")
  async createReportingEntity9(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity9(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-9" }) @Put("reporting-entity-9/:id") @Permissions("reporting.reportingEntity9.update")
  async updateReportingEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity9(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-9" }) @Delete("reporting-entity-9/:id") @Permissions("reporting.reportingEntity9.delete")
  async deleteReportingEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-10" }) @Get("reporting-entity-10") @Permissions("reporting.reportingEntity10.read")
  async listReportingEntity10(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity10(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-10" }) @Get("reporting-entity-10/:id") @Permissions("reporting.reportingEntity10.read")
  async getReportingEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-10" }) @Post("reporting-entity-10") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity10.create")
  async createReportingEntity10(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity10(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-10" }) @Put("reporting-entity-10/:id") @Permissions("reporting.reportingEntity10.update")
  async updateReportingEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity10(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-10" }) @Delete("reporting-entity-10/:id") @Permissions("reporting.reportingEntity10.delete")
  async deleteReportingEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-11" }) @Get("reporting-entity-11") @Permissions("reporting.reportingEntity11.read")
  async listReportingEntity11(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity11(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-11" }) @Get("reporting-entity-11/:id") @Permissions("reporting.reportingEntity11.read")
  async getReportingEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-11" }) @Post("reporting-entity-11") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity11.create")
  async createReportingEntity11(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity11(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-11" }) @Put("reporting-entity-11/:id") @Permissions("reporting.reportingEntity11.update")
  async updateReportingEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity11(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-11" }) @Delete("reporting-entity-11/:id") @Permissions("reporting.reportingEntity11.delete")
  async deleteReportingEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-12" }) @Get("reporting-entity-12") @Permissions("reporting.reportingEntity12.read")
  async listReportingEntity12(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity12(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-12" }) @Get("reporting-entity-12/:id") @Permissions("reporting.reportingEntity12.read")
  async getReportingEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-12" }) @Post("reporting-entity-12") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity12.create")
  async createReportingEntity12(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity12(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-12" }) @Put("reporting-entity-12/:id") @Permissions("reporting.reportingEntity12.update")
  async updateReportingEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity12(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-12" }) @Delete("reporting-entity-12/:id") @Permissions("reporting.reportingEntity12.delete")
  async deleteReportingEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-13" }) @Get("reporting-entity-13") @Permissions("reporting.reportingEntity13.read")
  async listReportingEntity13(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity13(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-13" }) @Get("reporting-entity-13/:id") @Permissions("reporting.reportingEntity13.read")
  async getReportingEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-13" }) @Post("reporting-entity-13") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity13.create")
  async createReportingEntity13(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity13(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-13" }) @Put("reporting-entity-13/:id") @Permissions("reporting.reportingEntity13.update")
  async updateReportingEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity13(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-13" }) @Delete("reporting-entity-13/:id") @Permissions("reporting.reportingEntity13.delete")
  async deleteReportingEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-14" }) @Get("reporting-entity-14") @Permissions("reporting.reportingEntity14.read")
  async listReportingEntity14(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity14(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-14" }) @Get("reporting-entity-14/:id") @Permissions("reporting.reportingEntity14.read")
  async getReportingEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-14" }) @Post("reporting-entity-14") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity14.create")
  async createReportingEntity14(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity14(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-14" }) @Put("reporting-entity-14/:id") @Permissions("reporting.reportingEntity14.update")
  async updateReportingEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity14(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-14" }) @Delete("reporting-entity-14/:id") @Permissions("reporting.reportingEntity14.delete")
  async deleteReportingEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-15" }) @Get("reporting-entity-15") @Permissions("reporting.reportingEntity15.read")
  async listReportingEntity15(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity15(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-15" }) @Get("reporting-entity-15/:id") @Permissions("reporting.reportingEntity15.read")
  async getReportingEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-15" }) @Post("reporting-entity-15") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity15.create")
  async createReportingEntity15(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity15(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-15" }) @Put("reporting-entity-15/:id") @Permissions("reporting.reportingEntity15.update")
  async updateReportingEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity15(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-15" }) @Delete("reporting-entity-15/:id") @Permissions("reporting.reportingEntity15.delete")
  async deleteReportingEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-16" }) @Get("reporting-entity-16") @Permissions("reporting.reportingEntity16.read")
  async listReportingEntity16(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity16(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-16" }) @Get("reporting-entity-16/:id") @Permissions("reporting.reportingEntity16.read")
  async getReportingEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-16" }) @Post("reporting-entity-16") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity16.create")
  async createReportingEntity16(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity16(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-16" }) @Put("reporting-entity-16/:id") @Permissions("reporting.reportingEntity16.update")
  async updateReportingEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity16(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-16" }) @Delete("reporting-entity-16/:id") @Permissions("reporting.reportingEntity16.delete")
  async deleteReportingEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-17" }) @Get("reporting-entity-17") @Permissions("reporting.reportingEntity17.read")
  async listReportingEntity17(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity17(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-17" }) @Get("reporting-entity-17/:id") @Permissions("reporting.reportingEntity17.read")
  async getReportingEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-17" }) @Post("reporting-entity-17") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity17.create")
  async createReportingEntity17(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity17(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-17" }) @Put("reporting-entity-17/:id") @Permissions("reporting.reportingEntity17.update")
  async updateReportingEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity17(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-17" }) @Delete("reporting-entity-17/:id") @Permissions("reporting.reportingEntity17.delete")
  async deleteReportingEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-18" }) @Get("reporting-entity-18") @Permissions("reporting.reportingEntity18.read")
  async listReportingEntity18(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity18(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-18" }) @Get("reporting-entity-18/:id") @Permissions("reporting.reportingEntity18.read")
  async getReportingEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-18" }) @Post("reporting-entity-18") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity18.create")
  async createReportingEntity18(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity18(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-18" }) @Put("reporting-entity-18/:id") @Permissions("reporting.reportingEntity18.update")
  async updateReportingEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity18(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-18" }) @Delete("reporting-entity-18/:id") @Permissions("reporting.reportingEntity18.delete")
  async deleteReportingEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-19" }) @Get("reporting-entity-19") @Permissions("reporting.reportingEntity19.read")
  async listReportingEntity19(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity19(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-19" }) @Get("reporting-entity-19/:id") @Permissions("reporting.reportingEntity19.read")
  async getReportingEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-19" }) @Post("reporting-entity-19") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity19.create")
  async createReportingEntity19(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity19(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-19" }) @Put("reporting-entity-19/:id") @Permissions("reporting.reportingEntity19.update")
  async updateReportingEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity19(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-19" }) @Delete("reporting-entity-19/:id") @Permissions("reporting.reportingEntity19.delete")
  async deleteReportingEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-20" }) @Get("reporting-entity-20") @Permissions("reporting.reportingEntity20.read")
  async listReportingEntity20(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity20(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-20" }) @Get("reporting-entity-20/:id") @Permissions("reporting.reportingEntity20.read")
  async getReportingEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-20" }) @Post("reporting-entity-20") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity20.create")
  async createReportingEntity20(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity20(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-20" }) @Put("reporting-entity-20/:id") @Permissions("reporting.reportingEntity20.update")
  async updateReportingEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity20(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-20" }) @Delete("reporting-entity-20/:id") @Permissions("reporting.reportingEntity20.delete")
  async deleteReportingEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-21" }) @Get("reporting-entity-21") @Permissions("reporting.reportingEntity21.read")
  async listReportingEntity21(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity21(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-21" }) @Get("reporting-entity-21/:id") @Permissions("reporting.reportingEntity21.read")
  async getReportingEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-21" }) @Post("reporting-entity-21") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity21.create")
  async createReportingEntity21(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity21(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-21" }) @Put("reporting-entity-21/:id") @Permissions("reporting.reportingEntity21.update")
  async updateReportingEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity21(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-21" }) @Delete("reporting-entity-21/:id") @Permissions("reporting.reportingEntity21.delete")
  async deleteReportingEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-22" }) @Get("reporting-entity-22") @Permissions("reporting.reportingEntity22.read")
  async listReportingEntity22(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity22(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-22" }) @Get("reporting-entity-22/:id") @Permissions("reporting.reportingEntity22.read")
  async getReportingEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-22" }) @Post("reporting-entity-22") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity22.create")
  async createReportingEntity22(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity22(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-22" }) @Put("reporting-entity-22/:id") @Permissions("reporting.reportingEntity22.update")
  async updateReportingEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity22(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-22" }) @Delete("reporting-entity-22/:id") @Permissions("reporting.reportingEntity22.delete")
  async deleteReportingEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-23" }) @Get("reporting-entity-23") @Permissions("reporting.reportingEntity23.read")
  async listReportingEntity23(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity23(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-23" }) @Get("reporting-entity-23/:id") @Permissions("reporting.reportingEntity23.read")
  async getReportingEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-23" }) @Post("reporting-entity-23") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity23.create")
  async createReportingEntity23(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity23(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-23" }) @Put("reporting-entity-23/:id") @Permissions("reporting.reportingEntity23.update")
  async updateReportingEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity23(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-23" }) @Delete("reporting-entity-23/:id") @Permissions("reporting.reportingEntity23.delete")
  async deleteReportingEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-24" }) @Get("reporting-entity-24") @Permissions("reporting.reportingEntity24.read")
  async listReportingEntity24(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity24(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-24" }) @Get("reporting-entity-24/:id") @Permissions("reporting.reportingEntity24.read")
  async getReportingEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-24" }) @Post("reporting-entity-24") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity24.create")
  async createReportingEntity24(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity24(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-24" }) @Put("reporting-entity-24/:id") @Permissions("reporting.reportingEntity24.update")
  async updateReportingEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity24(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-24" }) @Delete("reporting-entity-24/:id") @Permissions("reporting.reportingEntity24.delete")
  async deleteReportingEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-25" }) @Get("reporting-entity-25") @Permissions("reporting.reportingEntity25.read")
  async listReportingEntity25(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity25(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-25" }) @Get("reporting-entity-25/:id") @Permissions("reporting.reportingEntity25.read")
  async getReportingEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-25" }) @Post("reporting-entity-25") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity25.create")
  async createReportingEntity25(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity25(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-25" }) @Put("reporting-entity-25/:id") @Permissions("reporting.reportingEntity25.update")
  async updateReportingEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity25(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-25" }) @Delete("reporting-entity-25/:id") @Permissions("reporting.reportingEntity25.delete")
  async deleteReportingEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-26" }) @Get("reporting-entity-26") @Permissions("reporting.reportingEntity26.read")
  async listReportingEntity26(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity26(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-26" }) @Get("reporting-entity-26/:id") @Permissions("reporting.reportingEntity26.read")
  async getReportingEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-26" }) @Post("reporting-entity-26") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity26.create")
  async createReportingEntity26(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity26(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-26" }) @Put("reporting-entity-26/:id") @Permissions("reporting.reportingEntity26.update")
  async updateReportingEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity26(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-26" }) @Delete("reporting-entity-26/:id") @Permissions("reporting.reportingEntity26.delete")
  async deleteReportingEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-27" }) @Get("reporting-entity-27") @Permissions("reporting.reportingEntity27.read")
  async listReportingEntity27(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity27(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-27" }) @Get("reporting-entity-27/:id") @Permissions("reporting.reportingEntity27.read")
  async getReportingEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-27" }) @Post("reporting-entity-27") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity27.create")
  async createReportingEntity27(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity27(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-27" }) @Put("reporting-entity-27/:id") @Permissions("reporting.reportingEntity27.update")
  async updateReportingEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity27(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-27" }) @Delete("reporting-entity-27/:id") @Permissions("reporting.reportingEntity27.delete")
  async deleteReportingEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-28" }) @Get("reporting-entity-28") @Permissions("reporting.reportingEntity28.read")
  async listReportingEntity28(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity28(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-28" }) @Get("reporting-entity-28/:id") @Permissions("reporting.reportingEntity28.read")
  async getReportingEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-28" }) @Post("reporting-entity-28") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity28.create")
  async createReportingEntity28(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity28(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-28" }) @Put("reporting-entity-28/:id") @Permissions("reporting.reportingEntity28.update")
  async updateReportingEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity28(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-28" }) @Delete("reporting-entity-28/:id") @Permissions("reporting.reportingEntity28.delete")
  async deleteReportingEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-29" }) @Get("reporting-entity-29") @Permissions("reporting.reportingEntity29.read")
  async listReportingEntity29(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity29(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-29" }) @Get("reporting-entity-29/:id") @Permissions("reporting.reportingEntity29.read")
  async getReportingEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-29" }) @Post("reporting-entity-29") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity29.create")
  async createReportingEntity29(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity29(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-29" }) @Put("reporting-entity-29/:id") @Permissions("reporting.reportingEntity29.update")
  async updateReportingEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity29(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-29" }) @Delete("reporting-entity-29/:id") @Permissions("reporting.reportingEntity29.delete")
  async deleteReportingEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-30" }) @Get("reporting-entity-30") @Permissions("reporting.reportingEntity30.read")
  async listReportingEntity30(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity30(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-30" }) @Get("reporting-entity-30/:id") @Permissions("reporting.reportingEntity30.read")
  async getReportingEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-30" }) @Post("reporting-entity-30") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity30.create")
  async createReportingEntity30(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity30(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-30" }) @Put("reporting-entity-30/:id") @Permissions("reporting.reportingEntity30.update")
  async updateReportingEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity30(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-30" }) @Delete("reporting-entity-30/:id") @Permissions("reporting.reportingEntity30.delete")
  async deleteReportingEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-31" }) @Get("reporting-entity-31") @Permissions("reporting.reportingEntity31.read")
  async listReportingEntity31(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity31(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-31" }) @Get("reporting-entity-31/:id") @Permissions("reporting.reportingEntity31.read")
  async getReportingEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-31" }) @Post("reporting-entity-31") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity31.create")
  async createReportingEntity31(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity31(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-31" }) @Put("reporting-entity-31/:id") @Permissions("reporting.reportingEntity31.update")
  async updateReportingEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity31(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-31" }) @Delete("reporting-entity-31/:id") @Permissions("reporting.reportingEntity31.delete")
  async deleteReportingEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-32" }) @Get("reporting-entity-32") @Permissions("reporting.reportingEntity32.read")
  async listReportingEntity32(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity32(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-32" }) @Get("reporting-entity-32/:id") @Permissions("reporting.reportingEntity32.read")
  async getReportingEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-32" }) @Post("reporting-entity-32") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity32.create")
  async createReportingEntity32(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity32(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-32" }) @Put("reporting-entity-32/:id") @Permissions("reporting.reportingEntity32.update")
  async updateReportingEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity32(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-32" }) @Delete("reporting-entity-32/:id") @Permissions("reporting.reportingEntity32.delete")
  async deleteReportingEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-33" }) @Get("reporting-entity-33") @Permissions("reporting.reportingEntity33.read")
  async listReportingEntity33(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity33(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-33" }) @Get("reporting-entity-33/:id") @Permissions("reporting.reportingEntity33.read")
  async getReportingEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-33" }) @Post("reporting-entity-33") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity33.create")
  async createReportingEntity33(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity33(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-33" }) @Put("reporting-entity-33/:id") @Permissions("reporting.reportingEntity33.update")
  async updateReportingEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity33(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-33" }) @Delete("reporting-entity-33/:id") @Permissions("reporting.reportingEntity33.delete")
  async deleteReportingEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-34" }) @Get("reporting-entity-34") @Permissions("reporting.reportingEntity34.read")
  async listReportingEntity34(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity34(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-34" }) @Get("reporting-entity-34/:id") @Permissions("reporting.reportingEntity34.read")
  async getReportingEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-34" }) @Post("reporting-entity-34") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity34.create")
  async createReportingEntity34(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity34(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-34" }) @Put("reporting-entity-34/:id") @Permissions("reporting.reportingEntity34.update")
  async updateReportingEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity34(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-34" }) @Delete("reporting-entity-34/:id") @Permissions("reporting.reportingEntity34.delete")
  async deleteReportingEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-35" }) @Get("reporting-entity-35") @Permissions("reporting.reportingEntity35.read")
  async listReportingEntity35(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity35(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-35" }) @Get("reporting-entity-35/:id") @Permissions("reporting.reportingEntity35.read")
  async getReportingEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-35" }) @Post("reporting-entity-35") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity35.create")
  async createReportingEntity35(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity35(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-35" }) @Put("reporting-entity-35/:id") @Permissions("reporting.reportingEntity35.update")
  async updateReportingEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity35(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-35" }) @Delete("reporting-entity-35/:id") @Permissions("reporting.reportingEntity35.delete")
  async deleteReportingEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-36" }) @Get("reporting-entity-36") @Permissions("reporting.reportingEntity36.read")
  async listReportingEntity36(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity36(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-36" }) @Get("reporting-entity-36/:id") @Permissions("reporting.reportingEntity36.read")
  async getReportingEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-36" }) @Post("reporting-entity-36") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity36.create")
  async createReportingEntity36(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity36(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-36" }) @Put("reporting-entity-36/:id") @Permissions("reporting.reportingEntity36.update")
  async updateReportingEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity36(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-36" }) @Delete("reporting-entity-36/:id") @Permissions("reporting.reportingEntity36.delete")
  async deleteReportingEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-37" }) @Get("reporting-entity-37") @Permissions("reporting.reportingEntity37.read")
  async listReportingEntity37(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity37(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-37" }) @Get("reporting-entity-37/:id") @Permissions("reporting.reportingEntity37.read")
  async getReportingEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-37" }) @Post("reporting-entity-37") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity37.create")
  async createReportingEntity37(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity37(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-37" }) @Put("reporting-entity-37/:id") @Permissions("reporting.reportingEntity37.update")
  async updateReportingEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity37(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-37" }) @Delete("reporting-entity-37/:id") @Permissions("reporting.reportingEntity37.delete")
  async deleteReportingEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-38" }) @Get("reporting-entity-38") @Permissions("reporting.reportingEntity38.read")
  async listReportingEntity38(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity38(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-38" }) @Get("reporting-entity-38/:id") @Permissions("reporting.reportingEntity38.read")
  async getReportingEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-38" }) @Post("reporting-entity-38") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity38.create")
  async createReportingEntity38(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity38(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-38" }) @Put("reporting-entity-38/:id") @Permissions("reporting.reportingEntity38.update")
  async updateReportingEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity38(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-38" }) @Delete("reporting-entity-38/:id") @Permissions("reporting.reportingEntity38.delete")
  async deleteReportingEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-39" }) @Get("reporting-entity-39") @Permissions("reporting.reportingEntity39.read")
  async listReportingEntity39(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity39(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-39" }) @Get("reporting-entity-39/:id") @Permissions("reporting.reportingEntity39.read")
  async getReportingEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-39" }) @Post("reporting-entity-39") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity39.create")
  async createReportingEntity39(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity39(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-39" }) @Put("reporting-entity-39/:id") @Permissions("reporting.reportingEntity39.update")
  async updateReportingEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity39(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-39" }) @Delete("reporting-entity-39/:id") @Permissions("reporting.reportingEntity39.delete")
  async deleteReportingEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-40" }) @Get("reporting-entity-40") @Permissions("reporting.reportingEntity40.read")
  async listReportingEntity40(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity40(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-40" }) @Get("reporting-entity-40/:id") @Permissions("reporting.reportingEntity40.read")
  async getReportingEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-40" }) @Post("reporting-entity-40") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity40.create")
  async createReportingEntity40(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity40(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-40" }) @Put("reporting-entity-40/:id") @Permissions("reporting.reportingEntity40.update")
  async updateReportingEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity40(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-40" }) @Delete("reporting-entity-40/:id") @Permissions("reporting.reportingEntity40.delete")
  async deleteReportingEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-41" }) @Get("reporting-entity-41") @Permissions("reporting.reportingEntity41.read")
  async listReportingEntity41(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity41(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-41" }) @Get("reporting-entity-41/:id") @Permissions("reporting.reportingEntity41.read")
  async getReportingEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-41" }) @Post("reporting-entity-41") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity41.create")
  async createReportingEntity41(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity41(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-41" }) @Put("reporting-entity-41/:id") @Permissions("reporting.reportingEntity41.update")
  async updateReportingEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity41(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-41" }) @Delete("reporting-entity-41/:id") @Permissions("reporting.reportingEntity41.delete")
  async deleteReportingEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-42" }) @Get("reporting-entity-42") @Permissions("reporting.reportingEntity42.read")
  async listReportingEntity42(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity42(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-42" }) @Get("reporting-entity-42/:id") @Permissions("reporting.reportingEntity42.read")
  async getReportingEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-42" }) @Post("reporting-entity-42") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity42.create")
  async createReportingEntity42(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity42(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-42" }) @Put("reporting-entity-42/:id") @Permissions("reporting.reportingEntity42.update")
  async updateReportingEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity42(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-42" }) @Delete("reporting-entity-42/:id") @Permissions("reporting.reportingEntity42.delete")
  async deleteReportingEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-43" }) @Get("reporting-entity-43") @Permissions("reporting.reportingEntity43.read")
  async listReportingEntity43(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity43(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-43" }) @Get("reporting-entity-43/:id") @Permissions("reporting.reportingEntity43.read")
  async getReportingEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-43" }) @Post("reporting-entity-43") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity43.create")
  async createReportingEntity43(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity43(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-43" }) @Put("reporting-entity-43/:id") @Permissions("reporting.reportingEntity43.update")
  async updateReportingEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity43(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-43" }) @Delete("reporting-entity-43/:id") @Permissions("reporting.reportingEntity43.delete")
  async deleteReportingEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-44" }) @Get("reporting-entity-44") @Permissions("reporting.reportingEntity44.read")
  async listReportingEntity44(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity44(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-44" }) @Get("reporting-entity-44/:id") @Permissions("reporting.reportingEntity44.read")
  async getReportingEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-44" }) @Post("reporting-entity-44") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity44.create")
  async createReportingEntity44(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity44(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-44" }) @Put("reporting-entity-44/:id") @Permissions("reporting.reportingEntity44.update")
  async updateReportingEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity44(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-44" }) @Delete("reporting-entity-44/:id") @Permissions("reporting.reportingEntity44.delete")
  async deleteReportingEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "List reporting-entity-45" }) @Get("reporting-entity-45") @Permissions("reporting.reportingEntity45.read")
  async listReportingEntity45(@Req() req: AuthenticatedRequest) { return this.svc.listReportingEntity45(req.user.tenantId); }

  @ApiOperation({ summary: "Get reporting-entity-45" }) @Get("reporting-entity-45/:id") @Permissions("reporting.reportingEntity45.read")
  async getReportingEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getReportingEntity45(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create reporting-entity-45" }) @Post("reporting-entity-45") @HttpCode(HttpStatus.CREATED) @Permissions("reporting.reportingEntity45.create")
  async createReportingEntity45(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createReportingEntity45(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update reporting-entity-45" }) @Put("reporting-entity-45/:id") @Permissions("reporting.reportingEntity45.update")
  async updateReportingEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateReportingEntity45(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete reporting-entity-45" }) @Delete("reporting-entity-45/:id") @Permissions("reporting.reportingEntity45.delete")
  async deleteReportingEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteReportingEntity45(req.user.tenantId, id); }

}
