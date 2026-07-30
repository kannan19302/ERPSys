import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, HttpCode, HttpStatus, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { NotificationsGeneratedService } from "./notifications-generated.service";

interface AuthenticatedRequest extends Request { user: { userId: string; tenantId: string; email: string; roles: string[] }; }

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class NotificationsGeneratedController {
  constructor(private readonly svc: NotificationsGeneratedService) {}

  @ApiOperation({ summary: "List notifications-entity-1" }) @Get("notifications-entity-1") @Permissions("notifications.notificationsEntity1.read")
  async listNotificationsEntity1(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity1(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-1" }) @Get("notifications-entity-1/:id") @Permissions("notifications.notificationsEntity1.read")
  async getNotificationsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-1" }) @Post("notifications-entity-1") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity1.create")
  async createNotificationsEntity1(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity1(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-1" }) @Put("notifications-entity-1/:id") @Permissions("notifications.notificationsEntity1.update")
  async updateNotificationsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity1(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-1" }) @Delete("notifications-entity-1/:id") @Permissions("notifications.notificationsEntity1.delete")
  async deleteNotificationsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-2" }) @Get("notifications-entity-2") @Permissions("notifications.notificationsEntity2.read")
  async listNotificationsEntity2(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity2(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-2" }) @Get("notifications-entity-2/:id") @Permissions("notifications.notificationsEntity2.read")
  async getNotificationsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-2" }) @Post("notifications-entity-2") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity2.create")
  async createNotificationsEntity2(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity2(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-2" }) @Put("notifications-entity-2/:id") @Permissions("notifications.notificationsEntity2.update")
  async updateNotificationsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity2(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-2" }) @Delete("notifications-entity-2/:id") @Permissions("notifications.notificationsEntity2.delete")
  async deleteNotificationsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-3" }) @Get("notifications-entity-3") @Permissions("notifications.notificationsEntity3.read")
  async listNotificationsEntity3(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity3(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-3" }) @Get("notifications-entity-3/:id") @Permissions("notifications.notificationsEntity3.read")
  async getNotificationsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-3" }) @Post("notifications-entity-3") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity3.create")
  async createNotificationsEntity3(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity3(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-3" }) @Put("notifications-entity-3/:id") @Permissions("notifications.notificationsEntity3.update")
  async updateNotificationsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity3(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-3" }) @Delete("notifications-entity-3/:id") @Permissions("notifications.notificationsEntity3.delete")
  async deleteNotificationsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-4" }) @Get("notifications-entity-4") @Permissions("notifications.notificationsEntity4.read")
  async listNotificationsEntity4(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity4(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-4" }) @Get("notifications-entity-4/:id") @Permissions("notifications.notificationsEntity4.read")
  async getNotificationsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-4" }) @Post("notifications-entity-4") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity4.create")
  async createNotificationsEntity4(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity4(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-4" }) @Put("notifications-entity-4/:id") @Permissions("notifications.notificationsEntity4.update")
  async updateNotificationsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity4(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-4" }) @Delete("notifications-entity-4/:id") @Permissions("notifications.notificationsEntity4.delete")
  async deleteNotificationsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-5" }) @Get("notifications-entity-5") @Permissions("notifications.notificationsEntity5.read")
  async listNotificationsEntity5(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity5(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-5" }) @Get("notifications-entity-5/:id") @Permissions("notifications.notificationsEntity5.read")
  async getNotificationsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-5" }) @Post("notifications-entity-5") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity5.create")
  async createNotificationsEntity5(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity5(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-5" }) @Put("notifications-entity-5/:id") @Permissions("notifications.notificationsEntity5.update")
  async updateNotificationsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity5(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-5" }) @Delete("notifications-entity-5/:id") @Permissions("notifications.notificationsEntity5.delete")
  async deleteNotificationsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-6" }) @Get("notifications-entity-6") @Permissions("notifications.notificationsEntity6.read")
  async listNotificationsEntity6(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity6(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-6" }) @Get("notifications-entity-6/:id") @Permissions("notifications.notificationsEntity6.read")
  async getNotificationsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-6" }) @Post("notifications-entity-6") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity6.create")
  async createNotificationsEntity6(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity6(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-6" }) @Put("notifications-entity-6/:id") @Permissions("notifications.notificationsEntity6.update")
  async updateNotificationsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity6(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-6" }) @Delete("notifications-entity-6/:id") @Permissions("notifications.notificationsEntity6.delete")
  async deleteNotificationsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-7" }) @Get("notifications-entity-7") @Permissions("notifications.notificationsEntity7.read")
  async listNotificationsEntity7(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity7(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-7" }) @Get("notifications-entity-7/:id") @Permissions("notifications.notificationsEntity7.read")
  async getNotificationsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-7" }) @Post("notifications-entity-7") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity7.create")
  async createNotificationsEntity7(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity7(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-7" }) @Put("notifications-entity-7/:id") @Permissions("notifications.notificationsEntity7.update")
  async updateNotificationsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity7(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-7" }) @Delete("notifications-entity-7/:id") @Permissions("notifications.notificationsEntity7.delete")
  async deleteNotificationsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-8" }) @Get("notifications-entity-8") @Permissions("notifications.notificationsEntity8.read")
  async listNotificationsEntity8(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity8(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-8" }) @Get("notifications-entity-8/:id") @Permissions("notifications.notificationsEntity8.read")
  async getNotificationsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-8" }) @Post("notifications-entity-8") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity8.create")
  async createNotificationsEntity8(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity8(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-8" }) @Put("notifications-entity-8/:id") @Permissions("notifications.notificationsEntity8.update")
  async updateNotificationsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity8(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-8" }) @Delete("notifications-entity-8/:id") @Permissions("notifications.notificationsEntity8.delete")
  async deleteNotificationsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-9" }) @Get("notifications-entity-9") @Permissions("notifications.notificationsEntity9.read")
  async listNotificationsEntity9(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity9(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-9" }) @Get("notifications-entity-9/:id") @Permissions("notifications.notificationsEntity9.read")
  async getNotificationsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-9" }) @Post("notifications-entity-9") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity9.create")
  async createNotificationsEntity9(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity9(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-9" }) @Put("notifications-entity-9/:id") @Permissions("notifications.notificationsEntity9.update")
  async updateNotificationsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity9(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-9" }) @Delete("notifications-entity-9/:id") @Permissions("notifications.notificationsEntity9.delete")
  async deleteNotificationsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-10" }) @Get("notifications-entity-10") @Permissions("notifications.notificationsEntity10.read")
  async listNotificationsEntity10(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity10(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-10" }) @Get("notifications-entity-10/:id") @Permissions("notifications.notificationsEntity10.read")
  async getNotificationsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-10" }) @Post("notifications-entity-10") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity10.create")
  async createNotificationsEntity10(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity10(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-10" }) @Put("notifications-entity-10/:id") @Permissions("notifications.notificationsEntity10.update")
  async updateNotificationsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity10(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-10" }) @Delete("notifications-entity-10/:id") @Permissions("notifications.notificationsEntity10.delete")
  async deleteNotificationsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-11" }) @Get("notifications-entity-11") @Permissions("notifications.notificationsEntity11.read")
  async listNotificationsEntity11(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity11(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-11" }) @Get("notifications-entity-11/:id") @Permissions("notifications.notificationsEntity11.read")
  async getNotificationsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-11" }) @Post("notifications-entity-11") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity11.create")
  async createNotificationsEntity11(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity11(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-11" }) @Put("notifications-entity-11/:id") @Permissions("notifications.notificationsEntity11.update")
  async updateNotificationsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity11(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-11" }) @Delete("notifications-entity-11/:id") @Permissions("notifications.notificationsEntity11.delete")
  async deleteNotificationsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-12" }) @Get("notifications-entity-12") @Permissions("notifications.notificationsEntity12.read")
  async listNotificationsEntity12(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity12(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-12" }) @Get("notifications-entity-12/:id") @Permissions("notifications.notificationsEntity12.read")
  async getNotificationsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-12" }) @Post("notifications-entity-12") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity12.create")
  async createNotificationsEntity12(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity12(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-12" }) @Put("notifications-entity-12/:id") @Permissions("notifications.notificationsEntity12.update")
  async updateNotificationsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity12(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-12" }) @Delete("notifications-entity-12/:id") @Permissions("notifications.notificationsEntity12.delete")
  async deleteNotificationsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-13" }) @Get("notifications-entity-13") @Permissions("notifications.notificationsEntity13.read")
  async listNotificationsEntity13(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity13(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-13" }) @Get("notifications-entity-13/:id") @Permissions("notifications.notificationsEntity13.read")
  async getNotificationsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-13" }) @Post("notifications-entity-13") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity13.create")
  async createNotificationsEntity13(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity13(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-13" }) @Put("notifications-entity-13/:id") @Permissions("notifications.notificationsEntity13.update")
  async updateNotificationsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity13(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-13" }) @Delete("notifications-entity-13/:id") @Permissions("notifications.notificationsEntity13.delete")
  async deleteNotificationsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-14" }) @Get("notifications-entity-14") @Permissions("notifications.notificationsEntity14.read")
  async listNotificationsEntity14(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity14(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-14" }) @Get("notifications-entity-14/:id") @Permissions("notifications.notificationsEntity14.read")
  async getNotificationsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-14" }) @Post("notifications-entity-14") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity14.create")
  async createNotificationsEntity14(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity14(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-14" }) @Put("notifications-entity-14/:id") @Permissions("notifications.notificationsEntity14.update")
  async updateNotificationsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity14(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-14" }) @Delete("notifications-entity-14/:id") @Permissions("notifications.notificationsEntity14.delete")
  async deleteNotificationsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-15" }) @Get("notifications-entity-15") @Permissions("notifications.notificationsEntity15.read")
  async listNotificationsEntity15(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity15(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-15" }) @Get("notifications-entity-15/:id") @Permissions("notifications.notificationsEntity15.read")
  async getNotificationsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-15" }) @Post("notifications-entity-15") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity15.create")
  async createNotificationsEntity15(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity15(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-15" }) @Put("notifications-entity-15/:id") @Permissions("notifications.notificationsEntity15.update")
  async updateNotificationsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity15(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-15" }) @Delete("notifications-entity-15/:id") @Permissions("notifications.notificationsEntity15.delete")
  async deleteNotificationsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-16" }) @Get("notifications-entity-16") @Permissions("notifications.notificationsEntity16.read")
  async listNotificationsEntity16(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity16(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-16" }) @Get("notifications-entity-16/:id") @Permissions("notifications.notificationsEntity16.read")
  async getNotificationsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-16" }) @Post("notifications-entity-16") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity16.create")
  async createNotificationsEntity16(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity16(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-16" }) @Put("notifications-entity-16/:id") @Permissions("notifications.notificationsEntity16.update")
  async updateNotificationsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity16(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-16" }) @Delete("notifications-entity-16/:id") @Permissions("notifications.notificationsEntity16.delete")
  async deleteNotificationsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-17" }) @Get("notifications-entity-17") @Permissions("notifications.notificationsEntity17.read")
  async listNotificationsEntity17(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity17(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-17" }) @Get("notifications-entity-17/:id") @Permissions("notifications.notificationsEntity17.read")
  async getNotificationsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-17" }) @Post("notifications-entity-17") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity17.create")
  async createNotificationsEntity17(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity17(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-17" }) @Put("notifications-entity-17/:id") @Permissions("notifications.notificationsEntity17.update")
  async updateNotificationsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity17(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-17" }) @Delete("notifications-entity-17/:id") @Permissions("notifications.notificationsEntity17.delete")
  async deleteNotificationsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-18" }) @Get("notifications-entity-18") @Permissions("notifications.notificationsEntity18.read")
  async listNotificationsEntity18(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity18(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-18" }) @Get("notifications-entity-18/:id") @Permissions("notifications.notificationsEntity18.read")
  async getNotificationsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-18" }) @Post("notifications-entity-18") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity18.create")
  async createNotificationsEntity18(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity18(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-18" }) @Put("notifications-entity-18/:id") @Permissions("notifications.notificationsEntity18.update")
  async updateNotificationsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity18(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-18" }) @Delete("notifications-entity-18/:id") @Permissions("notifications.notificationsEntity18.delete")
  async deleteNotificationsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-19" }) @Get("notifications-entity-19") @Permissions("notifications.notificationsEntity19.read")
  async listNotificationsEntity19(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity19(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-19" }) @Get("notifications-entity-19/:id") @Permissions("notifications.notificationsEntity19.read")
  async getNotificationsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-19" }) @Post("notifications-entity-19") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity19.create")
  async createNotificationsEntity19(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity19(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-19" }) @Put("notifications-entity-19/:id") @Permissions("notifications.notificationsEntity19.update")
  async updateNotificationsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity19(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-19" }) @Delete("notifications-entity-19/:id") @Permissions("notifications.notificationsEntity19.delete")
  async deleteNotificationsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-20" }) @Get("notifications-entity-20") @Permissions("notifications.notificationsEntity20.read")
  async listNotificationsEntity20(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity20(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-20" }) @Get("notifications-entity-20/:id") @Permissions("notifications.notificationsEntity20.read")
  async getNotificationsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-20" }) @Post("notifications-entity-20") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity20.create")
  async createNotificationsEntity20(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity20(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-20" }) @Put("notifications-entity-20/:id") @Permissions("notifications.notificationsEntity20.update")
  async updateNotificationsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity20(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-20" }) @Delete("notifications-entity-20/:id") @Permissions("notifications.notificationsEntity20.delete")
  async deleteNotificationsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-21" }) @Get("notifications-entity-21") @Permissions("notifications.notificationsEntity21.read")
  async listNotificationsEntity21(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity21(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-21" }) @Get("notifications-entity-21/:id") @Permissions("notifications.notificationsEntity21.read")
  async getNotificationsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-21" }) @Post("notifications-entity-21") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity21.create")
  async createNotificationsEntity21(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity21(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-21" }) @Put("notifications-entity-21/:id") @Permissions("notifications.notificationsEntity21.update")
  async updateNotificationsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity21(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-21" }) @Delete("notifications-entity-21/:id") @Permissions("notifications.notificationsEntity21.delete")
  async deleteNotificationsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-22" }) @Get("notifications-entity-22") @Permissions("notifications.notificationsEntity22.read")
  async listNotificationsEntity22(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity22(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-22" }) @Get("notifications-entity-22/:id") @Permissions("notifications.notificationsEntity22.read")
  async getNotificationsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-22" }) @Post("notifications-entity-22") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity22.create")
  async createNotificationsEntity22(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity22(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-22" }) @Put("notifications-entity-22/:id") @Permissions("notifications.notificationsEntity22.update")
  async updateNotificationsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity22(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-22" }) @Delete("notifications-entity-22/:id") @Permissions("notifications.notificationsEntity22.delete")
  async deleteNotificationsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-23" }) @Get("notifications-entity-23") @Permissions("notifications.notificationsEntity23.read")
  async listNotificationsEntity23(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity23(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-23" }) @Get("notifications-entity-23/:id") @Permissions("notifications.notificationsEntity23.read")
  async getNotificationsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-23" }) @Post("notifications-entity-23") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity23.create")
  async createNotificationsEntity23(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity23(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-23" }) @Put("notifications-entity-23/:id") @Permissions("notifications.notificationsEntity23.update")
  async updateNotificationsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity23(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-23" }) @Delete("notifications-entity-23/:id") @Permissions("notifications.notificationsEntity23.delete")
  async deleteNotificationsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-24" }) @Get("notifications-entity-24") @Permissions("notifications.notificationsEntity24.read")
  async listNotificationsEntity24(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity24(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-24" }) @Get("notifications-entity-24/:id") @Permissions("notifications.notificationsEntity24.read")
  async getNotificationsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-24" }) @Post("notifications-entity-24") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity24.create")
  async createNotificationsEntity24(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity24(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-24" }) @Put("notifications-entity-24/:id") @Permissions("notifications.notificationsEntity24.update")
  async updateNotificationsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity24(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-24" }) @Delete("notifications-entity-24/:id") @Permissions("notifications.notificationsEntity24.delete")
  async deleteNotificationsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-25" }) @Get("notifications-entity-25") @Permissions("notifications.notificationsEntity25.read")
  async listNotificationsEntity25(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity25(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-25" }) @Get("notifications-entity-25/:id") @Permissions("notifications.notificationsEntity25.read")
  async getNotificationsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-25" }) @Post("notifications-entity-25") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity25.create")
  async createNotificationsEntity25(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity25(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-25" }) @Put("notifications-entity-25/:id") @Permissions("notifications.notificationsEntity25.update")
  async updateNotificationsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity25(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-25" }) @Delete("notifications-entity-25/:id") @Permissions("notifications.notificationsEntity25.delete")
  async deleteNotificationsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-26" }) @Get("notifications-entity-26") @Permissions("notifications.notificationsEntity26.read")
  async listNotificationsEntity26(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity26(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-26" }) @Get("notifications-entity-26/:id") @Permissions("notifications.notificationsEntity26.read")
  async getNotificationsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-26" }) @Post("notifications-entity-26") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity26.create")
  async createNotificationsEntity26(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity26(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-26" }) @Put("notifications-entity-26/:id") @Permissions("notifications.notificationsEntity26.update")
  async updateNotificationsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity26(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-26" }) @Delete("notifications-entity-26/:id") @Permissions("notifications.notificationsEntity26.delete")
  async deleteNotificationsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-27" }) @Get("notifications-entity-27") @Permissions("notifications.notificationsEntity27.read")
  async listNotificationsEntity27(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity27(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-27" }) @Get("notifications-entity-27/:id") @Permissions("notifications.notificationsEntity27.read")
  async getNotificationsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-27" }) @Post("notifications-entity-27") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity27.create")
  async createNotificationsEntity27(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity27(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-27" }) @Put("notifications-entity-27/:id") @Permissions("notifications.notificationsEntity27.update")
  async updateNotificationsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity27(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-27" }) @Delete("notifications-entity-27/:id") @Permissions("notifications.notificationsEntity27.delete")
  async deleteNotificationsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-28" }) @Get("notifications-entity-28") @Permissions("notifications.notificationsEntity28.read")
  async listNotificationsEntity28(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity28(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-28" }) @Get("notifications-entity-28/:id") @Permissions("notifications.notificationsEntity28.read")
  async getNotificationsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-28" }) @Post("notifications-entity-28") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity28.create")
  async createNotificationsEntity28(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity28(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-28" }) @Put("notifications-entity-28/:id") @Permissions("notifications.notificationsEntity28.update")
  async updateNotificationsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity28(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-28" }) @Delete("notifications-entity-28/:id") @Permissions("notifications.notificationsEntity28.delete")
  async deleteNotificationsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-29" }) @Get("notifications-entity-29") @Permissions("notifications.notificationsEntity29.read")
  async listNotificationsEntity29(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity29(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-29" }) @Get("notifications-entity-29/:id") @Permissions("notifications.notificationsEntity29.read")
  async getNotificationsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-29" }) @Post("notifications-entity-29") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity29.create")
  async createNotificationsEntity29(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity29(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-29" }) @Put("notifications-entity-29/:id") @Permissions("notifications.notificationsEntity29.update")
  async updateNotificationsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity29(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-29" }) @Delete("notifications-entity-29/:id") @Permissions("notifications.notificationsEntity29.delete")
  async deleteNotificationsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-30" }) @Get("notifications-entity-30") @Permissions("notifications.notificationsEntity30.read")
  async listNotificationsEntity30(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity30(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-30" }) @Get("notifications-entity-30/:id") @Permissions("notifications.notificationsEntity30.read")
  async getNotificationsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-30" }) @Post("notifications-entity-30") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity30.create")
  async createNotificationsEntity30(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity30(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-30" }) @Put("notifications-entity-30/:id") @Permissions("notifications.notificationsEntity30.update")
  async updateNotificationsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity30(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-30" }) @Delete("notifications-entity-30/:id") @Permissions("notifications.notificationsEntity30.delete")
  async deleteNotificationsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-31" }) @Get("notifications-entity-31") @Permissions("notifications.notificationsEntity31.read")
  async listNotificationsEntity31(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity31(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-31" }) @Get("notifications-entity-31/:id") @Permissions("notifications.notificationsEntity31.read")
  async getNotificationsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-31" }) @Post("notifications-entity-31") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity31.create")
  async createNotificationsEntity31(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity31(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-31" }) @Put("notifications-entity-31/:id") @Permissions("notifications.notificationsEntity31.update")
  async updateNotificationsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity31(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-31" }) @Delete("notifications-entity-31/:id") @Permissions("notifications.notificationsEntity31.delete")
  async deleteNotificationsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-32" }) @Get("notifications-entity-32") @Permissions("notifications.notificationsEntity32.read")
  async listNotificationsEntity32(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity32(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-32" }) @Get("notifications-entity-32/:id") @Permissions("notifications.notificationsEntity32.read")
  async getNotificationsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-32" }) @Post("notifications-entity-32") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity32.create")
  async createNotificationsEntity32(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity32(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-32" }) @Put("notifications-entity-32/:id") @Permissions("notifications.notificationsEntity32.update")
  async updateNotificationsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity32(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-32" }) @Delete("notifications-entity-32/:id") @Permissions("notifications.notificationsEntity32.delete")
  async deleteNotificationsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-33" }) @Get("notifications-entity-33") @Permissions("notifications.notificationsEntity33.read")
  async listNotificationsEntity33(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity33(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-33" }) @Get("notifications-entity-33/:id") @Permissions("notifications.notificationsEntity33.read")
  async getNotificationsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-33" }) @Post("notifications-entity-33") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity33.create")
  async createNotificationsEntity33(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity33(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-33" }) @Put("notifications-entity-33/:id") @Permissions("notifications.notificationsEntity33.update")
  async updateNotificationsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity33(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-33" }) @Delete("notifications-entity-33/:id") @Permissions("notifications.notificationsEntity33.delete")
  async deleteNotificationsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-34" }) @Get("notifications-entity-34") @Permissions("notifications.notificationsEntity34.read")
  async listNotificationsEntity34(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity34(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-34" }) @Get("notifications-entity-34/:id") @Permissions("notifications.notificationsEntity34.read")
  async getNotificationsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-34" }) @Post("notifications-entity-34") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity34.create")
  async createNotificationsEntity34(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity34(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-34" }) @Put("notifications-entity-34/:id") @Permissions("notifications.notificationsEntity34.update")
  async updateNotificationsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity34(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-34" }) @Delete("notifications-entity-34/:id") @Permissions("notifications.notificationsEntity34.delete")
  async deleteNotificationsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-35" }) @Get("notifications-entity-35") @Permissions("notifications.notificationsEntity35.read")
  async listNotificationsEntity35(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity35(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-35" }) @Get("notifications-entity-35/:id") @Permissions("notifications.notificationsEntity35.read")
  async getNotificationsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-35" }) @Post("notifications-entity-35") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity35.create")
  async createNotificationsEntity35(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity35(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-35" }) @Put("notifications-entity-35/:id") @Permissions("notifications.notificationsEntity35.update")
  async updateNotificationsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity35(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-35" }) @Delete("notifications-entity-35/:id") @Permissions("notifications.notificationsEntity35.delete")
  async deleteNotificationsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-36" }) @Get("notifications-entity-36") @Permissions("notifications.notificationsEntity36.read")
  async listNotificationsEntity36(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity36(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-36" }) @Get("notifications-entity-36/:id") @Permissions("notifications.notificationsEntity36.read")
  async getNotificationsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-36" }) @Post("notifications-entity-36") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity36.create")
  async createNotificationsEntity36(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity36(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-36" }) @Put("notifications-entity-36/:id") @Permissions("notifications.notificationsEntity36.update")
  async updateNotificationsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity36(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-36" }) @Delete("notifications-entity-36/:id") @Permissions("notifications.notificationsEntity36.delete")
  async deleteNotificationsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-37" }) @Get("notifications-entity-37") @Permissions("notifications.notificationsEntity37.read")
  async listNotificationsEntity37(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity37(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-37" }) @Get("notifications-entity-37/:id") @Permissions("notifications.notificationsEntity37.read")
  async getNotificationsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-37" }) @Post("notifications-entity-37") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity37.create")
  async createNotificationsEntity37(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity37(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-37" }) @Put("notifications-entity-37/:id") @Permissions("notifications.notificationsEntity37.update")
  async updateNotificationsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity37(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-37" }) @Delete("notifications-entity-37/:id") @Permissions("notifications.notificationsEntity37.delete")
  async deleteNotificationsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-38" }) @Get("notifications-entity-38") @Permissions("notifications.notificationsEntity38.read")
  async listNotificationsEntity38(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity38(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-38" }) @Get("notifications-entity-38/:id") @Permissions("notifications.notificationsEntity38.read")
  async getNotificationsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-38" }) @Post("notifications-entity-38") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity38.create")
  async createNotificationsEntity38(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity38(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-38" }) @Put("notifications-entity-38/:id") @Permissions("notifications.notificationsEntity38.update")
  async updateNotificationsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity38(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-38" }) @Delete("notifications-entity-38/:id") @Permissions("notifications.notificationsEntity38.delete")
  async deleteNotificationsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-39" }) @Get("notifications-entity-39") @Permissions("notifications.notificationsEntity39.read")
  async listNotificationsEntity39(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity39(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-39" }) @Get("notifications-entity-39/:id") @Permissions("notifications.notificationsEntity39.read")
  async getNotificationsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-39" }) @Post("notifications-entity-39") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity39.create")
  async createNotificationsEntity39(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity39(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-39" }) @Put("notifications-entity-39/:id") @Permissions("notifications.notificationsEntity39.update")
  async updateNotificationsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity39(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-39" }) @Delete("notifications-entity-39/:id") @Permissions("notifications.notificationsEntity39.delete")
  async deleteNotificationsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-40" }) @Get("notifications-entity-40") @Permissions("notifications.notificationsEntity40.read")
  async listNotificationsEntity40(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity40(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-40" }) @Get("notifications-entity-40/:id") @Permissions("notifications.notificationsEntity40.read")
  async getNotificationsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-40" }) @Post("notifications-entity-40") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity40.create")
  async createNotificationsEntity40(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity40(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-40" }) @Put("notifications-entity-40/:id") @Permissions("notifications.notificationsEntity40.update")
  async updateNotificationsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity40(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-40" }) @Delete("notifications-entity-40/:id") @Permissions("notifications.notificationsEntity40.delete")
  async deleteNotificationsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-41" }) @Get("notifications-entity-41") @Permissions("notifications.notificationsEntity41.read")
  async listNotificationsEntity41(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity41(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-41" }) @Get("notifications-entity-41/:id") @Permissions("notifications.notificationsEntity41.read")
  async getNotificationsEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-41" }) @Post("notifications-entity-41") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity41.create")
  async createNotificationsEntity41(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity41(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-41" }) @Put("notifications-entity-41/:id") @Permissions("notifications.notificationsEntity41.update")
  async updateNotificationsEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity41(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-41" }) @Delete("notifications-entity-41/:id") @Permissions("notifications.notificationsEntity41.delete")
  async deleteNotificationsEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-42" }) @Get("notifications-entity-42") @Permissions("notifications.notificationsEntity42.read")
  async listNotificationsEntity42(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity42(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-42" }) @Get("notifications-entity-42/:id") @Permissions("notifications.notificationsEntity42.read")
  async getNotificationsEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-42" }) @Post("notifications-entity-42") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity42.create")
  async createNotificationsEntity42(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity42(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-42" }) @Put("notifications-entity-42/:id") @Permissions("notifications.notificationsEntity42.update")
  async updateNotificationsEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity42(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-42" }) @Delete("notifications-entity-42/:id") @Permissions("notifications.notificationsEntity42.delete")
  async deleteNotificationsEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-43" }) @Get("notifications-entity-43") @Permissions("notifications.notificationsEntity43.read")
  async listNotificationsEntity43(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity43(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-43" }) @Get("notifications-entity-43/:id") @Permissions("notifications.notificationsEntity43.read")
  async getNotificationsEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-43" }) @Post("notifications-entity-43") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity43.create")
  async createNotificationsEntity43(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity43(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-43" }) @Put("notifications-entity-43/:id") @Permissions("notifications.notificationsEntity43.update")
  async updateNotificationsEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity43(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-43" }) @Delete("notifications-entity-43/:id") @Permissions("notifications.notificationsEntity43.delete")
  async deleteNotificationsEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-44" }) @Get("notifications-entity-44") @Permissions("notifications.notificationsEntity44.read")
  async listNotificationsEntity44(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity44(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-44" }) @Get("notifications-entity-44/:id") @Permissions("notifications.notificationsEntity44.read")
  async getNotificationsEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-44" }) @Post("notifications-entity-44") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity44.create")
  async createNotificationsEntity44(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity44(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-44" }) @Put("notifications-entity-44/:id") @Permissions("notifications.notificationsEntity44.update")
  async updateNotificationsEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity44(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-44" }) @Delete("notifications-entity-44/:id") @Permissions("notifications.notificationsEntity44.delete")
  async deleteNotificationsEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "List notifications-entity-45" }) @Get("notifications-entity-45") @Permissions("notifications.notificationsEntity45.read")
  async listNotificationsEntity45(@Req() req: AuthenticatedRequest) { return this.svc.listNotificationsEntity45(req.user.tenantId); }

  @ApiOperation({ summary: "Get notifications-entity-45" }) @Get("notifications-entity-45/:id") @Permissions("notifications.notificationsEntity45.read")
  async getNotificationsEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getNotificationsEntity45(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create notifications-entity-45" }) @Post("notifications-entity-45") @HttpCode(HttpStatus.CREATED) @Permissions("notifications.notificationsEntity45.create")
  async createNotificationsEntity45(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createNotificationsEntity45(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update notifications-entity-45" }) @Put("notifications-entity-45/:id") @Permissions("notifications.notificationsEntity45.update")
  async updateNotificationsEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateNotificationsEntity45(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete notifications-entity-45" }) @Delete("notifications-entity-45/:id") @Permissions("notifications.notificationsEntity45.delete")
  async deleteNotificationsEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteNotificationsEntity45(req.user.tenantId, id); }

}
