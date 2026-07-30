// @ts-nocheck
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
import { NotificationsGeneratedService } from "./notifications-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class NotificationsGeneratedController {
  constructor(private readonly svc: NotificationsGeneratedService) {}

  @ApiOperation({ summary: "List notifications-entity-1" })
  @Get("notifications-entity-1")
  @Permissions("notifications.notificationsEntity1.read")
  async listNotificationsEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-1" })
  @Get("notifications-entity-1/:id")
  @Permissions("notifications.notificationsEntity1.read")
  async getNotificationsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-1" })
  @Post("notifications-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity1.create")
  async createNotificationsEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-1" })
  @Put("notifications-entity-1/:id")
  @Permissions("notifications.notificationsEntity1.update")
  async updateNotificationsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-1" })
  @Delete("notifications-entity-1/:id")
  @Permissions("notifications.notificationsEntity1.delete")
  async deleteNotificationsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-2" })
  @Get("notifications-entity-2")
  @Permissions("notifications.notificationsEntity2.read")
  async listNotificationsEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-2" })
  @Get("notifications-entity-2/:id")
  @Permissions("notifications.notificationsEntity2.read")
  async getNotificationsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-2" })
  @Post("notifications-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity2.create")
  async createNotificationsEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-2" })
  @Put("notifications-entity-2/:id")
  @Permissions("notifications.notificationsEntity2.update")
  async updateNotificationsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-2" })
  @Delete("notifications-entity-2/:id")
  @Permissions("notifications.notificationsEntity2.delete")
  async deleteNotificationsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-3" })
  @Get("notifications-entity-3")
  @Permissions("notifications.notificationsEntity3.read")
  async listNotificationsEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-3" })
  @Get("notifications-entity-3/:id")
  @Permissions("notifications.notificationsEntity3.read")
  async getNotificationsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-3" })
  @Post("notifications-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity3.create")
  async createNotificationsEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-3" })
  @Put("notifications-entity-3/:id")
  @Permissions("notifications.notificationsEntity3.update")
  async updateNotificationsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-3" })
  @Delete("notifications-entity-3/:id")
  @Permissions("notifications.notificationsEntity3.delete")
  async deleteNotificationsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-4" })
  @Get("notifications-entity-4")
  @Permissions("notifications.notificationsEntity4.read")
  async listNotificationsEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-4" })
  @Get("notifications-entity-4/:id")
  @Permissions("notifications.notificationsEntity4.read")
  async getNotificationsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-4" })
  @Post("notifications-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity4.create")
  async createNotificationsEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-4" })
  @Put("notifications-entity-4/:id")
  @Permissions("notifications.notificationsEntity4.update")
  async updateNotificationsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-4" })
  @Delete("notifications-entity-4/:id")
  @Permissions("notifications.notificationsEntity4.delete")
  async deleteNotificationsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-5" })
  @Get("notifications-entity-5")
  @Permissions("notifications.notificationsEntity5.read")
  async listNotificationsEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-5" })
  @Get("notifications-entity-5/:id")
  @Permissions("notifications.notificationsEntity5.read")
  async getNotificationsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-5" })
  @Post("notifications-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity5.create")
  async createNotificationsEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-5" })
  @Put("notifications-entity-5/:id")
  @Permissions("notifications.notificationsEntity5.update")
  async updateNotificationsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-5" })
  @Delete("notifications-entity-5/:id")
  @Permissions("notifications.notificationsEntity5.delete")
  async deleteNotificationsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-6" })
  @Get("notifications-entity-6")
  @Permissions("notifications.notificationsEntity6.read")
  async listNotificationsEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-6" })
  @Get("notifications-entity-6/:id")
  @Permissions("notifications.notificationsEntity6.read")
  async getNotificationsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-6" })
  @Post("notifications-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity6.create")
  async createNotificationsEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-6" })
  @Put("notifications-entity-6/:id")
  @Permissions("notifications.notificationsEntity6.update")
  async updateNotificationsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-6" })
  @Delete("notifications-entity-6/:id")
  @Permissions("notifications.notificationsEntity6.delete")
  async deleteNotificationsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-7" })
  @Get("notifications-entity-7")
  @Permissions("notifications.notificationsEntity7.read")
  async listNotificationsEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-7" })
  @Get("notifications-entity-7/:id")
  @Permissions("notifications.notificationsEntity7.read")
  async getNotificationsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-7" })
  @Post("notifications-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity7.create")
  async createNotificationsEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-7" })
  @Put("notifications-entity-7/:id")
  @Permissions("notifications.notificationsEntity7.update")
  async updateNotificationsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-7" })
  @Delete("notifications-entity-7/:id")
  @Permissions("notifications.notificationsEntity7.delete")
  async deleteNotificationsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-8" })
  @Get("notifications-entity-8")
  @Permissions("notifications.notificationsEntity8.read")
  async listNotificationsEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-8" })
  @Get("notifications-entity-8/:id")
  @Permissions("notifications.notificationsEntity8.read")
  async getNotificationsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-8" })
  @Post("notifications-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity8.create")
  async createNotificationsEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-8" })
  @Put("notifications-entity-8/:id")
  @Permissions("notifications.notificationsEntity8.update")
  async updateNotificationsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-8" })
  @Delete("notifications-entity-8/:id")
  @Permissions("notifications.notificationsEntity8.delete")
  async deleteNotificationsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-9" })
  @Get("notifications-entity-9")
  @Permissions("notifications.notificationsEntity9.read")
  async listNotificationsEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-9" })
  @Get("notifications-entity-9/:id")
  @Permissions("notifications.notificationsEntity9.read")
  async getNotificationsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-9" })
  @Post("notifications-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity9.create")
  async createNotificationsEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-9" })
  @Put("notifications-entity-9/:id")
  @Permissions("notifications.notificationsEntity9.update")
  async updateNotificationsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-9" })
  @Delete("notifications-entity-9/:id")
  @Permissions("notifications.notificationsEntity9.delete")
  async deleteNotificationsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-10" })
  @Get("notifications-entity-10")
  @Permissions("notifications.notificationsEntity10.read")
  async listNotificationsEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-10" })
  @Get("notifications-entity-10/:id")
  @Permissions("notifications.notificationsEntity10.read")
  async getNotificationsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-10" })
  @Post("notifications-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity10.create")
  async createNotificationsEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-10" })
  @Put("notifications-entity-10/:id")
  @Permissions("notifications.notificationsEntity10.update")
  async updateNotificationsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-10" })
  @Delete("notifications-entity-10/:id")
  @Permissions("notifications.notificationsEntity10.delete")
  async deleteNotificationsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-11" })
  @Get("notifications-entity-11")
  @Permissions("notifications.notificationsEntity11.read")
  async listNotificationsEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-11" })
  @Get("notifications-entity-11/:id")
  @Permissions("notifications.notificationsEntity11.read")
  async getNotificationsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-11" })
  @Post("notifications-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity11.create")
  async createNotificationsEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-11" })
  @Put("notifications-entity-11/:id")
  @Permissions("notifications.notificationsEntity11.update")
  async updateNotificationsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-11" })
  @Delete("notifications-entity-11/:id")
  @Permissions("notifications.notificationsEntity11.delete")
  async deleteNotificationsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-12" })
  @Get("notifications-entity-12")
  @Permissions("notifications.notificationsEntity12.read")
  async listNotificationsEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-12" })
  @Get("notifications-entity-12/:id")
  @Permissions("notifications.notificationsEntity12.read")
  async getNotificationsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-12" })
  @Post("notifications-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity12.create")
  async createNotificationsEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-12" })
  @Put("notifications-entity-12/:id")
  @Permissions("notifications.notificationsEntity12.update")
  async updateNotificationsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-12" })
  @Delete("notifications-entity-12/:id")
  @Permissions("notifications.notificationsEntity12.delete")
  async deleteNotificationsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-13" })
  @Get("notifications-entity-13")
  @Permissions("notifications.notificationsEntity13.read")
  async listNotificationsEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-13" })
  @Get("notifications-entity-13/:id")
  @Permissions("notifications.notificationsEntity13.read")
  async getNotificationsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-13" })
  @Post("notifications-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity13.create")
  async createNotificationsEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-13" })
  @Put("notifications-entity-13/:id")
  @Permissions("notifications.notificationsEntity13.update")
  async updateNotificationsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-13" })
  @Delete("notifications-entity-13/:id")
  @Permissions("notifications.notificationsEntity13.delete")
  async deleteNotificationsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-14" })
  @Get("notifications-entity-14")
  @Permissions("notifications.notificationsEntity14.read")
  async listNotificationsEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-14" })
  @Get("notifications-entity-14/:id")
  @Permissions("notifications.notificationsEntity14.read")
  async getNotificationsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-14" })
  @Post("notifications-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity14.create")
  async createNotificationsEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-14" })
  @Put("notifications-entity-14/:id")
  @Permissions("notifications.notificationsEntity14.update")
  async updateNotificationsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-14" })
  @Delete("notifications-entity-14/:id")
  @Permissions("notifications.notificationsEntity14.delete")
  async deleteNotificationsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-15" })
  @Get("notifications-entity-15")
  @Permissions("notifications.notificationsEntity15.read")
  async listNotificationsEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-15" })
  @Get("notifications-entity-15/:id")
  @Permissions("notifications.notificationsEntity15.read")
  async getNotificationsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-15" })
  @Post("notifications-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity15.create")
  async createNotificationsEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-15" })
  @Put("notifications-entity-15/:id")
  @Permissions("notifications.notificationsEntity15.update")
  async updateNotificationsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-15" })
  @Delete("notifications-entity-15/:id")
  @Permissions("notifications.notificationsEntity15.delete")
  async deleteNotificationsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-16" })
  @Get("notifications-entity-16")
  @Permissions("notifications.notificationsEntity16.read")
  async listNotificationsEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-16" })
  @Get("notifications-entity-16/:id")
  @Permissions("notifications.notificationsEntity16.read")
  async getNotificationsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-16" })
  @Post("notifications-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity16.create")
  async createNotificationsEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-16" })
  @Put("notifications-entity-16/:id")
  @Permissions("notifications.notificationsEntity16.update")
  async updateNotificationsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-16" })
  @Delete("notifications-entity-16/:id")
  @Permissions("notifications.notificationsEntity16.delete")
  async deleteNotificationsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-17" })
  @Get("notifications-entity-17")
  @Permissions("notifications.notificationsEntity17.read")
  async listNotificationsEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-17" })
  @Get("notifications-entity-17/:id")
  @Permissions("notifications.notificationsEntity17.read")
  async getNotificationsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-17" })
  @Post("notifications-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity17.create")
  async createNotificationsEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-17" })
  @Put("notifications-entity-17/:id")
  @Permissions("notifications.notificationsEntity17.update")
  async updateNotificationsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-17" })
  @Delete("notifications-entity-17/:id")
  @Permissions("notifications.notificationsEntity17.delete")
  async deleteNotificationsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-18" })
  @Get("notifications-entity-18")
  @Permissions("notifications.notificationsEntity18.read")
  async listNotificationsEntity18(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity18(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-18" })
  @Get("notifications-entity-18/:id")
  @Permissions("notifications.notificationsEntity18.read")
  async getNotificationsEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-18" })
  @Post("notifications-entity-18")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity18.create")
  async createNotificationsEntity18(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity18(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-18" })
  @Put("notifications-entity-18/:id")
  @Permissions("notifications.notificationsEntity18.update")
  async updateNotificationsEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity18(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-18" })
  @Delete("notifications-entity-18/:id")
  @Permissions("notifications.notificationsEntity18.delete")
  async deleteNotificationsEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-19" })
  @Get("notifications-entity-19")
  @Permissions("notifications.notificationsEntity19.read")
  async listNotificationsEntity19(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity19(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-19" })
  @Get("notifications-entity-19/:id")
  @Permissions("notifications.notificationsEntity19.read")
  async getNotificationsEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-19" })
  @Post("notifications-entity-19")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity19.create")
  async createNotificationsEntity19(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity19(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-19" })
  @Put("notifications-entity-19/:id")
  @Permissions("notifications.notificationsEntity19.update")
  async updateNotificationsEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity19(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-19" })
  @Delete("notifications-entity-19/:id")
  @Permissions("notifications.notificationsEntity19.delete")
  async deleteNotificationsEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-20" })
  @Get("notifications-entity-20")
  @Permissions("notifications.notificationsEntity20.read")
  async listNotificationsEntity20(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity20(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-20" })
  @Get("notifications-entity-20/:id")
  @Permissions("notifications.notificationsEntity20.read")
  async getNotificationsEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-20" })
  @Post("notifications-entity-20")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity20.create")
  async createNotificationsEntity20(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity20(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-20" })
  @Put("notifications-entity-20/:id")
  @Permissions("notifications.notificationsEntity20.update")
  async updateNotificationsEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity20(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-20" })
  @Delete("notifications-entity-20/:id")
  @Permissions("notifications.notificationsEntity20.delete")
  async deleteNotificationsEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List notifications-entity-21" })
  @Get("notifications-entity-21")
  @Permissions("notifications.notificationsEntity21.read")
  async listNotificationsEntity21(@Req() req: AuthenticatedRequest) {
    return this.svc.listNotificationsEntity21(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get notifications-entity-21" })
  @Get("notifications-entity-21/:id")
  @Permissions("notifications.notificationsEntity21.read")
  async getNotificationsEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getNotificationsEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create notifications-entity-21" })
  @Post("notifications-entity-21")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("notifications.notificationsEntity21.create")
  async createNotificationsEntity21(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createNotificationsEntity21(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update notifications-entity-21" })
  @Put("notifications-entity-21/:id")
  @Permissions("notifications.notificationsEntity21.update")
  async updateNotificationsEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateNotificationsEntity21(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete notifications-entity-21" })
  @Delete("notifications-entity-21/:id")
  @Permissions("notifications.notificationsEntity21.delete")
  async deleteNotificationsEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteNotificationsEntity21(req.user.tenantId, id);
  }
}
