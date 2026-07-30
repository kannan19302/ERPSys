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
import { ServiceManagementGeneratedService } from "./service-management-generated.service";

interface AuthenticatedRequest extends Request { user: { userId: string; tenantId: string; email: string; roles: string[] }; }

@ApiTags("service-management")
@ApiBearerAuth()
@Controller("service-management")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ServiceManagementGeneratedController {
  constructor(private readonly svc: ServiceManagementGeneratedService) {}

  @ApiOperation({ summary: "List service-management-entity-1" }) @Get("service-management-entity-1") @Permissions("service-management.serviceManagementEntity1.read")
  async listServiceManagementEntity1(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity1(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-1" }) @Get("service-management-entity-1/:id") @Permissions("service-management.serviceManagementEntity1.read")
  async getServiceManagementEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-1" }) @Post("service-management-entity-1") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity1.create")
  async createServiceManagementEntity1(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity1(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-1" }) @Put("service-management-entity-1/:id") @Permissions("service-management.serviceManagementEntity1.update")
  async updateServiceManagementEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity1(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-1" }) @Delete("service-management-entity-1/:id") @Permissions("service-management.serviceManagementEntity1.delete")
  async deleteServiceManagementEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-2" }) @Get("service-management-entity-2") @Permissions("service-management.serviceManagementEntity2.read")
  async listServiceManagementEntity2(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity2(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-2" }) @Get("service-management-entity-2/:id") @Permissions("service-management.serviceManagementEntity2.read")
  async getServiceManagementEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-2" }) @Post("service-management-entity-2") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity2.create")
  async createServiceManagementEntity2(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity2(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-2" }) @Put("service-management-entity-2/:id") @Permissions("service-management.serviceManagementEntity2.update")
  async updateServiceManagementEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity2(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-2" }) @Delete("service-management-entity-2/:id") @Permissions("service-management.serviceManagementEntity2.delete")
  async deleteServiceManagementEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-3" }) @Get("service-management-entity-3") @Permissions("service-management.serviceManagementEntity3.read")
  async listServiceManagementEntity3(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity3(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-3" }) @Get("service-management-entity-3/:id") @Permissions("service-management.serviceManagementEntity3.read")
  async getServiceManagementEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-3" }) @Post("service-management-entity-3") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity3.create")
  async createServiceManagementEntity3(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity3(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-3" }) @Put("service-management-entity-3/:id") @Permissions("service-management.serviceManagementEntity3.update")
  async updateServiceManagementEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity3(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-3" }) @Delete("service-management-entity-3/:id") @Permissions("service-management.serviceManagementEntity3.delete")
  async deleteServiceManagementEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-4" }) @Get("service-management-entity-4") @Permissions("service-management.serviceManagementEntity4.read")
  async listServiceManagementEntity4(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity4(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-4" }) @Get("service-management-entity-4/:id") @Permissions("service-management.serviceManagementEntity4.read")
  async getServiceManagementEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-4" }) @Post("service-management-entity-4") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity4.create")
  async createServiceManagementEntity4(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity4(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-4" }) @Put("service-management-entity-4/:id") @Permissions("service-management.serviceManagementEntity4.update")
  async updateServiceManagementEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity4(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-4" }) @Delete("service-management-entity-4/:id") @Permissions("service-management.serviceManagementEntity4.delete")
  async deleteServiceManagementEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-5" }) @Get("service-management-entity-5") @Permissions("service-management.serviceManagementEntity5.read")
  async listServiceManagementEntity5(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity5(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-5" }) @Get("service-management-entity-5/:id") @Permissions("service-management.serviceManagementEntity5.read")
  async getServiceManagementEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-5" }) @Post("service-management-entity-5") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity5.create")
  async createServiceManagementEntity5(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity5(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-5" }) @Put("service-management-entity-5/:id") @Permissions("service-management.serviceManagementEntity5.update")
  async updateServiceManagementEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity5(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-5" }) @Delete("service-management-entity-5/:id") @Permissions("service-management.serviceManagementEntity5.delete")
  async deleteServiceManagementEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-6" }) @Get("service-management-entity-6") @Permissions("service-management.serviceManagementEntity6.read")
  async listServiceManagementEntity6(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity6(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-6" }) @Get("service-management-entity-6/:id") @Permissions("service-management.serviceManagementEntity6.read")
  async getServiceManagementEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-6" }) @Post("service-management-entity-6") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity6.create")
  async createServiceManagementEntity6(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity6(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-6" }) @Put("service-management-entity-6/:id") @Permissions("service-management.serviceManagementEntity6.update")
  async updateServiceManagementEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity6(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-6" }) @Delete("service-management-entity-6/:id") @Permissions("service-management.serviceManagementEntity6.delete")
  async deleteServiceManagementEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-7" }) @Get("service-management-entity-7") @Permissions("service-management.serviceManagementEntity7.read")
  async listServiceManagementEntity7(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity7(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-7" }) @Get("service-management-entity-7/:id") @Permissions("service-management.serviceManagementEntity7.read")
  async getServiceManagementEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-7" }) @Post("service-management-entity-7") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity7.create")
  async createServiceManagementEntity7(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity7(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-7" }) @Put("service-management-entity-7/:id") @Permissions("service-management.serviceManagementEntity7.update")
  async updateServiceManagementEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity7(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-7" }) @Delete("service-management-entity-7/:id") @Permissions("service-management.serviceManagementEntity7.delete")
  async deleteServiceManagementEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-8" }) @Get("service-management-entity-8") @Permissions("service-management.serviceManagementEntity8.read")
  async listServiceManagementEntity8(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity8(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-8" }) @Get("service-management-entity-8/:id") @Permissions("service-management.serviceManagementEntity8.read")
  async getServiceManagementEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-8" }) @Post("service-management-entity-8") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity8.create")
  async createServiceManagementEntity8(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity8(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-8" }) @Put("service-management-entity-8/:id") @Permissions("service-management.serviceManagementEntity8.update")
  async updateServiceManagementEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity8(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-8" }) @Delete("service-management-entity-8/:id") @Permissions("service-management.serviceManagementEntity8.delete")
  async deleteServiceManagementEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-9" }) @Get("service-management-entity-9") @Permissions("service-management.serviceManagementEntity9.read")
  async listServiceManagementEntity9(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity9(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-9" }) @Get("service-management-entity-9/:id") @Permissions("service-management.serviceManagementEntity9.read")
  async getServiceManagementEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-9" }) @Post("service-management-entity-9") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity9.create")
  async createServiceManagementEntity9(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity9(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-9" }) @Put("service-management-entity-9/:id") @Permissions("service-management.serviceManagementEntity9.update")
  async updateServiceManagementEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity9(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-9" }) @Delete("service-management-entity-9/:id") @Permissions("service-management.serviceManagementEntity9.delete")
  async deleteServiceManagementEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-10" }) @Get("service-management-entity-10") @Permissions("service-management.serviceManagementEntity10.read")
  async listServiceManagementEntity10(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity10(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-10" }) @Get("service-management-entity-10/:id") @Permissions("service-management.serviceManagementEntity10.read")
  async getServiceManagementEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-10" }) @Post("service-management-entity-10") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity10.create")
  async createServiceManagementEntity10(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity10(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-10" }) @Put("service-management-entity-10/:id") @Permissions("service-management.serviceManagementEntity10.update")
  async updateServiceManagementEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity10(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-10" }) @Delete("service-management-entity-10/:id") @Permissions("service-management.serviceManagementEntity10.delete")
  async deleteServiceManagementEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-11" }) @Get("service-management-entity-11") @Permissions("service-management.serviceManagementEntity11.read")
  async listServiceManagementEntity11(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity11(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-11" }) @Get("service-management-entity-11/:id") @Permissions("service-management.serviceManagementEntity11.read")
  async getServiceManagementEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-11" }) @Post("service-management-entity-11") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity11.create")
  async createServiceManagementEntity11(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity11(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-11" }) @Put("service-management-entity-11/:id") @Permissions("service-management.serviceManagementEntity11.update")
  async updateServiceManagementEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity11(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-11" }) @Delete("service-management-entity-11/:id") @Permissions("service-management.serviceManagementEntity11.delete")
  async deleteServiceManagementEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-12" }) @Get("service-management-entity-12") @Permissions("service-management.serviceManagementEntity12.read")
  async listServiceManagementEntity12(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity12(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-12" }) @Get("service-management-entity-12/:id") @Permissions("service-management.serviceManagementEntity12.read")
  async getServiceManagementEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-12" }) @Post("service-management-entity-12") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity12.create")
  async createServiceManagementEntity12(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity12(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-12" }) @Put("service-management-entity-12/:id") @Permissions("service-management.serviceManagementEntity12.update")
  async updateServiceManagementEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity12(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-12" }) @Delete("service-management-entity-12/:id") @Permissions("service-management.serviceManagementEntity12.delete")
  async deleteServiceManagementEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-13" }) @Get("service-management-entity-13") @Permissions("service-management.serviceManagementEntity13.read")
  async listServiceManagementEntity13(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity13(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-13" }) @Get("service-management-entity-13/:id") @Permissions("service-management.serviceManagementEntity13.read")
  async getServiceManagementEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-13" }) @Post("service-management-entity-13") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity13.create")
  async createServiceManagementEntity13(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity13(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-13" }) @Put("service-management-entity-13/:id") @Permissions("service-management.serviceManagementEntity13.update")
  async updateServiceManagementEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity13(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-13" }) @Delete("service-management-entity-13/:id") @Permissions("service-management.serviceManagementEntity13.delete")
  async deleteServiceManagementEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-14" }) @Get("service-management-entity-14") @Permissions("service-management.serviceManagementEntity14.read")
  async listServiceManagementEntity14(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity14(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-14" }) @Get("service-management-entity-14/:id") @Permissions("service-management.serviceManagementEntity14.read")
  async getServiceManagementEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-14" }) @Post("service-management-entity-14") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity14.create")
  async createServiceManagementEntity14(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity14(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-14" }) @Put("service-management-entity-14/:id") @Permissions("service-management.serviceManagementEntity14.update")
  async updateServiceManagementEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity14(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-14" }) @Delete("service-management-entity-14/:id") @Permissions("service-management.serviceManagementEntity14.delete")
  async deleteServiceManagementEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-15" }) @Get("service-management-entity-15") @Permissions("service-management.serviceManagementEntity15.read")
  async listServiceManagementEntity15(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity15(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-15" }) @Get("service-management-entity-15/:id") @Permissions("service-management.serviceManagementEntity15.read")
  async getServiceManagementEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-15" }) @Post("service-management-entity-15") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity15.create")
  async createServiceManagementEntity15(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity15(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-15" }) @Put("service-management-entity-15/:id") @Permissions("service-management.serviceManagementEntity15.update")
  async updateServiceManagementEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity15(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-15" }) @Delete("service-management-entity-15/:id") @Permissions("service-management.serviceManagementEntity15.delete")
  async deleteServiceManagementEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-16" }) @Get("service-management-entity-16") @Permissions("service-management.serviceManagementEntity16.read")
  async listServiceManagementEntity16(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity16(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-16" }) @Get("service-management-entity-16/:id") @Permissions("service-management.serviceManagementEntity16.read")
  async getServiceManagementEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-16" }) @Post("service-management-entity-16") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity16.create")
  async createServiceManagementEntity16(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity16(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-16" }) @Put("service-management-entity-16/:id") @Permissions("service-management.serviceManagementEntity16.update")
  async updateServiceManagementEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity16(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-16" }) @Delete("service-management-entity-16/:id") @Permissions("service-management.serviceManagementEntity16.delete")
  async deleteServiceManagementEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-17" }) @Get("service-management-entity-17") @Permissions("service-management.serviceManagementEntity17.read")
  async listServiceManagementEntity17(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity17(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-17" }) @Get("service-management-entity-17/:id") @Permissions("service-management.serviceManagementEntity17.read")
  async getServiceManagementEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-17" }) @Post("service-management-entity-17") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity17.create")
  async createServiceManagementEntity17(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity17(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-17" }) @Put("service-management-entity-17/:id") @Permissions("service-management.serviceManagementEntity17.update")
  async updateServiceManagementEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity17(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-17" }) @Delete("service-management-entity-17/:id") @Permissions("service-management.serviceManagementEntity17.delete")
  async deleteServiceManagementEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-18" }) @Get("service-management-entity-18") @Permissions("service-management.serviceManagementEntity18.read")
  async listServiceManagementEntity18(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity18(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-18" }) @Get("service-management-entity-18/:id") @Permissions("service-management.serviceManagementEntity18.read")
  async getServiceManagementEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-18" }) @Post("service-management-entity-18") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity18.create")
  async createServiceManagementEntity18(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity18(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-18" }) @Put("service-management-entity-18/:id") @Permissions("service-management.serviceManagementEntity18.update")
  async updateServiceManagementEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity18(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-18" }) @Delete("service-management-entity-18/:id") @Permissions("service-management.serviceManagementEntity18.delete")
  async deleteServiceManagementEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-19" }) @Get("service-management-entity-19") @Permissions("service-management.serviceManagementEntity19.read")
  async listServiceManagementEntity19(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity19(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-19" }) @Get("service-management-entity-19/:id") @Permissions("service-management.serviceManagementEntity19.read")
  async getServiceManagementEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-19" }) @Post("service-management-entity-19") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity19.create")
  async createServiceManagementEntity19(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity19(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-19" }) @Put("service-management-entity-19/:id") @Permissions("service-management.serviceManagementEntity19.update")
  async updateServiceManagementEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity19(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-19" }) @Delete("service-management-entity-19/:id") @Permissions("service-management.serviceManagementEntity19.delete")
  async deleteServiceManagementEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-20" }) @Get("service-management-entity-20") @Permissions("service-management.serviceManagementEntity20.read")
  async listServiceManagementEntity20(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity20(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-20" }) @Get("service-management-entity-20/:id") @Permissions("service-management.serviceManagementEntity20.read")
  async getServiceManagementEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-20" }) @Post("service-management-entity-20") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity20.create")
  async createServiceManagementEntity20(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity20(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-20" }) @Put("service-management-entity-20/:id") @Permissions("service-management.serviceManagementEntity20.update")
  async updateServiceManagementEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity20(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-20" }) @Delete("service-management-entity-20/:id") @Permissions("service-management.serviceManagementEntity20.delete")
  async deleteServiceManagementEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-21" }) @Get("service-management-entity-21") @Permissions("service-management.serviceManagementEntity21.read")
  async listServiceManagementEntity21(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity21(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-21" }) @Get("service-management-entity-21/:id") @Permissions("service-management.serviceManagementEntity21.read")
  async getServiceManagementEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-21" }) @Post("service-management-entity-21") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity21.create")
  async createServiceManagementEntity21(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity21(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-21" }) @Put("service-management-entity-21/:id") @Permissions("service-management.serviceManagementEntity21.update")
  async updateServiceManagementEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity21(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-21" }) @Delete("service-management-entity-21/:id") @Permissions("service-management.serviceManagementEntity21.delete")
  async deleteServiceManagementEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-22" }) @Get("service-management-entity-22") @Permissions("service-management.serviceManagementEntity22.read")
  async listServiceManagementEntity22(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity22(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-22" }) @Get("service-management-entity-22/:id") @Permissions("service-management.serviceManagementEntity22.read")
  async getServiceManagementEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-22" }) @Post("service-management-entity-22") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity22.create")
  async createServiceManagementEntity22(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity22(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-22" }) @Put("service-management-entity-22/:id") @Permissions("service-management.serviceManagementEntity22.update")
  async updateServiceManagementEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity22(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-22" }) @Delete("service-management-entity-22/:id") @Permissions("service-management.serviceManagementEntity22.delete")
  async deleteServiceManagementEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-23" }) @Get("service-management-entity-23") @Permissions("service-management.serviceManagementEntity23.read")
  async listServiceManagementEntity23(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity23(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-23" }) @Get("service-management-entity-23/:id") @Permissions("service-management.serviceManagementEntity23.read")
  async getServiceManagementEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-23" }) @Post("service-management-entity-23") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity23.create")
  async createServiceManagementEntity23(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity23(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-23" }) @Put("service-management-entity-23/:id") @Permissions("service-management.serviceManagementEntity23.update")
  async updateServiceManagementEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity23(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-23" }) @Delete("service-management-entity-23/:id") @Permissions("service-management.serviceManagementEntity23.delete")
  async deleteServiceManagementEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-24" }) @Get("service-management-entity-24") @Permissions("service-management.serviceManagementEntity24.read")
  async listServiceManagementEntity24(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity24(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-24" }) @Get("service-management-entity-24/:id") @Permissions("service-management.serviceManagementEntity24.read")
  async getServiceManagementEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-24" }) @Post("service-management-entity-24") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity24.create")
  async createServiceManagementEntity24(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity24(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-24" }) @Put("service-management-entity-24/:id") @Permissions("service-management.serviceManagementEntity24.update")
  async updateServiceManagementEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity24(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-24" }) @Delete("service-management-entity-24/:id") @Permissions("service-management.serviceManagementEntity24.delete")
  async deleteServiceManagementEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-25" }) @Get("service-management-entity-25") @Permissions("service-management.serviceManagementEntity25.read")
  async listServiceManagementEntity25(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity25(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-25" }) @Get("service-management-entity-25/:id") @Permissions("service-management.serviceManagementEntity25.read")
  async getServiceManagementEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-25" }) @Post("service-management-entity-25") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity25.create")
  async createServiceManagementEntity25(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity25(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-25" }) @Put("service-management-entity-25/:id") @Permissions("service-management.serviceManagementEntity25.update")
  async updateServiceManagementEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity25(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-25" }) @Delete("service-management-entity-25/:id") @Permissions("service-management.serviceManagementEntity25.delete")
  async deleteServiceManagementEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-26" }) @Get("service-management-entity-26") @Permissions("service-management.serviceManagementEntity26.read")
  async listServiceManagementEntity26(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity26(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-26" }) @Get("service-management-entity-26/:id") @Permissions("service-management.serviceManagementEntity26.read")
  async getServiceManagementEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-26" }) @Post("service-management-entity-26") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity26.create")
  async createServiceManagementEntity26(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity26(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-26" }) @Put("service-management-entity-26/:id") @Permissions("service-management.serviceManagementEntity26.update")
  async updateServiceManagementEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity26(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-26" }) @Delete("service-management-entity-26/:id") @Permissions("service-management.serviceManagementEntity26.delete")
  async deleteServiceManagementEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-27" }) @Get("service-management-entity-27") @Permissions("service-management.serviceManagementEntity27.read")
  async listServiceManagementEntity27(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity27(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-27" }) @Get("service-management-entity-27/:id") @Permissions("service-management.serviceManagementEntity27.read")
  async getServiceManagementEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-27" }) @Post("service-management-entity-27") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity27.create")
  async createServiceManagementEntity27(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity27(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-27" }) @Put("service-management-entity-27/:id") @Permissions("service-management.serviceManagementEntity27.update")
  async updateServiceManagementEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity27(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-27" }) @Delete("service-management-entity-27/:id") @Permissions("service-management.serviceManagementEntity27.delete")
  async deleteServiceManagementEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-28" }) @Get("service-management-entity-28") @Permissions("service-management.serviceManagementEntity28.read")
  async listServiceManagementEntity28(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity28(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-28" }) @Get("service-management-entity-28/:id") @Permissions("service-management.serviceManagementEntity28.read")
  async getServiceManagementEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-28" }) @Post("service-management-entity-28") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity28.create")
  async createServiceManagementEntity28(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity28(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-28" }) @Put("service-management-entity-28/:id") @Permissions("service-management.serviceManagementEntity28.update")
  async updateServiceManagementEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity28(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-28" }) @Delete("service-management-entity-28/:id") @Permissions("service-management.serviceManagementEntity28.delete")
  async deleteServiceManagementEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-29" }) @Get("service-management-entity-29") @Permissions("service-management.serviceManagementEntity29.read")
  async listServiceManagementEntity29(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity29(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-29" }) @Get("service-management-entity-29/:id") @Permissions("service-management.serviceManagementEntity29.read")
  async getServiceManagementEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-29" }) @Post("service-management-entity-29") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity29.create")
  async createServiceManagementEntity29(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity29(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-29" }) @Put("service-management-entity-29/:id") @Permissions("service-management.serviceManagementEntity29.update")
  async updateServiceManagementEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity29(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-29" }) @Delete("service-management-entity-29/:id") @Permissions("service-management.serviceManagementEntity29.delete")
  async deleteServiceManagementEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-30" }) @Get("service-management-entity-30") @Permissions("service-management.serviceManagementEntity30.read")
  async listServiceManagementEntity30(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity30(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-30" }) @Get("service-management-entity-30/:id") @Permissions("service-management.serviceManagementEntity30.read")
  async getServiceManagementEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-30" }) @Post("service-management-entity-30") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity30.create")
  async createServiceManagementEntity30(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity30(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-30" }) @Put("service-management-entity-30/:id") @Permissions("service-management.serviceManagementEntity30.update")
  async updateServiceManagementEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity30(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-30" }) @Delete("service-management-entity-30/:id") @Permissions("service-management.serviceManagementEntity30.delete")
  async deleteServiceManagementEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-31" }) @Get("service-management-entity-31") @Permissions("service-management.serviceManagementEntity31.read")
  async listServiceManagementEntity31(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity31(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-31" }) @Get("service-management-entity-31/:id") @Permissions("service-management.serviceManagementEntity31.read")
  async getServiceManagementEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-31" }) @Post("service-management-entity-31") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity31.create")
  async createServiceManagementEntity31(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity31(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-31" }) @Put("service-management-entity-31/:id") @Permissions("service-management.serviceManagementEntity31.update")
  async updateServiceManagementEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity31(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-31" }) @Delete("service-management-entity-31/:id") @Permissions("service-management.serviceManagementEntity31.delete")
  async deleteServiceManagementEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-32" }) @Get("service-management-entity-32") @Permissions("service-management.serviceManagementEntity32.read")
  async listServiceManagementEntity32(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity32(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-32" }) @Get("service-management-entity-32/:id") @Permissions("service-management.serviceManagementEntity32.read")
  async getServiceManagementEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-32" }) @Post("service-management-entity-32") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity32.create")
  async createServiceManagementEntity32(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity32(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-32" }) @Put("service-management-entity-32/:id") @Permissions("service-management.serviceManagementEntity32.update")
  async updateServiceManagementEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity32(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-32" }) @Delete("service-management-entity-32/:id") @Permissions("service-management.serviceManagementEntity32.delete")
  async deleteServiceManagementEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-33" }) @Get("service-management-entity-33") @Permissions("service-management.serviceManagementEntity33.read")
  async listServiceManagementEntity33(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity33(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-33" }) @Get("service-management-entity-33/:id") @Permissions("service-management.serviceManagementEntity33.read")
  async getServiceManagementEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-33" }) @Post("service-management-entity-33") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity33.create")
  async createServiceManagementEntity33(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity33(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-33" }) @Put("service-management-entity-33/:id") @Permissions("service-management.serviceManagementEntity33.update")
  async updateServiceManagementEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity33(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-33" }) @Delete("service-management-entity-33/:id") @Permissions("service-management.serviceManagementEntity33.delete")
  async deleteServiceManagementEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-34" }) @Get("service-management-entity-34") @Permissions("service-management.serviceManagementEntity34.read")
  async listServiceManagementEntity34(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity34(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-34" }) @Get("service-management-entity-34/:id") @Permissions("service-management.serviceManagementEntity34.read")
  async getServiceManagementEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-34" }) @Post("service-management-entity-34") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity34.create")
  async createServiceManagementEntity34(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity34(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-34" }) @Put("service-management-entity-34/:id") @Permissions("service-management.serviceManagementEntity34.update")
  async updateServiceManagementEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity34(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-34" }) @Delete("service-management-entity-34/:id") @Permissions("service-management.serviceManagementEntity34.delete")
  async deleteServiceManagementEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-35" }) @Get("service-management-entity-35") @Permissions("service-management.serviceManagementEntity35.read")
  async listServiceManagementEntity35(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity35(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-35" }) @Get("service-management-entity-35/:id") @Permissions("service-management.serviceManagementEntity35.read")
  async getServiceManagementEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-35" }) @Post("service-management-entity-35") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity35.create")
  async createServiceManagementEntity35(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity35(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-35" }) @Put("service-management-entity-35/:id") @Permissions("service-management.serviceManagementEntity35.update")
  async updateServiceManagementEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity35(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-35" }) @Delete("service-management-entity-35/:id") @Permissions("service-management.serviceManagementEntity35.delete")
  async deleteServiceManagementEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-36" }) @Get("service-management-entity-36") @Permissions("service-management.serviceManagementEntity36.read")
  async listServiceManagementEntity36(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity36(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-36" }) @Get("service-management-entity-36/:id") @Permissions("service-management.serviceManagementEntity36.read")
  async getServiceManagementEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-36" }) @Post("service-management-entity-36") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity36.create")
  async createServiceManagementEntity36(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity36(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-36" }) @Put("service-management-entity-36/:id") @Permissions("service-management.serviceManagementEntity36.update")
  async updateServiceManagementEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity36(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-36" }) @Delete("service-management-entity-36/:id") @Permissions("service-management.serviceManagementEntity36.delete")
  async deleteServiceManagementEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-37" }) @Get("service-management-entity-37") @Permissions("service-management.serviceManagementEntity37.read")
  async listServiceManagementEntity37(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity37(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-37" }) @Get("service-management-entity-37/:id") @Permissions("service-management.serviceManagementEntity37.read")
  async getServiceManagementEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-37" }) @Post("service-management-entity-37") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity37.create")
  async createServiceManagementEntity37(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity37(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-37" }) @Put("service-management-entity-37/:id") @Permissions("service-management.serviceManagementEntity37.update")
  async updateServiceManagementEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity37(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-37" }) @Delete("service-management-entity-37/:id") @Permissions("service-management.serviceManagementEntity37.delete")
  async deleteServiceManagementEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-38" }) @Get("service-management-entity-38") @Permissions("service-management.serviceManagementEntity38.read")
  async listServiceManagementEntity38(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity38(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-38" }) @Get("service-management-entity-38/:id") @Permissions("service-management.serviceManagementEntity38.read")
  async getServiceManagementEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-38" }) @Post("service-management-entity-38") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity38.create")
  async createServiceManagementEntity38(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity38(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-38" }) @Put("service-management-entity-38/:id") @Permissions("service-management.serviceManagementEntity38.update")
  async updateServiceManagementEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity38(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-38" }) @Delete("service-management-entity-38/:id") @Permissions("service-management.serviceManagementEntity38.delete")
  async deleteServiceManagementEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-39" }) @Get("service-management-entity-39") @Permissions("service-management.serviceManagementEntity39.read")
  async listServiceManagementEntity39(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity39(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-39" }) @Get("service-management-entity-39/:id") @Permissions("service-management.serviceManagementEntity39.read")
  async getServiceManagementEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-39" }) @Post("service-management-entity-39") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity39.create")
  async createServiceManagementEntity39(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity39(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-39" }) @Put("service-management-entity-39/:id") @Permissions("service-management.serviceManagementEntity39.update")
  async updateServiceManagementEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity39(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-39" }) @Delete("service-management-entity-39/:id") @Permissions("service-management.serviceManagementEntity39.delete")
  async deleteServiceManagementEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "List service-management-entity-40" }) @Get("service-management-entity-40") @Permissions("service-management.serviceManagementEntity40.read")
  async listServiceManagementEntity40(@Req() req: AuthenticatedRequest) { return this.svc.listServiceManagementEntity40(req.user.tenantId); }

  @ApiOperation({ summary: "Get service-management-entity-40" }) @Get("service-management-entity-40/:id") @Permissions("service-management.serviceManagementEntity40.read")
  async getServiceManagementEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getServiceManagementEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create service-management-entity-40" }) @Post("service-management-entity-40") @HttpCode(HttpStatus.CREATED) @Permissions("service-management.serviceManagementEntity40.create")
  async createServiceManagementEntity40(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createServiceManagementEntity40(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update service-management-entity-40" }) @Put("service-management-entity-40/:id") @Permissions("service-management.serviceManagementEntity40.update")
  async updateServiceManagementEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateServiceManagementEntity40(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete service-management-entity-40" }) @Delete("service-management-entity-40/:id") @Permissions("service-management.serviceManagementEntity40.delete")
  async deleteServiceManagementEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteServiceManagementEntity40(req.user.tenantId, id); }

}
