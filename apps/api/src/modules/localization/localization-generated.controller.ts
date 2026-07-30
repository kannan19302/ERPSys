// @ts-nocheck
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, HttpCode, HttpStatus, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { LocalizationGeneratedService } from "./localization-generated.service";

interface AuthenticatedRequest extends Request { user: { userId: string; tenantId: string; email: string; roles: string[] }; }

@ApiTags("localization")
@ApiBearerAuth()
@Controller("localization")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class LocalizationGeneratedController {
  constructor(private readonly svc: LocalizationGeneratedService) {}

  @ApiOperation({ summary: "List localization-entity-1" }) @Get("localization-entity-1") @Permissions("localization.localizationEntity1.read")
  async listLocalizationEntity1(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity1(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-1" }) @Get("localization-entity-1/:id") @Permissions("localization.localizationEntity1.read")
  async getLocalizationEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-1" }) @Post("localization-entity-1") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity1.create")
  async createLocalizationEntity1(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity1(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-1" }) @Put("localization-entity-1/:id") @Permissions("localization.localizationEntity1.update")
  async updateLocalizationEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity1(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-1" }) @Delete("localization-entity-1/:id") @Permissions("localization.localizationEntity1.delete")
  async deleteLocalizationEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-2" }) @Get("localization-entity-2") @Permissions("localization.localizationEntity2.read")
  async listLocalizationEntity2(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity2(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-2" }) @Get("localization-entity-2/:id") @Permissions("localization.localizationEntity2.read")
  async getLocalizationEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-2" }) @Post("localization-entity-2") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity2.create")
  async createLocalizationEntity2(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity2(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-2" }) @Put("localization-entity-2/:id") @Permissions("localization.localizationEntity2.update")
  async updateLocalizationEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity2(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-2" }) @Delete("localization-entity-2/:id") @Permissions("localization.localizationEntity2.delete")
  async deleteLocalizationEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-3" }) @Get("localization-entity-3") @Permissions("localization.localizationEntity3.read")
  async listLocalizationEntity3(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity3(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-3" }) @Get("localization-entity-3/:id") @Permissions("localization.localizationEntity3.read")
  async getLocalizationEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-3" }) @Post("localization-entity-3") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity3.create")
  async createLocalizationEntity3(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity3(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-3" }) @Put("localization-entity-3/:id") @Permissions("localization.localizationEntity3.update")
  async updateLocalizationEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity3(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-3" }) @Delete("localization-entity-3/:id") @Permissions("localization.localizationEntity3.delete")
  async deleteLocalizationEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-4" }) @Get("localization-entity-4") @Permissions("localization.localizationEntity4.read")
  async listLocalizationEntity4(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity4(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-4" }) @Get("localization-entity-4/:id") @Permissions("localization.localizationEntity4.read")
  async getLocalizationEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-4" }) @Post("localization-entity-4") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity4.create")
  async createLocalizationEntity4(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity4(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-4" }) @Put("localization-entity-4/:id") @Permissions("localization.localizationEntity4.update")
  async updateLocalizationEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity4(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-4" }) @Delete("localization-entity-4/:id") @Permissions("localization.localizationEntity4.delete")
  async deleteLocalizationEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-5" }) @Get("localization-entity-5") @Permissions("localization.localizationEntity5.read")
  async listLocalizationEntity5(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity5(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-5" }) @Get("localization-entity-5/:id") @Permissions("localization.localizationEntity5.read")
  async getLocalizationEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-5" }) @Post("localization-entity-5") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity5.create")
  async createLocalizationEntity5(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity5(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-5" }) @Put("localization-entity-5/:id") @Permissions("localization.localizationEntity5.update")
  async updateLocalizationEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity5(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-5" }) @Delete("localization-entity-5/:id") @Permissions("localization.localizationEntity5.delete")
  async deleteLocalizationEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-6" }) @Get("localization-entity-6") @Permissions("localization.localizationEntity6.read")
  async listLocalizationEntity6(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity6(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-6" }) @Get("localization-entity-6/:id") @Permissions("localization.localizationEntity6.read")
  async getLocalizationEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-6" }) @Post("localization-entity-6") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity6.create")
  async createLocalizationEntity6(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity6(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-6" }) @Put("localization-entity-6/:id") @Permissions("localization.localizationEntity6.update")
  async updateLocalizationEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity6(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-6" }) @Delete("localization-entity-6/:id") @Permissions("localization.localizationEntity6.delete")
  async deleteLocalizationEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-7" }) @Get("localization-entity-7") @Permissions("localization.localizationEntity7.read")
  async listLocalizationEntity7(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity7(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-7" }) @Get("localization-entity-7/:id") @Permissions("localization.localizationEntity7.read")
  async getLocalizationEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-7" }) @Post("localization-entity-7") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity7.create")
  async createLocalizationEntity7(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity7(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-7" }) @Put("localization-entity-7/:id") @Permissions("localization.localizationEntity7.update")
  async updateLocalizationEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity7(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-7" }) @Delete("localization-entity-7/:id") @Permissions("localization.localizationEntity7.delete")
  async deleteLocalizationEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-8" }) @Get("localization-entity-8") @Permissions("localization.localizationEntity8.read")
  async listLocalizationEntity8(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity8(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-8" }) @Get("localization-entity-8/:id") @Permissions("localization.localizationEntity8.read")
  async getLocalizationEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-8" }) @Post("localization-entity-8") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity8.create")
  async createLocalizationEntity8(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity8(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-8" }) @Put("localization-entity-8/:id") @Permissions("localization.localizationEntity8.update")
  async updateLocalizationEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity8(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-8" }) @Delete("localization-entity-8/:id") @Permissions("localization.localizationEntity8.delete")
  async deleteLocalizationEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-9" }) @Get("localization-entity-9") @Permissions("localization.localizationEntity9.read")
  async listLocalizationEntity9(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity9(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-9" }) @Get("localization-entity-9/:id") @Permissions("localization.localizationEntity9.read")
  async getLocalizationEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-9" }) @Post("localization-entity-9") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity9.create")
  async createLocalizationEntity9(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity9(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-9" }) @Put("localization-entity-9/:id") @Permissions("localization.localizationEntity9.update")
  async updateLocalizationEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity9(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-9" }) @Delete("localization-entity-9/:id") @Permissions("localization.localizationEntity9.delete")
  async deleteLocalizationEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-10" }) @Get("localization-entity-10") @Permissions("localization.localizationEntity10.read")
  async listLocalizationEntity10(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity10(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-10" }) @Get("localization-entity-10/:id") @Permissions("localization.localizationEntity10.read")
  async getLocalizationEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-10" }) @Post("localization-entity-10") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity10.create")
  async createLocalizationEntity10(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity10(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-10" }) @Put("localization-entity-10/:id") @Permissions("localization.localizationEntity10.update")
  async updateLocalizationEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity10(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-10" }) @Delete("localization-entity-10/:id") @Permissions("localization.localizationEntity10.delete")
  async deleteLocalizationEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-11" }) @Get("localization-entity-11") @Permissions("localization.localizationEntity11.read")
  async listLocalizationEntity11(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity11(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-11" }) @Get("localization-entity-11/:id") @Permissions("localization.localizationEntity11.read")
  async getLocalizationEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-11" }) @Post("localization-entity-11") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity11.create")
  async createLocalizationEntity11(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity11(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-11" }) @Put("localization-entity-11/:id") @Permissions("localization.localizationEntity11.update")
  async updateLocalizationEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity11(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-11" }) @Delete("localization-entity-11/:id") @Permissions("localization.localizationEntity11.delete")
  async deleteLocalizationEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-12" }) @Get("localization-entity-12") @Permissions("localization.localizationEntity12.read")
  async listLocalizationEntity12(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity12(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-12" }) @Get("localization-entity-12/:id") @Permissions("localization.localizationEntity12.read")
  async getLocalizationEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-12" }) @Post("localization-entity-12") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity12.create")
  async createLocalizationEntity12(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity12(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-12" }) @Put("localization-entity-12/:id") @Permissions("localization.localizationEntity12.update")
  async updateLocalizationEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity12(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-12" }) @Delete("localization-entity-12/:id") @Permissions("localization.localizationEntity12.delete")
  async deleteLocalizationEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-13" }) @Get("localization-entity-13") @Permissions("localization.localizationEntity13.read")
  async listLocalizationEntity13(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity13(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-13" }) @Get("localization-entity-13/:id") @Permissions("localization.localizationEntity13.read")
  async getLocalizationEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-13" }) @Post("localization-entity-13") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity13.create")
  async createLocalizationEntity13(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity13(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-13" }) @Put("localization-entity-13/:id") @Permissions("localization.localizationEntity13.update")
  async updateLocalizationEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity13(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-13" }) @Delete("localization-entity-13/:id") @Permissions("localization.localizationEntity13.delete")
  async deleteLocalizationEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-14" }) @Get("localization-entity-14") @Permissions("localization.localizationEntity14.read")
  async listLocalizationEntity14(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity14(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-14" }) @Get("localization-entity-14/:id") @Permissions("localization.localizationEntity14.read")
  async getLocalizationEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-14" }) @Post("localization-entity-14") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity14.create")
  async createLocalizationEntity14(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity14(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-14" }) @Put("localization-entity-14/:id") @Permissions("localization.localizationEntity14.update")
  async updateLocalizationEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity14(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-14" }) @Delete("localization-entity-14/:id") @Permissions("localization.localizationEntity14.delete")
  async deleteLocalizationEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-15" }) @Get("localization-entity-15") @Permissions("localization.localizationEntity15.read")
  async listLocalizationEntity15(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity15(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-15" }) @Get("localization-entity-15/:id") @Permissions("localization.localizationEntity15.read")
  async getLocalizationEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-15" }) @Post("localization-entity-15") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity15.create")
  async createLocalizationEntity15(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity15(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-15" }) @Put("localization-entity-15/:id") @Permissions("localization.localizationEntity15.update")
  async updateLocalizationEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity15(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-15" }) @Delete("localization-entity-15/:id") @Permissions("localization.localizationEntity15.delete")
  async deleteLocalizationEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-16" }) @Get("localization-entity-16") @Permissions("localization.localizationEntity16.read")
  async listLocalizationEntity16(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity16(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-16" }) @Get("localization-entity-16/:id") @Permissions("localization.localizationEntity16.read")
  async getLocalizationEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-16" }) @Post("localization-entity-16") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity16.create")
  async createLocalizationEntity16(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity16(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-16" }) @Put("localization-entity-16/:id") @Permissions("localization.localizationEntity16.update")
  async updateLocalizationEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity16(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-16" }) @Delete("localization-entity-16/:id") @Permissions("localization.localizationEntity16.delete")
  async deleteLocalizationEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-17" }) @Get("localization-entity-17") @Permissions("localization.localizationEntity17.read")
  async listLocalizationEntity17(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity17(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-17" }) @Get("localization-entity-17/:id") @Permissions("localization.localizationEntity17.read")
  async getLocalizationEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-17" }) @Post("localization-entity-17") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity17.create")
  async createLocalizationEntity17(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity17(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-17" }) @Put("localization-entity-17/:id") @Permissions("localization.localizationEntity17.update")
  async updateLocalizationEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity17(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-17" }) @Delete("localization-entity-17/:id") @Permissions("localization.localizationEntity17.delete")
  async deleteLocalizationEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-18" }) @Get("localization-entity-18") @Permissions("localization.localizationEntity18.read")
  async listLocalizationEntity18(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity18(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-18" }) @Get("localization-entity-18/:id") @Permissions("localization.localizationEntity18.read")
  async getLocalizationEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-18" }) @Post("localization-entity-18") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity18.create")
  async createLocalizationEntity18(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity18(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-18" }) @Put("localization-entity-18/:id") @Permissions("localization.localizationEntity18.update")
  async updateLocalizationEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity18(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-18" }) @Delete("localization-entity-18/:id") @Permissions("localization.localizationEntity18.delete")
  async deleteLocalizationEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-19" }) @Get("localization-entity-19") @Permissions("localization.localizationEntity19.read")
  async listLocalizationEntity19(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity19(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-19" }) @Get("localization-entity-19/:id") @Permissions("localization.localizationEntity19.read")
  async getLocalizationEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-19" }) @Post("localization-entity-19") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity19.create")
  async createLocalizationEntity19(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity19(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-19" }) @Put("localization-entity-19/:id") @Permissions("localization.localizationEntity19.update")
  async updateLocalizationEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity19(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-19" }) @Delete("localization-entity-19/:id") @Permissions("localization.localizationEntity19.delete")
  async deleteLocalizationEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-20" }) @Get("localization-entity-20") @Permissions("localization.localizationEntity20.read")
  async listLocalizationEntity20(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity20(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-20" }) @Get("localization-entity-20/:id") @Permissions("localization.localizationEntity20.read")
  async getLocalizationEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-20" }) @Post("localization-entity-20") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity20.create")
  async createLocalizationEntity20(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity20(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-20" }) @Put("localization-entity-20/:id") @Permissions("localization.localizationEntity20.update")
  async updateLocalizationEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity20(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-20" }) @Delete("localization-entity-20/:id") @Permissions("localization.localizationEntity20.delete")
  async deleteLocalizationEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-21" }) @Get("localization-entity-21") @Permissions("localization.localizationEntity21.read")
  async listLocalizationEntity21(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity21(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-21" }) @Get("localization-entity-21/:id") @Permissions("localization.localizationEntity21.read")
  async getLocalizationEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-21" }) @Post("localization-entity-21") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity21.create")
  async createLocalizationEntity21(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity21(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-21" }) @Put("localization-entity-21/:id") @Permissions("localization.localizationEntity21.update")
  async updateLocalizationEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity21(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-21" }) @Delete("localization-entity-21/:id") @Permissions("localization.localizationEntity21.delete")
  async deleteLocalizationEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-22" }) @Get("localization-entity-22") @Permissions("localization.localizationEntity22.read")
  async listLocalizationEntity22(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity22(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-22" }) @Get("localization-entity-22/:id") @Permissions("localization.localizationEntity22.read")
  async getLocalizationEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-22" }) @Post("localization-entity-22") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity22.create")
  async createLocalizationEntity22(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity22(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-22" }) @Put("localization-entity-22/:id") @Permissions("localization.localizationEntity22.update")
  async updateLocalizationEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity22(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-22" }) @Delete("localization-entity-22/:id") @Permissions("localization.localizationEntity22.delete")
  async deleteLocalizationEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-23" }) @Get("localization-entity-23") @Permissions("localization.localizationEntity23.read")
  async listLocalizationEntity23(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity23(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-23" }) @Get("localization-entity-23/:id") @Permissions("localization.localizationEntity23.read")
  async getLocalizationEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-23" }) @Post("localization-entity-23") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity23.create")
  async createLocalizationEntity23(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity23(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-23" }) @Put("localization-entity-23/:id") @Permissions("localization.localizationEntity23.update")
  async updateLocalizationEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity23(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-23" }) @Delete("localization-entity-23/:id") @Permissions("localization.localizationEntity23.delete")
  async deleteLocalizationEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-24" }) @Get("localization-entity-24") @Permissions("localization.localizationEntity24.read")
  async listLocalizationEntity24(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity24(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-24" }) @Get("localization-entity-24/:id") @Permissions("localization.localizationEntity24.read")
  async getLocalizationEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-24" }) @Post("localization-entity-24") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity24.create")
  async createLocalizationEntity24(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity24(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-24" }) @Put("localization-entity-24/:id") @Permissions("localization.localizationEntity24.update")
  async updateLocalizationEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity24(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-24" }) @Delete("localization-entity-24/:id") @Permissions("localization.localizationEntity24.delete")
  async deleteLocalizationEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-25" }) @Get("localization-entity-25") @Permissions("localization.localizationEntity25.read")
  async listLocalizationEntity25(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity25(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-25" }) @Get("localization-entity-25/:id") @Permissions("localization.localizationEntity25.read")
  async getLocalizationEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-25" }) @Post("localization-entity-25") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity25.create")
  async createLocalizationEntity25(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity25(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-25" }) @Put("localization-entity-25/:id") @Permissions("localization.localizationEntity25.update")
  async updateLocalizationEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity25(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-25" }) @Delete("localization-entity-25/:id") @Permissions("localization.localizationEntity25.delete")
  async deleteLocalizationEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-26" }) @Get("localization-entity-26") @Permissions("localization.localizationEntity26.read")
  async listLocalizationEntity26(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity26(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-26" }) @Get("localization-entity-26/:id") @Permissions("localization.localizationEntity26.read")
  async getLocalizationEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-26" }) @Post("localization-entity-26") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity26.create")
  async createLocalizationEntity26(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity26(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-26" }) @Put("localization-entity-26/:id") @Permissions("localization.localizationEntity26.update")
  async updateLocalizationEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity26(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-26" }) @Delete("localization-entity-26/:id") @Permissions("localization.localizationEntity26.delete")
  async deleteLocalizationEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-27" }) @Get("localization-entity-27") @Permissions("localization.localizationEntity27.read")
  async listLocalizationEntity27(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity27(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-27" }) @Get("localization-entity-27/:id") @Permissions("localization.localizationEntity27.read")
  async getLocalizationEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-27" }) @Post("localization-entity-27") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity27.create")
  async createLocalizationEntity27(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity27(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-27" }) @Put("localization-entity-27/:id") @Permissions("localization.localizationEntity27.update")
  async updateLocalizationEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity27(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-27" }) @Delete("localization-entity-27/:id") @Permissions("localization.localizationEntity27.delete")
  async deleteLocalizationEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-28" }) @Get("localization-entity-28") @Permissions("localization.localizationEntity28.read")
  async listLocalizationEntity28(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity28(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-28" }) @Get("localization-entity-28/:id") @Permissions("localization.localizationEntity28.read")
  async getLocalizationEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-28" }) @Post("localization-entity-28") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity28.create")
  async createLocalizationEntity28(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity28(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-28" }) @Put("localization-entity-28/:id") @Permissions("localization.localizationEntity28.update")
  async updateLocalizationEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity28(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-28" }) @Delete("localization-entity-28/:id") @Permissions("localization.localizationEntity28.delete")
  async deleteLocalizationEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-29" }) @Get("localization-entity-29") @Permissions("localization.localizationEntity29.read")
  async listLocalizationEntity29(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity29(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-29" }) @Get("localization-entity-29/:id") @Permissions("localization.localizationEntity29.read")
  async getLocalizationEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-29" }) @Post("localization-entity-29") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity29.create")
  async createLocalizationEntity29(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity29(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-29" }) @Put("localization-entity-29/:id") @Permissions("localization.localizationEntity29.update")
  async updateLocalizationEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity29(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-29" }) @Delete("localization-entity-29/:id") @Permissions("localization.localizationEntity29.delete")
  async deleteLocalizationEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-30" }) @Get("localization-entity-30") @Permissions("localization.localizationEntity30.read")
  async listLocalizationEntity30(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity30(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-30" }) @Get("localization-entity-30/:id") @Permissions("localization.localizationEntity30.read")
  async getLocalizationEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-30" }) @Post("localization-entity-30") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity30.create")
  async createLocalizationEntity30(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity30(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-30" }) @Put("localization-entity-30/:id") @Permissions("localization.localizationEntity30.update")
  async updateLocalizationEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity30(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-30" }) @Delete("localization-entity-30/:id") @Permissions("localization.localizationEntity30.delete")
  async deleteLocalizationEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-31" }) @Get("localization-entity-31") @Permissions("localization.localizationEntity31.read")
  async listLocalizationEntity31(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity31(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-31" }) @Get("localization-entity-31/:id") @Permissions("localization.localizationEntity31.read")
  async getLocalizationEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-31" }) @Post("localization-entity-31") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity31.create")
  async createLocalizationEntity31(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity31(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-31" }) @Put("localization-entity-31/:id") @Permissions("localization.localizationEntity31.update")
  async updateLocalizationEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity31(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-31" }) @Delete("localization-entity-31/:id") @Permissions("localization.localizationEntity31.delete")
  async deleteLocalizationEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-32" }) @Get("localization-entity-32") @Permissions("localization.localizationEntity32.read")
  async listLocalizationEntity32(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity32(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-32" }) @Get("localization-entity-32/:id") @Permissions("localization.localizationEntity32.read")
  async getLocalizationEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-32" }) @Post("localization-entity-32") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity32.create")
  async createLocalizationEntity32(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity32(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-32" }) @Put("localization-entity-32/:id") @Permissions("localization.localizationEntity32.update")
  async updateLocalizationEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity32(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-32" }) @Delete("localization-entity-32/:id") @Permissions("localization.localizationEntity32.delete")
  async deleteLocalizationEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-33" }) @Get("localization-entity-33") @Permissions("localization.localizationEntity33.read")
  async listLocalizationEntity33(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity33(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-33" }) @Get("localization-entity-33/:id") @Permissions("localization.localizationEntity33.read")
  async getLocalizationEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-33" }) @Post("localization-entity-33") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity33.create")
  async createLocalizationEntity33(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity33(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-33" }) @Put("localization-entity-33/:id") @Permissions("localization.localizationEntity33.update")
  async updateLocalizationEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity33(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-33" }) @Delete("localization-entity-33/:id") @Permissions("localization.localizationEntity33.delete")
  async deleteLocalizationEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-34" }) @Get("localization-entity-34") @Permissions("localization.localizationEntity34.read")
  async listLocalizationEntity34(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity34(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-34" }) @Get("localization-entity-34/:id") @Permissions("localization.localizationEntity34.read")
  async getLocalizationEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-34" }) @Post("localization-entity-34") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity34.create")
  async createLocalizationEntity34(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity34(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-34" }) @Put("localization-entity-34/:id") @Permissions("localization.localizationEntity34.update")
  async updateLocalizationEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity34(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-34" }) @Delete("localization-entity-34/:id") @Permissions("localization.localizationEntity34.delete")
  async deleteLocalizationEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-35" }) @Get("localization-entity-35") @Permissions("localization.localizationEntity35.read")
  async listLocalizationEntity35(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity35(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-35" }) @Get("localization-entity-35/:id") @Permissions("localization.localizationEntity35.read")
  async getLocalizationEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-35" }) @Post("localization-entity-35") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity35.create")
  async createLocalizationEntity35(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity35(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-35" }) @Put("localization-entity-35/:id") @Permissions("localization.localizationEntity35.update")
  async updateLocalizationEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity35(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-35" }) @Delete("localization-entity-35/:id") @Permissions("localization.localizationEntity35.delete")
  async deleteLocalizationEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-36" }) @Get("localization-entity-36") @Permissions("localization.localizationEntity36.read")
  async listLocalizationEntity36(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity36(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-36" }) @Get("localization-entity-36/:id") @Permissions("localization.localizationEntity36.read")
  async getLocalizationEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-36" }) @Post("localization-entity-36") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity36.create")
  async createLocalizationEntity36(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity36(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-36" }) @Put("localization-entity-36/:id") @Permissions("localization.localizationEntity36.update")
  async updateLocalizationEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity36(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-36" }) @Delete("localization-entity-36/:id") @Permissions("localization.localizationEntity36.delete")
  async deleteLocalizationEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-37" }) @Get("localization-entity-37") @Permissions("localization.localizationEntity37.read")
  async listLocalizationEntity37(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity37(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-37" }) @Get("localization-entity-37/:id") @Permissions("localization.localizationEntity37.read")
  async getLocalizationEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-37" }) @Post("localization-entity-37") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity37.create")
  async createLocalizationEntity37(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity37(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-37" }) @Put("localization-entity-37/:id") @Permissions("localization.localizationEntity37.update")
  async updateLocalizationEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity37(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-37" }) @Delete("localization-entity-37/:id") @Permissions("localization.localizationEntity37.delete")
  async deleteLocalizationEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-38" }) @Get("localization-entity-38") @Permissions("localization.localizationEntity38.read")
  async listLocalizationEntity38(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity38(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-38" }) @Get("localization-entity-38/:id") @Permissions("localization.localizationEntity38.read")
  async getLocalizationEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-38" }) @Post("localization-entity-38") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity38.create")
  async createLocalizationEntity38(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity38(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-38" }) @Put("localization-entity-38/:id") @Permissions("localization.localizationEntity38.update")
  async updateLocalizationEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity38(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-38" }) @Delete("localization-entity-38/:id") @Permissions("localization.localizationEntity38.delete")
  async deleteLocalizationEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-39" }) @Get("localization-entity-39") @Permissions("localization.localizationEntity39.read")
  async listLocalizationEntity39(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity39(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-39" }) @Get("localization-entity-39/:id") @Permissions("localization.localizationEntity39.read")
  async getLocalizationEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-39" }) @Post("localization-entity-39") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity39.create")
  async createLocalizationEntity39(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity39(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-39" }) @Put("localization-entity-39/:id") @Permissions("localization.localizationEntity39.update")
  async updateLocalizationEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity39(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-39" }) @Delete("localization-entity-39/:id") @Permissions("localization.localizationEntity39.delete")
  async deleteLocalizationEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "List localization-entity-40" }) @Get("localization-entity-40") @Permissions("localization.localizationEntity40.read")
  async listLocalizationEntity40(@Req() req: AuthenticatedRequest) { return this.svc.listLocalizationEntity40(req.user.tenantId); }

  @ApiOperation({ summary: "Get localization-entity-40" }) @Get("localization-entity-40/:id") @Permissions("localization.localizationEntity40.read")
  async getLocalizationEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getLocalizationEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create localization-entity-40" }) @Post("localization-entity-40") @HttpCode(HttpStatus.CREATED) @Permissions("localization.localizationEntity40.create")
  async createLocalizationEntity40(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createLocalizationEntity40(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update localization-entity-40" }) @Put("localization-entity-40/:id") @Permissions("localization.localizationEntity40.update")
  async updateLocalizationEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateLocalizationEntity40(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete localization-entity-40" }) @Delete("localization-entity-40/:id") @Permissions("localization.localizationEntity40.delete")
  async deleteLocalizationEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteLocalizationEntity40(req.user.tenantId, id); }

}
