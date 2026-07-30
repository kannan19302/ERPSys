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
import { SubscriptionsGeneratedService } from "./subscriptions-generated.service";

interface AuthenticatedRequest extends Request { user: { userId: string; tenantId: string; email: string; roles: string[] }; }

@ApiTags("subscriptions")
@ApiBearerAuth()
@Controller("subscriptions")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SubscriptionsGeneratedController {
  constructor(private readonly svc: SubscriptionsGeneratedService) {}

  @ApiOperation({ summary: "List subscriptions-entity-1" }) @Get("subscriptions-entity-1") @Permissions("subscriptions.subscriptionsEntity1.read")
  async listSubscriptionsEntity1(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity1(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-1" }) @Get("subscriptions-entity-1/:id") @Permissions("subscriptions.subscriptionsEntity1.read")
  async getSubscriptionsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-1" }) @Post("subscriptions-entity-1") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity1.create")
  async createSubscriptionsEntity1(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity1(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-1" }) @Put("subscriptions-entity-1/:id") @Permissions("subscriptions.subscriptionsEntity1.update")
  async updateSubscriptionsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity1(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-1" }) @Delete("subscriptions-entity-1/:id") @Permissions("subscriptions.subscriptionsEntity1.delete")
  async deleteSubscriptionsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-2" }) @Get("subscriptions-entity-2") @Permissions("subscriptions.subscriptionsEntity2.read")
  async listSubscriptionsEntity2(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity2(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-2" }) @Get("subscriptions-entity-2/:id") @Permissions("subscriptions.subscriptionsEntity2.read")
  async getSubscriptionsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-2" }) @Post("subscriptions-entity-2") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity2.create")
  async createSubscriptionsEntity2(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity2(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-2" }) @Put("subscriptions-entity-2/:id") @Permissions("subscriptions.subscriptionsEntity2.update")
  async updateSubscriptionsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity2(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-2" }) @Delete("subscriptions-entity-2/:id") @Permissions("subscriptions.subscriptionsEntity2.delete")
  async deleteSubscriptionsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-3" }) @Get("subscriptions-entity-3") @Permissions("subscriptions.subscriptionsEntity3.read")
  async listSubscriptionsEntity3(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity3(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-3" }) @Get("subscriptions-entity-3/:id") @Permissions("subscriptions.subscriptionsEntity3.read")
  async getSubscriptionsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-3" }) @Post("subscriptions-entity-3") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity3.create")
  async createSubscriptionsEntity3(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity3(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-3" }) @Put("subscriptions-entity-3/:id") @Permissions("subscriptions.subscriptionsEntity3.update")
  async updateSubscriptionsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity3(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-3" }) @Delete("subscriptions-entity-3/:id") @Permissions("subscriptions.subscriptionsEntity3.delete")
  async deleteSubscriptionsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-4" }) @Get("subscriptions-entity-4") @Permissions("subscriptions.subscriptionsEntity4.read")
  async listSubscriptionsEntity4(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity4(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-4" }) @Get("subscriptions-entity-4/:id") @Permissions("subscriptions.subscriptionsEntity4.read")
  async getSubscriptionsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-4" }) @Post("subscriptions-entity-4") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity4.create")
  async createSubscriptionsEntity4(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity4(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-4" }) @Put("subscriptions-entity-4/:id") @Permissions("subscriptions.subscriptionsEntity4.update")
  async updateSubscriptionsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity4(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-4" }) @Delete("subscriptions-entity-4/:id") @Permissions("subscriptions.subscriptionsEntity4.delete")
  async deleteSubscriptionsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-5" }) @Get("subscriptions-entity-5") @Permissions("subscriptions.subscriptionsEntity5.read")
  async listSubscriptionsEntity5(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity5(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-5" }) @Get("subscriptions-entity-5/:id") @Permissions("subscriptions.subscriptionsEntity5.read")
  async getSubscriptionsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-5" }) @Post("subscriptions-entity-5") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity5.create")
  async createSubscriptionsEntity5(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity5(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-5" }) @Put("subscriptions-entity-5/:id") @Permissions("subscriptions.subscriptionsEntity5.update")
  async updateSubscriptionsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity5(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-5" }) @Delete("subscriptions-entity-5/:id") @Permissions("subscriptions.subscriptionsEntity5.delete")
  async deleteSubscriptionsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-6" }) @Get("subscriptions-entity-6") @Permissions("subscriptions.subscriptionsEntity6.read")
  async listSubscriptionsEntity6(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity6(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-6" }) @Get("subscriptions-entity-6/:id") @Permissions("subscriptions.subscriptionsEntity6.read")
  async getSubscriptionsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-6" }) @Post("subscriptions-entity-6") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity6.create")
  async createSubscriptionsEntity6(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity6(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-6" }) @Put("subscriptions-entity-6/:id") @Permissions("subscriptions.subscriptionsEntity6.update")
  async updateSubscriptionsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity6(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-6" }) @Delete("subscriptions-entity-6/:id") @Permissions("subscriptions.subscriptionsEntity6.delete")
  async deleteSubscriptionsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-7" }) @Get("subscriptions-entity-7") @Permissions("subscriptions.subscriptionsEntity7.read")
  async listSubscriptionsEntity7(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity7(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-7" }) @Get("subscriptions-entity-7/:id") @Permissions("subscriptions.subscriptionsEntity7.read")
  async getSubscriptionsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-7" }) @Post("subscriptions-entity-7") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity7.create")
  async createSubscriptionsEntity7(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity7(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-7" }) @Put("subscriptions-entity-7/:id") @Permissions("subscriptions.subscriptionsEntity7.update")
  async updateSubscriptionsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity7(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-7" }) @Delete("subscriptions-entity-7/:id") @Permissions("subscriptions.subscriptionsEntity7.delete")
  async deleteSubscriptionsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-8" }) @Get("subscriptions-entity-8") @Permissions("subscriptions.subscriptionsEntity8.read")
  async listSubscriptionsEntity8(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity8(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-8" }) @Get("subscriptions-entity-8/:id") @Permissions("subscriptions.subscriptionsEntity8.read")
  async getSubscriptionsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-8" }) @Post("subscriptions-entity-8") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity8.create")
  async createSubscriptionsEntity8(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity8(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-8" }) @Put("subscriptions-entity-8/:id") @Permissions("subscriptions.subscriptionsEntity8.update")
  async updateSubscriptionsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity8(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-8" }) @Delete("subscriptions-entity-8/:id") @Permissions("subscriptions.subscriptionsEntity8.delete")
  async deleteSubscriptionsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-9" }) @Get("subscriptions-entity-9") @Permissions("subscriptions.subscriptionsEntity9.read")
  async listSubscriptionsEntity9(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity9(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-9" }) @Get("subscriptions-entity-9/:id") @Permissions("subscriptions.subscriptionsEntity9.read")
  async getSubscriptionsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-9" }) @Post("subscriptions-entity-9") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity9.create")
  async createSubscriptionsEntity9(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity9(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-9" }) @Put("subscriptions-entity-9/:id") @Permissions("subscriptions.subscriptionsEntity9.update")
  async updateSubscriptionsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity9(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-9" }) @Delete("subscriptions-entity-9/:id") @Permissions("subscriptions.subscriptionsEntity9.delete")
  async deleteSubscriptionsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-10" }) @Get("subscriptions-entity-10") @Permissions("subscriptions.subscriptionsEntity10.read")
  async listSubscriptionsEntity10(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity10(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-10" }) @Get("subscriptions-entity-10/:id") @Permissions("subscriptions.subscriptionsEntity10.read")
  async getSubscriptionsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-10" }) @Post("subscriptions-entity-10") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity10.create")
  async createSubscriptionsEntity10(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity10(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-10" }) @Put("subscriptions-entity-10/:id") @Permissions("subscriptions.subscriptionsEntity10.update")
  async updateSubscriptionsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity10(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-10" }) @Delete("subscriptions-entity-10/:id") @Permissions("subscriptions.subscriptionsEntity10.delete")
  async deleteSubscriptionsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-11" }) @Get("subscriptions-entity-11") @Permissions("subscriptions.subscriptionsEntity11.read")
  async listSubscriptionsEntity11(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity11(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-11" }) @Get("subscriptions-entity-11/:id") @Permissions("subscriptions.subscriptionsEntity11.read")
  async getSubscriptionsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-11" }) @Post("subscriptions-entity-11") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity11.create")
  async createSubscriptionsEntity11(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity11(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-11" }) @Put("subscriptions-entity-11/:id") @Permissions("subscriptions.subscriptionsEntity11.update")
  async updateSubscriptionsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity11(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-11" }) @Delete("subscriptions-entity-11/:id") @Permissions("subscriptions.subscriptionsEntity11.delete")
  async deleteSubscriptionsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-12" }) @Get("subscriptions-entity-12") @Permissions("subscriptions.subscriptionsEntity12.read")
  async listSubscriptionsEntity12(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity12(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-12" }) @Get("subscriptions-entity-12/:id") @Permissions("subscriptions.subscriptionsEntity12.read")
  async getSubscriptionsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-12" }) @Post("subscriptions-entity-12") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity12.create")
  async createSubscriptionsEntity12(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity12(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-12" }) @Put("subscriptions-entity-12/:id") @Permissions("subscriptions.subscriptionsEntity12.update")
  async updateSubscriptionsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity12(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-12" }) @Delete("subscriptions-entity-12/:id") @Permissions("subscriptions.subscriptionsEntity12.delete")
  async deleteSubscriptionsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-13" }) @Get("subscriptions-entity-13") @Permissions("subscriptions.subscriptionsEntity13.read")
  async listSubscriptionsEntity13(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity13(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-13" }) @Get("subscriptions-entity-13/:id") @Permissions("subscriptions.subscriptionsEntity13.read")
  async getSubscriptionsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-13" }) @Post("subscriptions-entity-13") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity13.create")
  async createSubscriptionsEntity13(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity13(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-13" }) @Put("subscriptions-entity-13/:id") @Permissions("subscriptions.subscriptionsEntity13.update")
  async updateSubscriptionsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity13(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-13" }) @Delete("subscriptions-entity-13/:id") @Permissions("subscriptions.subscriptionsEntity13.delete")
  async deleteSubscriptionsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-14" }) @Get("subscriptions-entity-14") @Permissions("subscriptions.subscriptionsEntity14.read")
  async listSubscriptionsEntity14(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity14(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-14" }) @Get("subscriptions-entity-14/:id") @Permissions("subscriptions.subscriptionsEntity14.read")
  async getSubscriptionsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-14" }) @Post("subscriptions-entity-14") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity14.create")
  async createSubscriptionsEntity14(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity14(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-14" }) @Put("subscriptions-entity-14/:id") @Permissions("subscriptions.subscriptionsEntity14.update")
  async updateSubscriptionsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity14(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-14" }) @Delete("subscriptions-entity-14/:id") @Permissions("subscriptions.subscriptionsEntity14.delete")
  async deleteSubscriptionsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-15" }) @Get("subscriptions-entity-15") @Permissions("subscriptions.subscriptionsEntity15.read")
  async listSubscriptionsEntity15(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity15(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-15" }) @Get("subscriptions-entity-15/:id") @Permissions("subscriptions.subscriptionsEntity15.read")
  async getSubscriptionsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-15" }) @Post("subscriptions-entity-15") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity15.create")
  async createSubscriptionsEntity15(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity15(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-15" }) @Put("subscriptions-entity-15/:id") @Permissions("subscriptions.subscriptionsEntity15.update")
  async updateSubscriptionsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity15(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-15" }) @Delete("subscriptions-entity-15/:id") @Permissions("subscriptions.subscriptionsEntity15.delete")
  async deleteSubscriptionsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-16" }) @Get("subscriptions-entity-16") @Permissions("subscriptions.subscriptionsEntity16.read")
  async listSubscriptionsEntity16(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity16(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-16" }) @Get("subscriptions-entity-16/:id") @Permissions("subscriptions.subscriptionsEntity16.read")
  async getSubscriptionsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-16" }) @Post("subscriptions-entity-16") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity16.create")
  async createSubscriptionsEntity16(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity16(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-16" }) @Put("subscriptions-entity-16/:id") @Permissions("subscriptions.subscriptionsEntity16.update")
  async updateSubscriptionsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity16(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-16" }) @Delete("subscriptions-entity-16/:id") @Permissions("subscriptions.subscriptionsEntity16.delete")
  async deleteSubscriptionsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-17" }) @Get("subscriptions-entity-17") @Permissions("subscriptions.subscriptionsEntity17.read")
  async listSubscriptionsEntity17(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity17(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-17" }) @Get("subscriptions-entity-17/:id") @Permissions("subscriptions.subscriptionsEntity17.read")
  async getSubscriptionsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-17" }) @Post("subscriptions-entity-17") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity17.create")
  async createSubscriptionsEntity17(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity17(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-17" }) @Put("subscriptions-entity-17/:id") @Permissions("subscriptions.subscriptionsEntity17.update")
  async updateSubscriptionsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity17(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-17" }) @Delete("subscriptions-entity-17/:id") @Permissions("subscriptions.subscriptionsEntity17.delete")
  async deleteSubscriptionsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-18" }) @Get("subscriptions-entity-18") @Permissions("subscriptions.subscriptionsEntity18.read")
  async listSubscriptionsEntity18(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity18(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-18" }) @Get("subscriptions-entity-18/:id") @Permissions("subscriptions.subscriptionsEntity18.read")
  async getSubscriptionsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-18" }) @Post("subscriptions-entity-18") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity18.create")
  async createSubscriptionsEntity18(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity18(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-18" }) @Put("subscriptions-entity-18/:id") @Permissions("subscriptions.subscriptionsEntity18.update")
  async updateSubscriptionsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity18(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-18" }) @Delete("subscriptions-entity-18/:id") @Permissions("subscriptions.subscriptionsEntity18.delete")
  async deleteSubscriptionsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-19" }) @Get("subscriptions-entity-19") @Permissions("subscriptions.subscriptionsEntity19.read")
  async listSubscriptionsEntity19(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity19(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-19" }) @Get("subscriptions-entity-19/:id") @Permissions("subscriptions.subscriptionsEntity19.read")
  async getSubscriptionsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-19" }) @Post("subscriptions-entity-19") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity19.create")
  async createSubscriptionsEntity19(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity19(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-19" }) @Put("subscriptions-entity-19/:id") @Permissions("subscriptions.subscriptionsEntity19.update")
  async updateSubscriptionsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity19(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-19" }) @Delete("subscriptions-entity-19/:id") @Permissions("subscriptions.subscriptionsEntity19.delete")
  async deleteSubscriptionsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-20" }) @Get("subscriptions-entity-20") @Permissions("subscriptions.subscriptionsEntity20.read")
  async listSubscriptionsEntity20(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity20(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-20" }) @Get("subscriptions-entity-20/:id") @Permissions("subscriptions.subscriptionsEntity20.read")
  async getSubscriptionsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-20" }) @Post("subscriptions-entity-20") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity20.create")
  async createSubscriptionsEntity20(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity20(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-20" }) @Put("subscriptions-entity-20/:id") @Permissions("subscriptions.subscriptionsEntity20.update")
  async updateSubscriptionsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity20(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-20" }) @Delete("subscriptions-entity-20/:id") @Permissions("subscriptions.subscriptionsEntity20.delete")
  async deleteSubscriptionsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-21" }) @Get("subscriptions-entity-21") @Permissions("subscriptions.subscriptionsEntity21.read")
  async listSubscriptionsEntity21(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity21(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-21" }) @Get("subscriptions-entity-21/:id") @Permissions("subscriptions.subscriptionsEntity21.read")
  async getSubscriptionsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-21" }) @Post("subscriptions-entity-21") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity21.create")
  async createSubscriptionsEntity21(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity21(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-21" }) @Put("subscriptions-entity-21/:id") @Permissions("subscriptions.subscriptionsEntity21.update")
  async updateSubscriptionsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity21(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-21" }) @Delete("subscriptions-entity-21/:id") @Permissions("subscriptions.subscriptionsEntity21.delete")
  async deleteSubscriptionsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-22" }) @Get("subscriptions-entity-22") @Permissions("subscriptions.subscriptionsEntity22.read")
  async listSubscriptionsEntity22(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity22(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-22" }) @Get("subscriptions-entity-22/:id") @Permissions("subscriptions.subscriptionsEntity22.read")
  async getSubscriptionsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-22" }) @Post("subscriptions-entity-22") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity22.create")
  async createSubscriptionsEntity22(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity22(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-22" }) @Put("subscriptions-entity-22/:id") @Permissions("subscriptions.subscriptionsEntity22.update")
  async updateSubscriptionsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity22(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-22" }) @Delete("subscriptions-entity-22/:id") @Permissions("subscriptions.subscriptionsEntity22.delete")
  async deleteSubscriptionsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-23" }) @Get("subscriptions-entity-23") @Permissions("subscriptions.subscriptionsEntity23.read")
  async listSubscriptionsEntity23(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity23(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-23" }) @Get("subscriptions-entity-23/:id") @Permissions("subscriptions.subscriptionsEntity23.read")
  async getSubscriptionsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-23" }) @Post("subscriptions-entity-23") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity23.create")
  async createSubscriptionsEntity23(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity23(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-23" }) @Put("subscriptions-entity-23/:id") @Permissions("subscriptions.subscriptionsEntity23.update")
  async updateSubscriptionsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity23(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-23" }) @Delete("subscriptions-entity-23/:id") @Permissions("subscriptions.subscriptionsEntity23.delete")
  async deleteSubscriptionsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-24" }) @Get("subscriptions-entity-24") @Permissions("subscriptions.subscriptionsEntity24.read")
  async listSubscriptionsEntity24(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity24(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-24" }) @Get("subscriptions-entity-24/:id") @Permissions("subscriptions.subscriptionsEntity24.read")
  async getSubscriptionsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-24" }) @Post("subscriptions-entity-24") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity24.create")
  async createSubscriptionsEntity24(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity24(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-24" }) @Put("subscriptions-entity-24/:id") @Permissions("subscriptions.subscriptionsEntity24.update")
  async updateSubscriptionsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity24(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-24" }) @Delete("subscriptions-entity-24/:id") @Permissions("subscriptions.subscriptionsEntity24.delete")
  async deleteSubscriptionsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-25" }) @Get("subscriptions-entity-25") @Permissions("subscriptions.subscriptionsEntity25.read")
  async listSubscriptionsEntity25(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity25(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-25" }) @Get("subscriptions-entity-25/:id") @Permissions("subscriptions.subscriptionsEntity25.read")
  async getSubscriptionsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-25" }) @Post("subscriptions-entity-25") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity25.create")
  async createSubscriptionsEntity25(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity25(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-25" }) @Put("subscriptions-entity-25/:id") @Permissions("subscriptions.subscriptionsEntity25.update")
  async updateSubscriptionsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity25(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-25" }) @Delete("subscriptions-entity-25/:id") @Permissions("subscriptions.subscriptionsEntity25.delete")
  async deleteSubscriptionsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-26" }) @Get("subscriptions-entity-26") @Permissions("subscriptions.subscriptionsEntity26.read")
  async listSubscriptionsEntity26(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity26(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-26" }) @Get("subscriptions-entity-26/:id") @Permissions("subscriptions.subscriptionsEntity26.read")
  async getSubscriptionsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-26" }) @Post("subscriptions-entity-26") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity26.create")
  async createSubscriptionsEntity26(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity26(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-26" }) @Put("subscriptions-entity-26/:id") @Permissions("subscriptions.subscriptionsEntity26.update")
  async updateSubscriptionsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity26(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-26" }) @Delete("subscriptions-entity-26/:id") @Permissions("subscriptions.subscriptionsEntity26.delete")
  async deleteSubscriptionsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-27" }) @Get("subscriptions-entity-27") @Permissions("subscriptions.subscriptionsEntity27.read")
  async listSubscriptionsEntity27(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity27(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-27" }) @Get("subscriptions-entity-27/:id") @Permissions("subscriptions.subscriptionsEntity27.read")
  async getSubscriptionsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-27" }) @Post("subscriptions-entity-27") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity27.create")
  async createSubscriptionsEntity27(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity27(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-27" }) @Put("subscriptions-entity-27/:id") @Permissions("subscriptions.subscriptionsEntity27.update")
  async updateSubscriptionsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity27(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-27" }) @Delete("subscriptions-entity-27/:id") @Permissions("subscriptions.subscriptionsEntity27.delete")
  async deleteSubscriptionsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-28" }) @Get("subscriptions-entity-28") @Permissions("subscriptions.subscriptionsEntity28.read")
  async listSubscriptionsEntity28(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity28(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-28" }) @Get("subscriptions-entity-28/:id") @Permissions("subscriptions.subscriptionsEntity28.read")
  async getSubscriptionsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-28" }) @Post("subscriptions-entity-28") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity28.create")
  async createSubscriptionsEntity28(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity28(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-28" }) @Put("subscriptions-entity-28/:id") @Permissions("subscriptions.subscriptionsEntity28.update")
  async updateSubscriptionsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity28(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-28" }) @Delete("subscriptions-entity-28/:id") @Permissions("subscriptions.subscriptionsEntity28.delete")
  async deleteSubscriptionsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-29" }) @Get("subscriptions-entity-29") @Permissions("subscriptions.subscriptionsEntity29.read")
  async listSubscriptionsEntity29(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity29(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-29" }) @Get("subscriptions-entity-29/:id") @Permissions("subscriptions.subscriptionsEntity29.read")
  async getSubscriptionsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-29" }) @Post("subscriptions-entity-29") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity29.create")
  async createSubscriptionsEntity29(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity29(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-29" }) @Put("subscriptions-entity-29/:id") @Permissions("subscriptions.subscriptionsEntity29.update")
  async updateSubscriptionsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity29(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-29" }) @Delete("subscriptions-entity-29/:id") @Permissions("subscriptions.subscriptionsEntity29.delete")
  async deleteSubscriptionsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-30" }) @Get("subscriptions-entity-30") @Permissions("subscriptions.subscriptionsEntity30.read")
  async listSubscriptionsEntity30(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity30(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-30" }) @Get("subscriptions-entity-30/:id") @Permissions("subscriptions.subscriptionsEntity30.read")
  async getSubscriptionsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-30" }) @Post("subscriptions-entity-30") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity30.create")
  async createSubscriptionsEntity30(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity30(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-30" }) @Put("subscriptions-entity-30/:id") @Permissions("subscriptions.subscriptionsEntity30.update")
  async updateSubscriptionsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity30(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-30" }) @Delete("subscriptions-entity-30/:id") @Permissions("subscriptions.subscriptionsEntity30.delete")
  async deleteSubscriptionsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-31" }) @Get("subscriptions-entity-31") @Permissions("subscriptions.subscriptionsEntity31.read")
  async listSubscriptionsEntity31(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity31(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-31" }) @Get("subscriptions-entity-31/:id") @Permissions("subscriptions.subscriptionsEntity31.read")
  async getSubscriptionsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-31" }) @Post("subscriptions-entity-31") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity31.create")
  async createSubscriptionsEntity31(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity31(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-31" }) @Put("subscriptions-entity-31/:id") @Permissions("subscriptions.subscriptionsEntity31.update")
  async updateSubscriptionsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity31(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-31" }) @Delete("subscriptions-entity-31/:id") @Permissions("subscriptions.subscriptionsEntity31.delete")
  async deleteSubscriptionsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-32" }) @Get("subscriptions-entity-32") @Permissions("subscriptions.subscriptionsEntity32.read")
  async listSubscriptionsEntity32(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity32(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-32" }) @Get("subscriptions-entity-32/:id") @Permissions("subscriptions.subscriptionsEntity32.read")
  async getSubscriptionsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-32" }) @Post("subscriptions-entity-32") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity32.create")
  async createSubscriptionsEntity32(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity32(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-32" }) @Put("subscriptions-entity-32/:id") @Permissions("subscriptions.subscriptionsEntity32.update")
  async updateSubscriptionsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity32(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-32" }) @Delete("subscriptions-entity-32/:id") @Permissions("subscriptions.subscriptionsEntity32.delete")
  async deleteSubscriptionsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-33" }) @Get("subscriptions-entity-33") @Permissions("subscriptions.subscriptionsEntity33.read")
  async listSubscriptionsEntity33(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity33(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-33" }) @Get("subscriptions-entity-33/:id") @Permissions("subscriptions.subscriptionsEntity33.read")
  async getSubscriptionsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-33" }) @Post("subscriptions-entity-33") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity33.create")
  async createSubscriptionsEntity33(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity33(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-33" }) @Put("subscriptions-entity-33/:id") @Permissions("subscriptions.subscriptionsEntity33.update")
  async updateSubscriptionsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity33(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-33" }) @Delete("subscriptions-entity-33/:id") @Permissions("subscriptions.subscriptionsEntity33.delete")
  async deleteSubscriptionsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-34" }) @Get("subscriptions-entity-34") @Permissions("subscriptions.subscriptionsEntity34.read")
  async listSubscriptionsEntity34(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity34(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-34" }) @Get("subscriptions-entity-34/:id") @Permissions("subscriptions.subscriptionsEntity34.read")
  async getSubscriptionsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-34" }) @Post("subscriptions-entity-34") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity34.create")
  async createSubscriptionsEntity34(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity34(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-34" }) @Put("subscriptions-entity-34/:id") @Permissions("subscriptions.subscriptionsEntity34.update")
  async updateSubscriptionsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity34(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-34" }) @Delete("subscriptions-entity-34/:id") @Permissions("subscriptions.subscriptionsEntity34.delete")
  async deleteSubscriptionsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-35" }) @Get("subscriptions-entity-35") @Permissions("subscriptions.subscriptionsEntity35.read")
  async listSubscriptionsEntity35(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity35(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-35" }) @Get("subscriptions-entity-35/:id") @Permissions("subscriptions.subscriptionsEntity35.read")
  async getSubscriptionsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-35" }) @Post("subscriptions-entity-35") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity35.create")
  async createSubscriptionsEntity35(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity35(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-35" }) @Put("subscriptions-entity-35/:id") @Permissions("subscriptions.subscriptionsEntity35.update")
  async updateSubscriptionsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity35(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-35" }) @Delete("subscriptions-entity-35/:id") @Permissions("subscriptions.subscriptionsEntity35.delete")
  async deleteSubscriptionsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-36" }) @Get("subscriptions-entity-36") @Permissions("subscriptions.subscriptionsEntity36.read")
  async listSubscriptionsEntity36(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity36(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-36" }) @Get("subscriptions-entity-36/:id") @Permissions("subscriptions.subscriptionsEntity36.read")
  async getSubscriptionsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-36" }) @Post("subscriptions-entity-36") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity36.create")
  async createSubscriptionsEntity36(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity36(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-36" }) @Put("subscriptions-entity-36/:id") @Permissions("subscriptions.subscriptionsEntity36.update")
  async updateSubscriptionsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity36(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-36" }) @Delete("subscriptions-entity-36/:id") @Permissions("subscriptions.subscriptionsEntity36.delete")
  async deleteSubscriptionsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-37" }) @Get("subscriptions-entity-37") @Permissions("subscriptions.subscriptionsEntity37.read")
  async listSubscriptionsEntity37(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity37(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-37" }) @Get("subscriptions-entity-37/:id") @Permissions("subscriptions.subscriptionsEntity37.read")
  async getSubscriptionsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-37" }) @Post("subscriptions-entity-37") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity37.create")
  async createSubscriptionsEntity37(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity37(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-37" }) @Put("subscriptions-entity-37/:id") @Permissions("subscriptions.subscriptionsEntity37.update")
  async updateSubscriptionsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity37(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-37" }) @Delete("subscriptions-entity-37/:id") @Permissions("subscriptions.subscriptionsEntity37.delete")
  async deleteSubscriptionsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-38" }) @Get("subscriptions-entity-38") @Permissions("subscriptions.subscriptionsEntity38.read")
  async listSubscriptionsEntity38(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity38(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-38" }) @Get("subscriptions-entity-38/:id") @Permissions("subscriptions.subscriptionsEntity38.read")
  async getSubscriptionsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-38" }) @Post("subscriptions-entity-38") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity38.create")
  async createSubscriptionsEntity38(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity38(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-38" }) @Put("subscriptions-entity-38/:id") @Permissions("subscriptions.subscriptionsEntity38.update")
  async updateSubscriptionsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity38(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-38" }) @Delete("subscriptions-entity-38/:id") @Permissions("subscriptions.subscriptionsEntity38.delete")
  async deleteSubscriptionsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-39" }) @Get("subscriptions-entity-39") @Permissions("subscriptions.subscriptionsEntity39.read")
  async listSubscriptionsEntity39(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity39(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-39" }) @Get("subscriptions-entity-39/:id") @Permissions("subscriptions.subscriptionsEntity39.read")
  async getSubscriptionsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-39" }) @Post("subscriptions-entity-39") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity39.create")
  async createSubscriptionsEntity39(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity39(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-39" }) @Put("subscriptions-entity-39/:id") @Permissions("subscriptions.subscriptionsEntity39.update")
  async updateSubscriptionsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity39(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-39" }) @Delete("subscriptions-entity-39/:id") @Permissions("subscriptions.subscriptionsEntity39.delete")
  async deleteSubscriptionsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "List subscriptions-entity-40" }) @Get("subscriptions-entity-40") @Permissions("subscriptions.subscriptionsEntity40.read")
  async listSubscriptionsEntity40(@Req() req: AuthenticatedRequest) { return this.svc.listSubscriptionsEntity40(req.user.tenantId); }

  @ApiOperation({ summary: "Get subscriptions-entity-40" }) @Get("subscriptions-entity-40/:id") @Permissions("subscriptions.subscriptionsEntity40.read")
  async getSubscriptionsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSubscriptionsEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create subscriptions-entity-40" }) @Post("subscriptions-entity-40") @HttpCode(HttpStatus.CREATED) @Permissions("subscriptions.subscriptionsEntity40.create")
  async createSubscriptionsEntity40(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSubscriptionsEntity40(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update subscriptions-entity-40" }) @Put("subscriptions-entity-40/:id") @Permissions("subscriptions.subscriptionsEntity40.update")
  async updateSubscriptionsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSubscriptionsEntity40(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete subscriptions-entity-40" }) @Delete("subscriptions-entity-40/:id") @Permissions("subscriptions.subscriptionsEntity40.delete")
  async deleteSubscriptionsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSubscriptionsEntity40(req.user.tenantId, id); }

}
