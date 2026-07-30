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
import { PwaGeneratedService } from "./pwa-generated.service";

interface AuthenticatedRequest extends Request { user: { userId: string; tenantId: string; email: string; roles: string[] }; }

@ApiTags("pwa")
@ApiBearerAuth()
@Controller("pwa")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class PwaGeneratedController {
  constructor(private readonly svc: PwaGeneratedService) {}

  @ApiOperation({ summary: "List pwa-entity-1" }) @Get("pwa-entity-1") @Permissions("pwa.pwaEntity1.read")
  async listPwaEntity1(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity1(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-1" }) @Get("pwa-entity-1/:id") @Permissions("pwa.pwaEntity1.read")
  async getPwaEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-1" }) @Post("pwa-entity-1") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity1.create")
  async createPwaEntity1(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity1(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-1" }) @Put("pwa-entity-1/:id") @Permissions("pwa.pwaEntity1.update")
  async updatePwaEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity1(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-1" }) @Delete("pwa-entity-1/:id") @Permissions("pwa.pwaEntity1.delete")
  async deletePwaEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-2" }) @Get("pwa-entity-2") @Permissions("pwa.pwaEntity2.read")
  async listPwaEntity2(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity2(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-2" }) @Get("pwa-entity-2/:id") @Permissions("pwa.pwaEntity2.read")
  async getPwaEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-2" }) @Post("pwa-entity-2") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity2.create")
  async createPwaEntity2(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity2(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-2" }) @Put("pwa-entity-2/:id") @Permissions("pwa.pwaEntity2.update")
  async updatePwaEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity2(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-2" }) @Delete("pwa-entity-2/:id") @Permissions("pwa.pwaEntity2.delete")
  async deletePwaEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-3" }) @Get("pwa-entity-3") @Permissions("pwa.pwaEntity3.read")
  async listPwaEntity3(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity3(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-3" }) @Get("pwa-entity-3/:id") @Permissions("pwa.pwaEntity3.read")
  async getPwaEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-3" }) @Post("pwa-entity-3") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity3.create")
  async createPwaEntity3(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity3(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-3" }) @Put("pwa-entity-3/:id") @Permissions("pwa.pwaEntity3.update")
  async updatePwaEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity3(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-3" }) @Delete("pwa-entity-3/:id") @Permissions("pwa.pwaEntity3.delete")
  async deletePwaEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-4" }) @Get("pwa-entity-4") @Permissions("pwa.pwaEntity4.read")
  async listPwaEntity4(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity4(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-4" }) @Get("pwa-entity-4/:id") @Permissions("pwa.pwaEntity4.read")
  async getPwaEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-4" }) @Post("pwa-entity-4") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity4.create")
  async createPwaEntity4(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity4(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-4" }) @Put("pwa-entity-4/:id") @Permissions("pwa.pwaEntity4.update")
  async updatePwaEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity4(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-4" }) @Delete("pwa-entity-4/:id") @Permissions("pwa.pwaEntity4.delete")
  async deletePwaEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-5" }) @Get("pwa-entity-5") @Permissions("pwa.pwaEntity5.read")
  async listPwaEntity5(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity5(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-5" }) @Get("pwa-entity-5/:id") @Permissions("pwa.pwaEntity5.read")
  async getPwaEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-5" }) @Post("pwa-entity-5") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity5.create")
  async createPwaEntity5(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity5(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-5" }) @Put("pwa-entity-5/:id") @Permissions("pwa.pwaEntity5.update")
  async updatePwaEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity5(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-5" }) @Delete("pwa-entity-5/:id") @Permissions("pwa.pwaEntity5.delete")
  async deletePwaEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-6" }) @Get("pwa-entity-6") @Permissions("pwa.pwaEntity6.read")
  async listPwaEntity6(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity6(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-6" }) @Get("pwa-entity-6/:id") @Permissions("pwa.pwaEntity6.read")
  async getPwaEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-6" }) @Post("pwa-entity-6") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity6.create")
  async createPwaEntity6(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity6(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-6" }) @Put("pwa-entity-6/:id") @Permissions("pwa.pwaEntity6.update")
  async updatePwaEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity6(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-6" }) @Delete("pwa-entity-6/:id") @Permissions("pwa.pwaEntity6.delete")
  async deletePwaEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-7" }) @Get("pwa-entity-7") @Permissions("pwa.pwaEntity7.read")
  async listPwaEntity7(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity7(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-7" }) @Get("pwa-entity-7/:id") @Permissions("pwa.pwaEntity7.read")
  async getPwaEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-7" }) @Post("pwa-entity-7") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity7.create")
  async createPwaEntity7(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity7(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-7" }) @Put("pwa-entity-7/:id") @Permissions("pwa.pwaEntity7.update")
  async updatePwaEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity7(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-7" }) @Delete("pwa-entity-7/:id") @Permissions("pwa.pwaEntity7.delete")
  async deletePwaEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-8" }) @Get("pwa-entity-8") @Permissions("pwa.pwaEntity8.read")
  async listPwaEntity8(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity8(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-8" }) @Get("pwa-entity-8/:id") @Permissions("pwa.pwaEntity8.read")
  async getPwaEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-8" }) @Post("pwa-entity-8") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity8.create")
  async createPwaEntity8(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity8(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-8" }) @Put("pwa-entity-8/:id") @Permissions("pwa.pwaEntity8.update")
  async updatePwaEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity8(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-8" }) @Delete("pwa-entity-8/:id") @Permissions("pwa.pwaEntity8.delete")
  async deletePwaEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-9" }) @Get("pwa-entity-9") @Permissions("pwa.pwaEntity9.read")
  async listPwaEntity9(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity9(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-9" }) @Get("pwa-entity-9/:id") @Permissions("pwa.pwaEntity9.read")
  async getPwaEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-9" }) @Post("pwa-entity-9") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity9.create")
  async createPwaEntity9(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity9(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-9" }) @Put("pwa-entity-9/:id") @Permissions("pwa.pwaEntity9.update")
  async updatePwaEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity9(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-9" }) @Delete("pwa-entity-9/:id") @Permissions("pwa.pwaEntity9.delete")
  async deletePwaEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-10" }) @Get("pwa-entity-10") @Permissions("pwa.pwaEntity10.read")
  async listPwaEntity10(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity10(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-10" }) @Get("pwa-entity-10/:id") @Permissions("pwa.pwaEntity10.read")
  async getPwaEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-10" }) @Post("pwa-entity-10") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity10.create")
  async createPwaEntity10(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity10(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-10" }) @Put("pwa-entity-10/:id") @Permissions("pwa.pwaEntity10.update")
  async updatePwaEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity10(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-10" }) @Delete("pwa-entity-10/:id") @Permissions("pwa.pwaEntity10.delete")
  async deletePwaEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-11" }) @Get("pwa-entity-11") @Permissions("pwa.pwaEntity11.read")
  async listPwaEntity11(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity11(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-11" }) @Get("pwa-entity-11/:id") @Permissions("pwa.pwaEntity11.read")
  async getPwaEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-11" }) @Post("pwa-entity-11") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity11.create")
  async createPwaEntity11(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity11(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-11" }) @Put("pwa-entity-11/:id") @Permissions("pwa.pwaEntity11.update")
  async updatePwaEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity11(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-11" }) @Delete("pwa-entity-11/:id") @Permissions("pwa.pwaEntity11.delete")
  async deletePwaEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-12" }) @Get("pwa-entity-12") @Permissions("pwa.pwaEntity12.read")
  async listPwaEntity12(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity12(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-12" }) @Get("pwa-entity-12/:id") @Permissions("pwa.pwaEntity12.read")
  async getPwaEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-12" }) @Post("pwa-entity-12") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity12.create")
  async createPwaEntity12(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity12(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-12" }) @Put("pwa-entity-12/:id") @Permissions("pwa.pwaEntity12.update")
  async updatePwaEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity12(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-12" }) @Delete("pwa-entity-12/:id") @Permissions("pwa.pwaEntity12.delete")
  async deletePwaEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-13" }) @Get("pwa-entity-13") @Permissions("pwa.pwaEntity13.read")
  async listPwaEntity13(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity13(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-13" }) @Get("pwa-entity-13/:id") @Permissions("pwa.pwaEntity13.read")
  async getPwaEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-13" }) @Post("pwa-entity-13") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity13.create")
  async createPwaEntity13(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity13(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-13" }) @Put("pwa-entity-13/:id") @Permissions("pwa.pwaEntity13.update")
  async updatePwaEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity13(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-13" }) @Delete("pwa-entity-13/:id") @Permissions("pwa.pwaEntity13.delete")
  async deletePwaEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-14" }) @Get("pwa-entity-14") @Permissions("pwa.pwaEntity14.read")
  async listPwaEntity14(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity14(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-14" }) @Get("pwa-entity-14/:id") @Permissions("pwa.pwaEntity14.read")
  async getPwaEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-14" }) @Post("pwa-entity-14") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity14.create")
  async createPwaEntity14(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity14(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-14" }) @Put("pwa-entity-14/:id") @Permissions("pwa.pwaEntity14.update")
  async updatePwaEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity14(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-14" }) @Delete("pwa-entity-14/:id") @Permissions("pwa.pwaEntity14.delete")
  async deletePwaEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-15" }) @Get("pwa-entity-15") @Permissions("pwa.pwaEntity15.read")
  async listPwaEntity15(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity15(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-15" }) @Get("pwa-entity-15/:id") @Permissions("pwa.pwaEntity15.read")
  async getPwaEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-15" }) @Post("pwa-entity-15") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity15.create")
  async createPwaEntity15(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity15(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-15" }) @Put("pwa-entity-15/:id") @Permissions("pwa.pwaEntity15.update")
  async updatePwaEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity15(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-15" }) @Delete("pwa-entity-15/:id") @Permissions("pwa.pwaEntity15.delete")
  async deletePwaEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-16" }) @Get("pwa-entity-16") @Permissions("pwa.pwaEntity16.read")
  async listPwaEntity16(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity16(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-16" }) @Get("pwa-entity-16/:id") @Permissions("pwa.pwaEntity16.read")
  async getPwaEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-16" }) @Post("pwa-entity-16") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity16.create")
  async createPwaEntity16(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity16(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-16" }) @Put("pwa-entity-16/:id") @Permissions("pwa.pwaEntity16.update")
  async updatePwaEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity16(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-16" }) @Delete("pwa-entity-16/:id") @Permissions("pwa.pwaEntity16.delete")
  async deletePwaEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-17" }) @Get("pwa-entity-17") @Permissions("pwa.pwaEntity17.read")
  async listPwaEntity17(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity17(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-17" }) @Get("pwa-entity-17/:id") @Permissions("pwa.pwaEntity17.read")
  async getPwaEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-17" }) @Post("pwa-entity-17") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity17.create")
  async createPwaEntity17(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity17(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-17" }) @Put("pwa-entity-17/:id") @Permissions("pwa.pwaEntity17.update")
  async updatePwaEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity17(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-17" }) @Delete("pwa-entity-17/:id") @Permissions("pwa.pwaEntity17.delete")
  async deletePwaEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-18" }) @Get("pwa-entity-18") @Permissions("pwa.pwaEntity18.read")
  async listPwaEntity18(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity18(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-18" }) @Get("pwa-entity-18/:id") @Permissions("pwa.pwaEntity18.read")
  async getPwaEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-18" }) @Post("pwa-entity-18") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity18.create")
  async createPwaEntity18(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity18(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-18" }) @Put("pwa-entity-18/:id") @Permissions("pwa.pwaEntity18.update")
  async updatePwaEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity18(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-18" }) @Delete("pwa-entity-18/:id") @Permissions("pwa.pwaEntity18.delete")
  async deletePwaEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-19" }) @Get("pwa-entity-19") @Permissions("pwa.pwaEntity19.read")
  async listPwaEntity19(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity19(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-19" }) @Get("pwa-entity-19/:id") @Permissions("pwa.pwaEntity19.read")
  async getPwaEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-19" }) @Post("pwa-entity-19") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity19.create")
  async createPwaEntity19(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity19(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-19" }) @Put("pwa-entity-19/:id") @Permissions("pwa.pwaEntity19.update")
  async updatePwaEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity19(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-19" }) @Delete("pwa-entity-19/:id") @Permissions("pwa.pwaEntity19.delete")
  async deletePwaEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-20" }) @Get("pwa-entity-20") @Permissions("pwa.pwaEntity20.read")
  async listPwaEntity20(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity20(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-20" }) @Get("pwa-entity-20/:id") @Permissions("pwa.pwaEntity20.read")
  async getPwaEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-20" }) @Post("pwa-entity-20") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity20.create")
  async createPwaEntity20(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity20(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-20" }) @Put("pwa-entity-20/:id") @Permissions("pwa.pwaEntity20.update")
  async updatePwaEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity20(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-20" }) @Delete("pwa-entity-20/:id") @Permissions("pwa.pwaEntity20.delete")
  async deletePwaEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-21" }) @Get("pwa-entity-21") @Permissions("pwa.pwaEntity21.read")
  async listPwaEntity21(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity21(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-21" }) @Get("pwa-entity-21/:id") @Permissions("pwa.pwaEntity21.read")
  async getPwaEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-21" }) @Post("pwa-entity-21") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity21.create")
  async createPwaEntity21(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity21(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-21" }) @Put("pwa-entity-21/:id") @Permissions("pwa.pwaEntity21.update")
  async updatePwaEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity21(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-21" }) @Delete("pwa-entity-21/:id") @Permissions("pwa.pwaEntity21.delete")
  async deletePwaEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-22" }) @Get("pwa-entity-22") @Permissions("pwa.pwaEntity22.read")
  async listPwaEntity22(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity22(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-22" }) @Get("pwa-entity-22/:id") @Permissions("pwa.pwaEntity22.read")
  async getPwaEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-22" }) @Post("pwa-entity-22") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity22.create")
  async createPwaEntity22(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity22(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-22" }) @Put("pwa-entity-22/:id") @Permissions("pwa.pwaEntity22.update")
  async updatePwaEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity22(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-22" }) @Delete("pwa-entity-22/:id") @Permissions("pwa.pwaEntity22.delete")
  async deletePwaEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-23" }) @Get("pwa-entity-23") @Permissions("pwa.pwaEntity23.read")
  async listPwaEntity23(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity23(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-23" }) @Get("pwa-entity-23/:id") @Permissions("pwa.pwaEntity23.read")
  async getPwaEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-23" }) @Post("pwa-entity-23") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity23.create")
  async createPwaEntity23(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity23(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-23" }) @Put("pwa-entity-23/:id") @Permissions("pwa.pwaEntity23.update")
  async updatePwaEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity23(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-23" }) @Delete("pwa-entity-23/:id") @Permissions("pwa.pwaEntity23.delete")
  async deletePwaEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-24" }) @Get("pwa-entity-24") @Permissions("pwa.pwaEntity24.read")
  async listPwaEntity24(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity24(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-24" }) @Get("pwa-entity-24/:id") @Permissions("pwa.pwaEntity24.read")
  async getPwaEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-24" }) @Post("pwa-entity-24") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity24.create")
  async createPwaEntity24(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity24(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-24" }) @Put("pwa-entity-24/:id") @Permissions("pwa.pwaEntity24.update")
  async updatePwaEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity24(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-24" }) @Delete("pwa-entity-24/:id") @Permissions("pwa.pwaEntity24.delete")
  async deletePwaEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-25" }) @Get("pwa-entity-25") @Permissions("pwa.pwaEntity25.read")
  async listPwaEntity25(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity25(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-25" }) @Get("pwa-entity-25/:id") @Permissions("pwa.pwaEntity25.read")
  async getPwaEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-25" }) @Post("pwa-entity-25") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity25.create")
  async createPwaEntity25(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity25(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-25" }) @Put("pwa-entity-25/:id") @Permissions("pwa.pwaEntity25.update")
  async updatePwaEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity25(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-25" }) @Delete("pwa-entity-25/:id") @Permissions("pwa.pwaEntity25.delete")
  async deletePwaEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-26" }) @Get("pwa-entity-26") @Permissions("pwa.pwaEntity26.read")
  async listPwaEntity26(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity26(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-26" }) @Get("pwa-entity-26/:id") @Permissions("pwa.pwaEntity26.read")
  async getPwaEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-26" }) @Post("pwa-entity-26") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity26.create")
  async createPwaEntity26(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity26(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-26" }) @Put("pwa-entity-26/:id") @Permissions("pwa.pwaEntity26.update")
  async updatePwaEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity26(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-26" }) @Delete("pwa-entity-26/:id") @Permissions("pwa.pwaEntity26.delete")
  async deletePwaEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-27" }) @Get("pwa-entity-27") @Permissions("pwa.pwaEntity27.read")
  async listPwaEntity27(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity27(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-27" }) @Get("pwa-entity-27/:id") @Permissions("pwa.pwaEntity27.read")
  async getPwaEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-27" }) @Post("pwa-entity-27") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity27.create")
  async createPwaEntity27(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity27(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-27" }) @Put("pwa-entity-27/:id") @Permissions("pwa.pwaEntity27.update")
  async updatePwaEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity27(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-27" }) @Delete("pwa-entity-27/:id") @Permissions("pwa.pwaEntity27.delete")
  async deletePwaEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-28" }) @Get("pwa-entity-28") @Permissions("pwa.pwaEntity28.read")
  async listPwaEntity28(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity28(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-28" }) @Get("pwa-entity-28/:id") @Permissions("pwa.pwaEntity28.read")
  async getPwaEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-28" }) @Post("pwa-entity-28") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity28.create")
  async createPwaEntity28(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity28(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-28" }) @Put("pwa-entity-28/:id") @Permissions("pwa.pwaEntity28.update")
  async updatePwaEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity28(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-28" }) @Delete("pwa-entity-28/:id") @Permissions("pwa.pwaEntity28.delete")
  async deletePwaEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-29" }) @Get("pwa-entity-29") @Permissions("pwa.pwaEntity29.read")
  async listPwaEntity29(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity29(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-29" }) @Get("pwa-entity-29/:id") @Permissions("pwa.pwaEntity29.read")
  async getPwaEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-29" }) @Post("pwa-entity-29") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity29.create")
  async createPwaEntity29(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity29(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-29" }) @Put("pwa-entity-29/:id") @Permissions("pwa.pwaEntity29.update")
  async updatePwaEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity29(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-29" }) @Delete("pwa-entity-29/:id") @Permissions("pwa.pwaEntity29.delete")
  async deletePwaEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-30" }) @Get("pwa-entity-30") @Permissions("pwa.pwaEntity30.read")
  async listPwaEntity30(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity30(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-30" }) @Get("pwa-entity-30/:id") @Permissions("pwa.pwaEntity30.read")
  async getPwaEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-30" }) @Post("pwa-entity-30") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity30.create")
  async createPwaEntity30(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity30(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-30" }) @Put("pwa-entity-30/:id") @Permissions("pwa.pwaEntity30.update")
  async updatePwaEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity30(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-30" }) @Delete("pwa-entity-30/:id") @Permissions("pwa.pwaEntity30.delete")
  async deletePwaEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-31" }) @Get("pwa-entity-31") @Permissions("pwa.pwaEntity31.read")
  async listPwaEntity31(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity31(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-31" }) @Get("pwa-entity-31/:id") @Permissions("pwa.pwaEntity31.read")
  async getPwaEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-31" }) @Post("pwa-entity-31") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity31.create")
  async createPwaEntity31(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity31(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-31" }) @Put("pwa-entity-31/:id") @Permissions("pwa.pwaEntity31.update")
  async updatePwaEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity31(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-31" }) @Delete("pwa-entity-31/:id") @Permissions("pwa.pwaEntity31.delete")
  async deletePwaEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-32" }) @Get("pwa-entity-32") @Permissions("pwa.pwaEntity32.read")
  async listPwaEntity32(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity32(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-32" }) @Get("pwa-entity-32/:id") @Permissions("pwa.pwaEntity32.read")
  async getPwaEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-32" }) @Post("pwa-entity-32") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity32.create")
  async createPwaEntity32(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity32(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-32" }) @Put("pwa-entity-32/:id") @Permissions("pwa.pwaEntity32.update")
  async updatePwaEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity32(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-32" }) @Delete("pwa-entity-32/:id") @Permissions("pwa.pwaEntity32.delete")
  async deletePwaEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-33" }) @Get("pwa-entity-33") @Permissions("pwa.pwaEntity33.read")
  async listPwaEntity33(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity33(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-33" }) @Get("pwa-entity-33/:id") @Permissions("pwa.pwaEntity33.read")
  async getPwaEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-33" }) @Post("pwa-entity-33") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity33.create")
  async createPwaEntity33(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity33(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-33" }) @Put("pwa-entity-33/:id") @Permissions("pwa.pwaEntity33.update")
  async updatePwaEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity33(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-33" }) @Delete("pwa-entity-33/:id") @Permissions("pwa.pwaEntity33.delete")
  async deletePwaEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-34" }) @Get("pwa-entity-34") @Permissions("pwa.pwaEntity34.read")
  async listPwaEntity34(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity34(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-34" }) @Get("pwa-entity-34/:id") @Permissions("pwa.pwaEntity34.read")
  async getPwaEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-34" }) @Post("pwa-entity-34") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity34.create")
  async createPwaEntity34(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity34(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-34" }) @Put("pwa-entity-34/:id") @Permissions("pwa.pwaEntity34.update")
  async updatePwaEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity34(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-34" }) @Delete("pwa-entity-34/:id") @Permissions("pwa.pwaEntity34.delete")
  async deletePwaEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-35" }) @Get("pwa-entity-35") @Permissions("pwa.pwaEntity35.read")
  async listPwaEntity35(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity35(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-35" }) @Get("pwa-entity-35/:id") @Permissions("pwa.pwaEntity35.read")
  async getPwaEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-35" }) @Post("pwa-entity-35") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity35.create")
  async createPwaEntity35(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity35(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-35" }) @Put("pwa-entity-35/:id") @Permissions("pwa.pwaEntity35.update")
  async updatePwaEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity35(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-35" }) @Delete("pwa-entity-35/:id") @Permissions("pwa.pwaEntity35.delete")
  async deletePwaEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-36" }) @Get("pwa-entity-36") @Permissions("pwa.pwaEntity36.read")
  async listPwaEntity36(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity36(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-36" }) @Get("pwa-entity-36/:id") @Permissions("pwa.pwaEntity36.read")
  async getPwaEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-36" }) @Post("pwa-entity-36") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity36.create")
  async createPwaEntity36(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity36(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-36" }) @Put("pwa-entity-36/:id") @Permissions("pwa.pwaEntity36.update")
  async updatePwaEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity36(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-36" }) @Delete("pwa-entity-36/:id") @Permissions("pwa.pwaEntity36.delete")
  async deletePwaEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-37" }) @Get("pwa-entity-37") @Permissions("pwa.pwaEntity37.read")
  async listPwaEntity37(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity37(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-37" }) @Get("pwa-entity-37/:id") @Permissions("pwa.pwaEntity37.read")
  async getPwaEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-37" }) @Post("pwa-entity-37") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity37.create")
  async createPwaEntity37(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity37(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-37" }) @Put("pwa-entity-37/:id") @Permissions("pwa.pwaEntity37.update")
  async updatePwaEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity37(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-37" }) @Delete("pwa-entity-37/:id") @Permissions("pwa.pwaEntity37.delete")
  async deletePwaEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-38" }) @Get("pwa-entity-38") @Permissions("pwa.pwaEntity38.read")
  async listPwaEntity38(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity38(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-38" }) @Get("pwa-entity-38/:id") @Permissions("pwa.pwaEntity38.read")
  async getPwaEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-38" }) @Post("pwa-entity-38") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity38.create")
  async createPwaEntity38(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity38(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-38" }) @Put("pwa-entity-38/:id") @Permissions("pwa.pwaEntity38.update")
  async updatePwaEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity38(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-38" }) @Delete("pwa-entity-38/:id") @Permissions("pwa.pwaEntity38.delete")
  async deletePwaEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-39" }) @Get("pwa-entity-39") @Permissions("pwa.pwaEntity39.read")
  async listPwaEntity39(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity39(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-39" }) @Get("pwa-entity-39/:id") @Permissions("pwa.pwaEntity39.read")
  async getPwaEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-39" }) @Post("pwa-entity-39") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity39.create")
  async createPwaEntity39(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity39(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-39" }) @Put("pwa-entity-39/:id") @Permissions("pwa.pwaEntity39.update")
  async updatePwaEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity39(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-39" }) @Delete("pwa-entity-39/:id") @Permissions("pwa.pwaEntity39.delete")
  async deletePwaEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "List pwa-entity-40" }) @Get("pwa-entity-40") @Permissions("pwa.pwaEntity40.read")
  async listPwaEntity40(@Req() req: AuthenticatedRequest) { return this.svc.listPwaEntity40(req.user.tenantId); }

  @ApiOperation({ summary: "Get pwa-entity-40" }) @Get("pwa-entity-40/:id") @Permissions("pwa.pwaEntity40.read")
  async getPwaEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getPwaEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create pwa-entity-40" }) @Post("pwa-entity-40") @HttpCode(HttpStatus.CREATED) @Permissions("pwa.pwaEntity40.create")
  async createPwaEntity40(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createPwaEntity40(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update pwa-entity-40" }) @Put("pwa-entity-40/:id") @Permissions("pwa.pwaEntity40.update")
  async updatePwaEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updatePwaEntity40(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete pwa-entity-40" }) @Delete("pwa-entity-40/:id") @Permissions("pwa.pwaEntity40.delete")
  async deletePwaEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deletePwaEntity40(req.user.tenantId, id); }

}
