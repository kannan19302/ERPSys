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
import { SubscriptionsGeneratedService } from "./subscriptions-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("subscriptions")
@ApiBearerAuth()
@Controller("subscriptions")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SubscriptionsGeneratedController {
  constructor(private readonly svc: SubscriptionsGeneratedService) {}

  @ApiOperation({ summary: "List subscriptions-entity-1" })
  @Get("subscriptions-entity-1")
  @Permissions("subscriptions.subscriptionsEntity1.read")
  async listSubscriptionsEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-1" })
  @Get("subscriptions-entity-1/:id")
  @Permissions("subscriptions.subscriptionsEntity1.read")
  async getSubscriptionsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-1" })
  @Post("subscriptions-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity1.create")
  async createSubscriptionsEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-1" })
  @Put("subscriptions-entity-1/:id")
  @Permissions("subscriptions.subscriptionsEntity1.update")
  async updateSubscriptionsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-1" })
  @Delete("subscriptions-entity-1/:id")
  @Permissions("subscriptions.subscriptionsEntity1.delete")
  async deleteSubscriptionsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-2" })
  @Get("subscriptions-entity-2")
  @Permissions("subscriptions.subscriptionsEntity2.read")
  async listSubscriptionsEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-2" })
  @Get("subscriptions-entity-2/:id")
  @Permissions("subscriptions.subscriptionsEntity2.read")
  async getSubscriptionsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-2" })
  @Post("subscriptions-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity2.create")
  async createSubscriptionsEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-2" })
  @Put("subscriptions-entity-2/:id")
  @Permissions("subscriptions.subscriptionsEntity2.update")
  async updateSubscriptionsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-2" })
  @Delete("subscriptions-entity-2/:id")
  @Permissions("subscriptions.subscriptionsEntity2.delete")
  async deleteSubscriptionsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-3" })
  @Get("subscriptions-entity-3")
  @Permissions("subscriptions.subscriptionsEntity3.read")
  async listSubscriptionsEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-3" })
  @Get("subscriptions-entity-3/:id")
  @Permissions("subscriptions.subscriptionsEntity3.read")
  async getSubscriptionsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-3" })
  @Post("subscriptions-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity3.create")
  async createSubscriptionsEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-3" })
  @Put("subscriptions-entity-3/:id")
  @Permissions("subscriptions.subscriptionsEntity3.update")
  async updateSubscriptionsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-3" })
  @Delete("subscriptions-entity-3/:id")
  @Permissions("subscriptions.subscriptionsEntity3.delete")
  async deleteSubscriptionsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-4" })
  @Get("subscriptions-entity-4")
  @Permissions("subscriptions.subscriptionsEntity4.read")
  async listSubscriptionsEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-4" })
  @Get("subscriptions-entity-4/:id")
  @Permissions("subscriptions.subscriptionsEntity4.read")
  async getSubscriptionsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-4" })
  @Post("subscriptions-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity4.create")
  async createSubscriptionsEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-4" })
  @Put("subscriptions-entity-4/:id")
  @Permissions("subscriptions.subscriptionsEntity4.update")
  async updateSubscriptionsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-4" })
  @Delete("subscriptions-entity-4/:id")
  @Permissions("subscriptions.subscriptionsEntity4.delete")
  async deleteSubscriptionsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-5" })
  @Get("subscriptions-entity-5")
  @Permissions("subscriptions.subscriptionsEntity5.read")
  async listSubscriptionsEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-5" })
  @Get("subscriptions-entity-5/:id")
  @Permissions("subscriptions.subscriptionsEntity5.read")
  async getSubscriptionsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-5" })
  @Post("subscriptions-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity5.create")
  async createSubscriptionsEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-5" })
  @Put("subscriptions-entity-5/:id")
  @Permissions("subscriptions.subscriptionsEntity5.update")
  async updateSubscriptionsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-5" })
  @Delete("subscriptions-entity-5/:id")
  @Permissions("subscriptions.subscriptionsEntity5.delete")
  async deleteSubscriptionsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-6" })
  @Get("subscriptions-entity-6")
  @Permissions("subscriptions.subscriptionsEntity6.read")
  async listSubscriptionsEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-6" })
  @Get("subscriptions-entity-6/:id")
  @Permissions("subscriptions.subscriptionsEntity6.read")
  async getSubscriptionsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-6" })
  @Post("subscriptions-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity6.create")
  async createSubscriptionsEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-6" })
  @Put("subscriptions-entity-6/:id")
  @Permissions("subscriptions.subscriptionsEntity6.update")
  async updateSubscriptionsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-6" })
  @Delete("subscriptions-entity-6/:id")
  @Permissions("subscriptions.subscriptionsEntity6.delete")
  async deleteSubscriptionsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-7" })
  @Get("subscriptions-entity-7")
  @Permissions("subscriptions.subscriptionsEntity7.read")
  async listSubscriptionsEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-7" })
  @Get("subscriptions-entity-7/:id")
  @Permissions("subscriptions.subscriptionsEntity7.read")
  async getSubscriptionsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-7" })
  @Post("subscriptions-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity7.create")
  async createSubscriptionsEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-7" })
  @Put("subscriptions-entity-7/:id")
  @Permissions("subscriptions.subscriptionsEntity7.update")
  async updateSubscriptionsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-7" })
  @Delete("subscriptions-entity-7/:id")
  @Permissions("subscriptions.subscriptionsEntity7.delete")
  async deleteSubscriptionsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-8" })
  @Get("subscriptions-entity-8")
  @Permissions("subscriptions.subscriptionsEntity8.read")
  async listSubscriptionsEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-8" })
  @Get("subscriptions-entity-8/:id")
  @Permissions("subscriptions.subscriptionsEntity8.read")
  async getSubscriptionsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-8" })
  @Post("subscriptions-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity8.create")
  async createSubscriptionsEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-8" })
  @Put("subscriptions-entity-8/:id")
  @Permissions("subscriptions.subscriptionsEntity8.update")
  async updateSubscriptionsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-8" })
  @Delete("subscriptions-entity-8/:id")
  @Permissions("subscriptions.subscriptionsEntity8.delete")
  async deleteSubscriptionsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-9" })
  @Get("subscriptions-entity-9")
  @Permissions("subscriptions.subscriptionsEntity9.read")
  async listSubscriptionsEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-9" })
  @Get("subscriptions-entity-9/:id")
  @Permissions("subscriptions.subscriptionsEntity9.read")
  async getSubscriptionsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-9" })
  @Post("subscriptions-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity9.create")
  async createSubscriptionsEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-9" })
  @Put("subscriptions-entity-9/:id")
  @Permissions("subscriptions.subscriptionsEntity9.update")
  async updateSubscriptionsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-9" })
  @Delete("subscriptions-entity-9/:id")
  @Permissions("subscriptions.subscriptionsEntity9.delete")
  async deleteSubscriptionsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-10" })
  @Get("subscriptions-entity-10")
  @Permissions("subscriptions.subscriptionsEntity10.read")
  async listSubscriptionsEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-10" })
  @Get("subscriptions-entity-10/:id")
  @Permissions("subscriptions.subscriptionsEntity10.read")
  async getSubscriptionsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-10" })
  @Post("subscriptions-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity10.create")
  async createSubscriptionsEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-10" })
  @Put("subscriptions-entity-10/:id")
  @Permissions("subscriptions.subscriptionsEntity10.update")
  async updateSubscriptionsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-10" })
  @Delete("subscriptions-entity-10/:id")
  @Permissions("subscriptions.subscriptionsEntity10.delete")
  async deleteSubscriptionsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-11" })
  @Get("subscriptions-entity-11")
  @Permissions("subscriptions.subscriptionsEntity11.read")
  async listSubscriptionsEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-11" })
  @Get("subscriptions-entity-11/:id")
  @Permissions("subscriptions.subscriptionsEntity11.read")
  async getSubscriptionsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-11" })
  @Post("subscriptions-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity11.create")
  async createSubscriptionsEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-11" })
  @Put("subscriptions-entity-11/:id")
  @Permissions("subscriptions.subscriptionsEntity11.update")
  async updateSubscriptionsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-11" })
  @Delete("subscriptions-entity-11/:id")
  @Permissions("subscriptions.subscriptionsEntity11.delete")
  async deleteSubscriptionsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-12" })
  @Get("subscriptions-entity-12")
  @Permissions("subscriptions.subscriptionsEntity12.read")
  async listSubscriptionsEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-12" })
  @Get("subscriptions-entity-12/:id")
  @Permissions("subscriptions.subscriptionsEntity12.read")
  async getSubscriptionsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-12" })
  @Post("subscriptions-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity12.create")
  async createSubscriptionsEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-12" })
  @Put("subscriptions-entity-12/:id")
  @Permissions("subscriptions.subscriptionsEntity12.update")
  async updateSubscriptionsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-12" })
  @Delete("subscriptions-entity-12/:id")
  @Permissions("subscriptions.subscriptionsEntity12.delete")
  async deleteSubscriptionsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-13" })
  @Get("subscriptions-entity-13")
  @Permissions("subscriptions.subscriptionsEntity13.read")
  async listSubscriptionsEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-13" })
  @Get("subscriptions-entity-13/:id")
  @Permissions("subscriptions.subscriptionsEntity13.read")
  async getSubscriptionsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-13" })
  @Post("subscriptions-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity13.create")
  async createSubscriptionsEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-13" })
  @Put("subscriptions-entity-13/:id")
  @Permissions("subscriptions.subscriptionsEntity13.update")
  async updateSubscriptionsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-13" })
  @Delete("subscriptions-entity-13/:id")
  @Permissions("subscriptions.subscriptionsEntity13.delete")
  async deleteSubscriptionsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-14" })
  @Get("subscriptions-entity-14")
  @Permissions("subscriptions.subscriptionsEntity14.read")
  async listSubscriptionsEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-14" })
  @Get("subscriptions-entity-14/:id")
  @Permissions("subscriptions.subscriptionsEntity14.read")
  async getSubscriptionsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-14" })
  @Post("subscriptions-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity14.create")
  async createSubscriptionsEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-14" })
  @Put("subscriptions-entity-14/:id")
  @Permissions("subscriptions.subscriptionsEntity14.update")
  async updateSubscriptionsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-14" })
  @Delete("subscriptions-entity-14/:id")
  @Permissions("subscriptions.subscriptionsEntity14.delete")
  async deleteSubscriptionsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-15" })
  @Get("subscriptions-entity-15")
  @Permissions("subscriptions.subscriptionsEntity15.read")
  async listSubscriptionsEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-15" })
  @Get("subscriptions-entity-15/:id")
  @Permissions("subscriptions.subscriptionsEntity15.read")
  async getSubscriptionsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-15" })
  @Post("subscriptions-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity15.create")
  async createSubscriptionsEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-15" })
  @Put("subscriptions-entity-15/:id")
  @Permissions("subscriptions.subscriptionsEntity15.update")
  async updateSubscriptionsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-15" })
  @Delete("subscriptions-entity-15/:id")
  @Permissions("subscriptions.subscriptionsEntity15.delete")
  async deleteSubscriptionsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-16" })
  @Get("subscriptions-entity-16")
  @Permissions("subscriptions.subscriptionsEntity16.read")
  async listSubscriptionsEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-16" })
  @Get("subscriptions-entity-16/:id")
  @Permissions("subscriptions.subscriptionsEntity16.read")
  async getSubscriptionsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-16" })
  @Post("subscriptions-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity16.create")
  async createSubscriptionsEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-16" })
  @Put("subscriptions-entity-16/:id")
  @Permissions("subscriptions.subscriptionsEntity16.update")
  async updateSubscriptionsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-16" })
  @Delete("subscriptions-entity-16/:id")
  @Permissions("subscriptions.subscriptionsEntity16.delete")
  async deleteSubscriptionsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List subscriptions-entity-17" })
  @Get("subscriptions-entity-17")
  @Permissions("subscriptions.subscriptionsEntity17.read")
  async listSubscriptionsEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listSubscriptionsEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get subscriptions-entity-17" })
  @Get("subscriptions-entity-17/:id")
  @Permissions("subscriptions.subscriptionsEntity17.read")
  async getSubscriptionsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSubscriptionsEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create subscriptions-entity-17" })
  @Post("subscriptions-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("subscriptions.subscriptionsEntity17.create")
  async createSubscriptionsEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSubscriptionsEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update subscriptions-entity-17" })
  @Put("subscriptions-entity-17/:id")
  @Permissions("subscriptions.subscriptionsEntity17.update")
  async updateSubscriptionsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSubscriptionsEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete subscriptions-entity-17" })
  @Delete("subscriptions-entity-17/:id")
  @Permissions("subscriptions.subscriptionsEntity17.delete")
  async deleteSubscriptionsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSubscriptionsEntity17(req.user.tenantId, id);
  }
}
