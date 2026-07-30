import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, HttpCode, HttpStatus, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { OutboxGeneratedService } from "./outbox-generated.service";

interface AuthenticatedRequest extends Request { user: { userId: string; tenantId: string; email: string; roles: string[] }; }

@ApiTags("outbox")
@ApiBearerAuth()
@Controller("outbox")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class OutboxGeneratedController {
  constructor(private readonly svc: OutboxGeneratedService) {}

  @ApiOperation({ summary: "List outbox-entity-1" }) @Get("outbox-entity-1") @Permissions("outbox.outboxEntity1.read")
  async listOutboxEntity1(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity1(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-1" }) @Get("outbox-entity-1/:id") @Permissions("outbox.outboxEntity1.read")
  async getOutboxEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-1" }) @Post("outbox-entity-1") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity1.create")
  async createOutboxEntity1(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity1(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-1" }) @Put("outbox-entity-1/:id") @Permissions("outbox.outboxEntity1.update")
  async updateOutboxEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity1(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-1" }) @Delete("outbox-entity-1/:id") @Permissions("outbox.outboxEntity1.delete")
  async deleteOutboxEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-2" }) @Get("outbox-entity-2") @Permissions("outbox.outboxEntity2.read")
  async listOutboxEntity2(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity2(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-2" }) @Get("outbox-entity-2/:id") @Permissions("outbox.outboxEntity2.read")
  async getOutboxEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-2" }) @Post("outbox-entity-2") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity2.create")
  async createOutboxEntity2(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity2(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-2" }) @Put("outbox-entity-2/:id") @Permissions("outbox.outboxEntity2.update")
  async updateOutboxEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity2(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-2" }) @Delete("outbox-entity-2/:id") @Permissions("outbox.outboxEntity2.delete")
  async deleteOutboxEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-3" }) @Get("outbox-entity-3") @Permissions("outbox.outboxEntity3.read")
  async listOutboxEntity3(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity3(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-3" }) @Get("outbox-entity-3/:id") @Permissions("outbox.outboxEntity3.read")
  async getOutboxEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-3" }) @Post("outbox-entity-3") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity3.create")
  async createOutboxEntity3(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity3(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-3" }) @Put("outbox-entity-3/:id") @Permissions("outbox.outboxEntity3.update")
  async updateOutboxEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity3(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-3" }) @Delete("outbox-entity-3/:id") @Permissions("outbox.outboxEntity3.delete")
  async deleteOutboxEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-4" }) @Get("outbox-entity-4") @Permissions("outbox.outboxEntity4.read")
  async listOutboxEntity4(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity4(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-4" }) @Get("outbox-entity-4/:id") @Permissions("outbox.outboxEntity4.read")
  async getOutboxEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-4" }) @Post("outbox-entity-4") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity4.create")
  async createOutboxEntity4(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity4(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-4" }) @Put("outbox-entity-4/:id") @Permissions("outbox.outboxEntity4.update")
  async updateOutboxEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity4(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-4" }) @Delete("outbox-entity-4/:id") @Permissions("outbox.outboxEntity4.delete")
  async deleteOutboxEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-5" }) @Get("outbox-entity-5") @Permissions("outbox.outboxEntity5.read")
  async listOutboxEntity5(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity5(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-5" }) @Get("outbox-entity-5/:id") @Permissions("outbox.outboxEntity5.read")
  async getOutboxEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-5" }) @Post("outbox-entity-5") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity5.create")
  async createOutboxEntity5(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity5(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-5" }) @Put("outbox-entity-5/:id") @Permissions("outbox.outboxEntity5.update")
  async updateOutboxEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity5(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-5" }) @Delete("outbox-entity-5/:id") @Permissions("outbox.outboxEntity5.delete")
  async deleteOutboxEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-6" }) @Get("outbox-entity-6") @Permissions("outbox.outboxEntity6.read")
  async listOutboxEntity6(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity6(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-6" }) @Get("outbox-entity-6/:id") @Permissions("outbox.outboxEntity6.read")
  async getOutboxEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-6" }) @Post("outbox-entity-6") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity6.create")
  async createOutboxEntity6(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity6(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-6" }) @Put("outbox-entity-6/:id") @Permissions("outbox.outboxEntity6.update")
  async updateOutboxEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity6(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-6" }) @Delete("outbox-entity-6/:id") @Permissions("outbox.outboxEntity6.delete")
  async deleteOutboxEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-7" }) @Get("outbox-entity-7") @Permissions("outbox.outboxEntity7.read")
  async listOutboxEntity7(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity7(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-7" }) @Get("outbox-entity-7/:id") @Permissions("outbox.outboxEntity7.read")
  async getOutboxEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-7" }) @Post("outbox-entity-7") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity7.create")
  async createOutboxEntity7(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity7(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-7" }) @Put("outbox-entity-7/:id") @Permissions("outbox.outboxEntity7.update")
  async updateOutboxEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity7(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-7" }) @Delete("outbox-entity-7/:id") @Permissions("outbox.outboxEntity7.delete")
  async deleteOutboxEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-8" }) @Get("outbox-entity-8") @Permissions("outbox.outboxEntity8.read")
  async listOutboxEntity8(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity8(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-8" }) @Get("outbox-entity-8/:id") @Permissions("outbox.outboxEntity8.read")
  async getOutboxEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-8" }) @Post("outbox-entity-8") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity8.create")
  async createOutboxEntity8(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity8(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-8" }) @Put("outbox-entity-8/:id") @Permissions("outbox.outboxEntity8.update")
  async updateOutboxEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity8(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-8" }) @Delete("outbox-entity-8/:id") @Permissions("outbox.outboxEntity8.delete")
  async deleteOutboxEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-9" }) @Get("outbox-entity-9") @Permissions("outbox.outboxEntity9.read")
  async listOutboxEntity9(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity9(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-9" }) @Get("outbox-entity-9/:id") @Permissions("outbox.outboxEntity9.read")
  async getOutboxEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-9" }) @Post("outbox-entity-9") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity9.create")
  async createOutboxEntity9(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity9(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-9" }) @Put("outbox-entity-9/:id") @Permissions("outbox.outboxEntity9.update")
  async updateOutboxEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity9(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-9" }) @Delete("outbox-entity-9/:id") @Permissions("outbox.outboxEntity9.delete")
  async deleteOutboxEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-10" }) @Get("outbox-entity-10") @Permissions("outbox.outboxEntity10.read")
  async listOutboxEntity10(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity10(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-10" }) @Get("outbox-entity-10/:id") @Permissions("outbox.outboxEntity10.read")
  async getOutboxEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-10" }) @Post("outbox-entity-10") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity10.create")
  async createOutboxEntity10(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity10(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-10" }) @Put("outbox-entity-10/:id") @Permissions("outbox.outboxEntity10.update")
  async updateOutboxEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity10(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-10" }) @Delete("outbox-entity-10/:id") @Permissions("outbox.outboxEntity10.delete")
  async deleteOutboxEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-11" }) @Get("outbox-entity-11") @Permissions("outbox.outboxEntity11.read")
  async listOutboxEntity11(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity11(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-11" }) @Get("outbox-entity-11/:id") @Permissions("outbox.outboxEntity11.read")
  async getOutboxEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-11" }) @Post("outbox-entity-11") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity11.create")
  async createOutboxEntity11(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity11(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-11" }) @Put("outbox-entity-11/:id") @Permissions("outbox.outboxEntity11.update")
  async updateOutboxEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity11(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-11" }) @Delete("outbox-entity-11/:id") @Permissions("outbox.outboxEntity11.delete")
  async deleteOutboxEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-12" }) @Get("outbox-entity-12") @Permissions("outbox.outboxEntity12.read")
  async listOutboxEntity12(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity12(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-12" }) @Get("outbox-entity-12/:id") @Permissions("outbox.outboxEntity12.read")
  async getOutboxEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-12" }) @Post("outbox-entity-12") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity12.create")
  async createOutboxEntity12(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity12(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-12" }) @Put("outbox-entity-12/:id") @Permissions("outbox.outboxEntity12.update")
  async updateOutboxEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity12(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-12" }) @Delete("outbox-entity-12/:id") @Permissions("outbox.outboxEntity12.delete")
  async deleteOutboxEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-13" }) @Get("outbox-entity-13") @Permissions("outbox.outboxEntity13.read")
  async listOutboxEntity13(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity13(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-13" }) @Get("outbox-entity-13/:id") @Permissions("outbox.outboxEntity13.read")
  async getOutboxEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-13" }) @Post("outbox-entity-13") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity13.create")
  async createOutboxEntity13(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity13(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-13" }) @Put("outbox-entity-13/:id") @Permissions("outbox.outboxEntity13.update")
  async updateOutboxEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity13(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-13" }) @Delete("outbox-entity-13/:id") @Permissions("outbox.outboxEntity13.delete")
  async deleteOutboxEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-14" }) @Get("outbox-entity-14") @Permissions("outbox.outboxEntity14.read")
  async listOutboxEntity14(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity14(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-14" }) @Get("outbox-entity-14/:id") @Permissions("outbox.outboxEntity14.read")
  async getOutboxEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-14" }) @Post("outbox-entity-14") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity14.create")
  async createOutboxEntity14(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity14(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-14" }) @Put("outbox-entity-14/:id") @Permissions("outbox.outboxEntity14.update")
  async updateOutboxEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity14(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-14" }) @Delete("outbox-entity-14/:id") @Permissions("outbox.outboxEntity14.delete")
  async deleteOutboxEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-15" }) @Get("outbox-entity-15") @Permissions("outbox.outboxEntity15.read")
  async listOutboxEntity15(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity15(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-15" }) @Get("outbox-entity-15/:id") @Permissions("outbox.outboxEntity15.read")
  async getOutboxEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-15" }) @Post("outbox-entity-15") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity15.create")
  async createOutboxEntity15(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity15(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-15" }) @Put("outbox-entity-15/:id") @Permissions("outbox.outboxEntity15.update")
  async updateOutboxEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity15(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-15" }) @Delete("outbox-entity-15/:id") @Permissions("outbox.outboxEntity15.delete")
  async deleteOutboxEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-16" }) @Get("outbox-entity-16") @Permissions("outbox.outboxEntity16.read")
  async listOutboxEntity16(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity16(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-16" }) @Get("outbox-entity-16/:id") @Permissions("outbox.outboxEntity16.read")
  async getOutboxEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-16" }) @Post("outbox-entity-16") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity16.create")
  async createOutboxEntity16(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity16(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-16" }) @Put("outbox-entity-16/:id") @Permissions("outbox.outboxEntity16.update")
  async updateOutboxEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity16(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-16" }) @Delete("outbox-entity-16/:id") @Permissions("outbox.outboxEntity16.delete")
  async deleteOutboxEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-17" }) @Get("outbox-entity-17") @Permissions("outbox.outboxEntity17.read")
  async listOutboxEntity17(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity17(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-17" }) @Get("outbox-entity-17/:id") @Permissions("outbox.outboxEntity17.read")
  async getOutboxEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-17" }) @Post("outbox-entity-17") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity17.create")
  async createOutboxEntity17(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity17(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-17" }) @Put("outbox-entity-17/:id") @Permissions("outbox.outboxEntity17.update")
  async updateOutboxEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity17(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-17" }) @Delete("outbox-entity-17/:id") @Permissions("outbox.outboxEntity17.delete")
  async deleteOutboxEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-18" }) @Get("outbox-entity-18") @Permissions("outbox.outboxEntity18.read")
  async listOutboxEntity18(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity18(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-18" }) @Get("outbox-entity-18/:id") @Permissions("outbox.outboxEntity18.read")
  async getOutboxEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-18" }) @Post("outbox-entity-18") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity18.create")
  async createOutboxEntity18(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity18(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-18" }) @Put("outbox-entity-18/:id") @Permissions("outbox.outboxEntity18.update")
  async updateOutboxEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity18(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-18" }) @Delete("outbox-entity-18/:id") @Permissions("outbox.outboxEntity18.delete")
  async deleteOutboxEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-19" }) @Get("outbox-entity-19") @Permissions("outbox.outboxEntity19.read")
  async listOutboxEntity19(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity19(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-19" }) @Get("outbox-entity-19/:id") @Permissions("outbox.outboxEntity19.read")
  async getOutboxEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-19" }) @Post("outbox-entity-19") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity19.create")
  async createOutboxEntity19(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity19(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-19" }) @Put("outbox-entity-19/:id") @Permissions("outbox.outboxEntity19.update")
  async updateOutboxEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity19(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-19" }) @Delete("outbox-entity-19/:id") @Permissions("outbox.outboxEntity19.delete")
  async deleteOutboxEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-20" }) @Get("outbox-entity-20") @Permissions("outbox.outboxEntity20.read")
  async listOutboxEntity20(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity20(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-20" }) @Get("outbox-entity-20/:id") @Permissions("outbox.outboxEntity20.read")
  async getOutboxEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-20" }) @Post("outbox-entity-20") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity20.create")
  async createOutboxEntity20(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity20(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-20" }) @Put("outbox-entity-20/:id") @Permissions("outbox.outboxEntity20.update")
  async updateOutboxEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity20(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-20" }) @Delete("outbox-entity-20/:id") @Permissions("outbox.outboxEntity20.delete")
  async deleteOutboxEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-21" }) @Get("outbox-entity-21") @Permissions("outbox.outboxEntity21.read")
  async listOutboxEntity21(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity21(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-21" }) @Get("outbox-entity-21/:id") @Permissions("outbox.outboxEntity21.read")
  async getOutboxEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-21" }) @Post("outbox-entity-21") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity21.create")
  async createOutboxEntity21(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity21(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-21" }) @Put("outbox-entity-21/:id") @Permissions("outbox.outboxEntity21.update")
  async updateOutboxEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity21(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-21" }) @Delete("outbox-entity-21/:id") @Permissions("outbox.outboxEntity21.delete")
  async deleteOutboxEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-22" }) @Get("outbox-entity-22") @Permissions("outbox.outboxEntity22.read")
  async listOutboxEntity22(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity22(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-22" }) @Get("outbox-entity-22/:id") @Permissions("outbox.outboxEntity22.read")
  async getOutboxEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-22" }) @Post("outbox-entity-22") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity22.create")
  async createOutboxEntity22(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity22(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-22" }) @Put("outbox-entity-22/:id") @Permissions("outbox.outboxEntity22.update")
  async updateOutboxEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity22(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-22" }) @Delete("outbox-entity-22/:id") @Permissions("outbox.outboxEntity22.delete")
  async deleteOutboxEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-23" }) @Get("outbox-entity-23") @Permissions("outbox.outboxEntity23.read")
  async listOutboxEntity23(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity23(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-23" }) @Get("outbox-entity-23/:id") @Permissions("outbox.outboxEntity23.read")
  async getOutboxEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-23" }) @Post("outbox-entity-23") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity23.create")
  async createOutboxEntity23(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity23(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-23" }) @Put("outbox-entity-23/:id") @Permissions("outbox.outboxEntity23.update")
  async updateOutboxEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity23(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-23" }) @Delete("outbox-entity-23/:id") @Permissions("outbox.outboxEntity23.delete")
  async deleteOutboxEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-24" }) @Get("outbox-entity-24") @Permissions("outbox.outboxEntity24.read")
  async listOutboxEntity24(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity24(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-24" }) @Get("outbox-entity-24/:id") @Permissions("outbox.outboxEntity24.read")
  async getOutboxEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-24" }) @Post("outbox-entity-24") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity24.create")
  async createOutboxEntity24(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity24(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-24" }) @Put("outbox-entity-24/:id") @Permissions("outbox.outboxEntity24.update")
  async updateOutboxEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity24(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-24" }) @Delete("outbox-entity-24/:id") @Permissions("outbox.outboxEntity24.delete")
  async deleteOutboxEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-25" }) @Get("outbox-entity-25") @Permissions("outbox.outboxEntity25.read")
  async listOutboxEntity25(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity25(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-25" }) @Get("outbox-entity-25/:id") @Permissions("outbox.outboxEntity25.read")
  async getOutboxEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-25" }) @Post("outbox-entity-25") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity25.create")
  async createOutboxEntity25(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity25(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-25" }) @Put("outbox-entity-25/:id") @Permissions("outbox.outboxEntity25.update")
  async updateOutboxEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity25(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-25" }) @Delete("outbox-entity-25/:id") @Permissions("outbox.outboxEntity25.delete")
  async deleteOutboxEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-26" }) @Get("outbox-entity-26") @Permissions("outbox.outboxEntity26.read")
  async listOutboxEntity26(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity26(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-26" }) @Get("outbox-entity-26/:id") @Permissions("outbox.outboxEntity26.read")
  async getOutboxEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-26" }) @Post("outbox-entity-26") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity26.create")
  async createOutboxEntity26(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity26(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-26" }) @Put("outbox-entity-26/:id") @Permissions("outbox.outboxEntity26.update")
  async updateOutboxEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity26(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-26" }) @Delete("outbox-entity-26/:id") @Permissions("outbox.outboxEntity26.delete")
  async deleteOutboxEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-27" }) @Get("outbox-entity-27") @Permissions("outbox.outboxEntity27.read")
  async listOutboxEntity27(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity27(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-27" }) @Get("outbox-entity-27/:id") @Permissions("outbox.outboxEntity27.read")
  async getOutboxEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-27" }) @Post("outbox-entity-27") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity27.create")
  async createOutboxEntity27(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity27(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-27" }) @Put("outbox-entity-27/:id") @Permissions("outbox.outboxEntity27.update")
  async updateOutboxEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity27(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-27" }) @Delete("outbox-entity-27/:id") @Permissions("outbox.outboxEntity27.delete")
  async deleteOutboxEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-28" }) @Get("outbox-entity-28") @Permissions("outbox.outboxEntity28.read")
  async listOutboxEntity28(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity28(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-28" }) @Get("outbox-entity-28/:id") @Permissions("outbox.outboxEntity28.read")
  async getOutboxEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-28" }) @Post("outbox-entity-28") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity28.create")
  async createOutboxEntity28(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity28(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-28" }) @Put("outbox-entity-28/:id") @Permissions("outbox.outboxEntity28.update")
  async updateOutboxEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity28(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-28" }) @Delete("outbox-entity-28/:id") @Permissions("outbox.outboxEntity28.delete")
  async deleteOutboxEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-29" }) @Get("outbox-entity-29") @Permissions("outbox.outboxEntity29.read")
  async listOutboxEntity29(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity29(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-29" }) @Get("outbox-entity-29/:id") @Permissions("outbox.outboxEntity29.read")
  async getOutboxEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-29" }) @Post("outbox-entity-29") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity29.create")
  async createOutboxEntity29(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity29(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-29" }) @Put("outbox-entity-29/:id") @Permissions("outbox.outboxEntity29.update")
  async updateOutboxEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity29(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-29" }) @Delete("outbox-entity-29/:id") @Permissions("outbox.outboxEntity29.delete")
  async deleteOutboxEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-30" }) @Get("outbox-entity-30") @Permissions("outbox.outboxEntity30.read")
  async listOutboxEntity30(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity30(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-30" }) @Get("outbox-entity-30/:id") @Permissions("outbox.outboxEntity30.read")
  async getOutboxEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-30" }) @Post("outbox-entity-30") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity30.create")
  async createOutboxEntity30(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity30(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-30" }) @Put("outbox-entity-30/:id") @Permissions("outbox.outboxEntity30.update")
  async updateOutboxEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity30(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-30" }) @Delete("outbox-entity-30/:id") @Permissions("outbox.outboxEntity30.delete")
  async deleteOutboxEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-31" }) @Get("outbox-entity-31") @Permissions("outbox.outboxEntity31.read")
  async listOutboxEntity31(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity31(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-31" }) @Get("outbox-entity-31/:id") @Permissions("outbox.outboxEntity31.read")
  async getOutboxEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-31" }) @Post("outbox-entity-31") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity31.create")
  async createOutboxEntity31(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity31(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-31" }) @Put("outbox-entity-31/:id") @Permissions("outbox.outboxEntity31.update")
  async updateOutboxEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity31(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-31" }) @Delete("outbox-entity-31/:id") @Permissions("outbox.outboxEntity31.delete")
  async deleteOutboxEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-32" }) @Get("outbox-entity-32") @Permissions("outbox.outboxEntity32.read")
  async listOutboxEntity32(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity32(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-32" }) @Get("outbox-entity-32/:id") @Permissions("outbox.outboxEntity32.read")
  async getOutboxEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-32" }) @Post("outbox-entity-32") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity32.create")
  async createOutboxEntity32(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity32(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-32" }) @Put("outbox-entity-32/:id") @Permissions("outbox.outboxEntity32.update")
  async updateOutboxEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity32(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-32" }) @Delete("outbox-entity-32/:id") @Permissions("outbox.outboxEntity32.delete")
  async deleteOutboxEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-33" }) @Get("outbox-entity-33") @Permissions("outbox.outboxEntity33.read")
  async listOutboxEntity33(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity33(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-33" }) @Get("outbox-entity-33/:id") @Permissions("outbox.outboxEntity33.read")
  async getOutboxEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-33" }) @Post("outbox-entity-33") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity33.create")
  async createOutboxEntity33(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity33(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-33" }) @Put("outbox-entity-33/:id") @Permissions("outbox.outboxEntity33.update")
  async updateOutboxEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity33(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-33" }) @Delete("outbox-entity-33/:id") @Permissions("outbox.outboxEntity33.delete")
  async deleteOutboxEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-34" }) @Get("outbox-entity-34") @Permissions("outbox.outboxEntity34.read")
  async listOutboxEntity34(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity34(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-34" }) @Get("outbox-entity-34/:id") @Permissions("outbox.outboxEntity34.read")
  async getOutboxEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-34" }) @Post("outbox-entity-34") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity34.create")
  async createOutboxEntity34(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity34(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-34" }) @Put("outbox-entity-34/:id") @Permissions("outbox.outboxEntity34.update")
  async updateOutboxEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity34(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-34" }) @Delete("outbox-entity-34/:id") @Permissions("outbox.outboxEntity34.delete")
  async deleteOutboxEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-35" }) @Get("outbox-entity-35") @Permissions("outbox.outboxEntity35.read")
  async listOutboxEntity35(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity35(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-35" }) @Get("outbox-entity-35/:id") @Permissions("outbox.outboxEntity35.read")
  async getOutboxEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-35" }) @Post("outbox-entity-35") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity35.create")
  async createOutboxEntity35(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity35(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-35" }) @Put("outbox-entity-35/:id") @Permissions("outbox.outboxEntity35.update")
  async updateOutboxEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity35(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-35" }) @Delete("outbox-entity-35/:id") @Permissions("outbox.outboxEntity35.delete")
  async deleteOutboxEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-36" }) @Get("outbox-entity-36") @Permissions("outbox.outboxEntity36.read")
  async listOutboxEntity36(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity36(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-36" }) @Get("outbox-entity-36/:id") @Permissions("outbox.outboxEntity36.read")
  async getOutboxEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-36" }) @Post("outbox-entity-36") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity36.create")
  async createOutboxEntity36(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity36(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-36" }) @Put("outbox-entity-36/:id") @Permissions("outbox.outboxEntity36.update")
  async updateOutboxEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity36(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-36" }) @Delete("outbox-entity-36/:id") @Permissions("outbox.outboxEntity36.delete")
  async deleteOutboxEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-37" }) @Get("outbox-entity-37") @Permissions("outbox.outboxEntity37.read")
  async listOutboxEntity37(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity37(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-37" }) @Get("outbox-entity-37/:id") @Permissions("outbox.outboxEntity37.read")
  async getOutboxEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-37" }) @Post("outbox-entity-37") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity37.create")
  async createOutboxEntity37(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity37(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-37" }) @Put("outbox-entity-37/:id") @Permissions("outbox.outboxEntity37.update")
  async updateOutboxEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity37(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-37" }) @Delete("outbox-entity-37/:id") @Permissions("outbox.outboxEntity37.delete")
  async deleteOutboxEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-38" }) @Get("outbox-entity-38") @Permissions("outbox.outboxEntity38.read")
  async listOutboxEntity38(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity38(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-38" }) @Get("outbox-entity-38/:id") @Permissions("outbox.outboxEntity38.read")
  async getOutboxEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-38" }) @Post("outbox-entity-38") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity38.create")
  async createOutboxEntity38(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity38(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-38" }) @Put("outbox-entity-38/:id") @Permissions("outbox.outboxEntity38.update")
  async updateOutboxEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity38(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-38" }) @Delete("outbox-entity-38/:id") @Permissions("outbox.outboxEntity38.delete")
  async deleteOutboxEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-39" }) @Get("outbox-entity-39") @Permissions("outbox.outboxEntity39.read")
  async listOutboxEntity39(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity39(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-39" }) @Get("outbox-entity-39/:id") @Permissions("outbox.outboxEntity39.read")
  async getOutboxEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-39" }) @Post("outbox-entity-39") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity39.create")
  async createOutboxEntity39(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity39(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-39" }) @Put("outbox-entity-39/:id") @Permissions("outbox.outboxEntity39.update")
  async updateOutboxEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity39(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-39" }) @Delete("outbox-entity-39/:id") @Permissions("outbox.outboxEntity39.delete")
  async deleteOutboxEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-40" }) @Get("outbox-entity-40") @Permissions("outbox.outboxEntity40.read")
  async listOutboxEntity40(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity40(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-40" }) @Get("outbox-entity-40/:id") @Permissions("outbox.outboxEntity40.read")
  async getOutboxEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-40" }) @Post("outbox-entity-40") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity40.create")
  async createOutboxEntity40(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity40(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-40" }) @Put("outbox-entity-40/:id") @Permissions("outbox.outboxEntity40.update")
  async updateOutboxEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity40(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-40" }) @Delete("outbox-entity-40/:id") @Permissions("outbox.outboxEntity40.delete")
  async deleteOutboxEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-41" }) @Get("outbox-entity-41") @Permissions("outbox.outboxEntity41.read")
  async listOutboxEntity41(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity41(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-41" }) @Get("outbox-entity-41/:id") @Permissions("outbox.outboxEntity41.read")
  async getOutboxEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-41" }) @Post("outbox-entity-41") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity41.create")
  async createOutboxEntity41(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity41(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-41" }) @Put("outbox-entity-41/:id") @Permissions("outbox.outboxEntity41.update")
  async updateOutboxEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity41(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-41" }) @Delete("outbox-entity-41/:id") @Permissions("outbox.outboxEntity41.delete")
  async deleteOutboxEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-42" }) @Get("outbox-entity-42") @Permissions("outbox.outboxEntity42.read")
  async listOutboxEntity42(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity42(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-42" }) @Get("outbox-entity-42/:id") @Permissions("outbox.outboxEntity42.read")
  async getOutboxEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-42" }) @Post("outbox-entity-42") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity42.create")
  async createOutboxEntity42(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity42(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-42" }) @Put("outbox-entity-42/:id") @Permissions("outbox.outboxEntity42.update")
  async updateOutboxEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity42(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-42" }) @Delete("outbox-entity-42/:id") @Permissions("outbox.outboxEntity42.delete")
  async deleteOutboxEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-43" }) @Get("outbox-entity-43") @Permissions("outbox.outboxEntity43.read")
  async listOutboxEntity43(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity43(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-43" }) @Get("outbox-entity-43/:id") @Permissions("outbox.outboxEntity43.read")
  async getOutboxEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-43" }) @Post("outbox-entity-43") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity43.create")
  async createOutboxEntity43(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity43(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-43" }) @Put("outbox-entity-43/:id") @Permissions("outbox.outboxEntity43.update")
  async updateOutboxEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity43(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-43" }) @Delete("outbox-entity-43/:id") @Permissions("outbox.outboxEntity43.delete")
  async deleteOutboxEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-44" }) @Get("outbox-entity-44") @Permissions("outbox.outboxEntity44.read")
  async listOutboxEntity44(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity44(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-44" }) @Get("outbox-entity-44/:id") @Permissions("outbox.outboxEntity44.read")
  async getOutboxEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-44" }) @Post("outbox-entity-44") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity44.create")
  async createOutboxEntity44(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity44(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-44" }) @Put("outbox-entity-44/:id") @Permissions("outbox.outboxEntity44.update")
  async updateOutboxEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity44(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-44" }) @Delete("outbox-entity-44/:id") @Permissions("outbox.outboxEntity44.delete")
  async deleteOutboxEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "List outbox-entity-45" }) @Get("outbox-entity-45") @Permissions("outbox.outboxEntity45.read")
  async listOutboxEntity45(@Req() req: AuthenticatedRequest) { return this.svc.listOutboxEntity45(req.user.tenantId); }

  @ApiOperation({ summary: "Get outbox-entity-45" }) @Get("outbox-entity-45/:id") @Permissions("outbox.outboxEntity45.read")
  async getOutboxEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getOutboxEntity45(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create outbox-entity-45" }) @Post("outbox-entity-45") @HttpCode(HttpStatus.CREATED) @Permissions("outbox.outboxEntity45.create")
  async createOutboxEntity45(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createOutboxEntity45(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update outbox-entity-45" }) @Put("outbox-entity-45/:id") @Permissions("outbox.outboxEntity45.update")
  async updateOutboxEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateOutboxEntity45(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete outbox-entity-45" }) @Delete("outbox-entity-45/:id") @Permissions("outbox.outboxEntity45.delete")
  async deleteOutboxEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteOutboxEntity45(req.user.tenantId, id); }

}
