import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, HttpCode, HttpStatus, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { FixedAssetsGeneratedService } from "./fixed-assets-generated.service";

interface AuthenticatedRequest extends Request { user: { userId: string; tenantId: string; email: string; roles: string[] }; }

@ApiTags("fixed-assets")
@ApiBearerAuth()
@Controller("fixed-assets")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class FixedAssetsGeneratedController {
  constructor(private readonly svc: FixedAssetsGeneratedService) {}

  @ApiOperation({ summary: "List fixed-assets-entity-1" }) @Get("fixed-assets-entity-1") @Permissions("fixed-assets.fixedAssetsEntity1.read")
  async listFixedAssetsEntity1(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity1(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-1" }) @Get("fixed-assets-entity-1/:id") @Permissions("fixed-assets.fixedAssetsEntity1.read")
  async getFixedAssetsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-1" }) @Post("fixed-assets-entity-1") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity1.create")
  async createFixedAssetsEntity1(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity1(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-1" }) @Put("fixed-assets-entity-1/:id") @Permissions("fixed-assets.fixedAssetsEntity1.update")
  async updateFixedAssetsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity1(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-1" }) @Delete("fixed-assets-entity-1/:id") @Permissions("fixed-assets.fixedAssetsEntity1.delete")
  async deleteFixedAssetsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-2" }) @Get("fixed-assets-entity-2") @Permissions("fixed-assets.fixedAssetsEntity2.read")
  async listFixedAssetsEntity2(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity2(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-2" }) @Get("fixed-assets-entity-2/:id") @Permissions("fixed-assets.fixedAssetsEntity2.read")
  async getFixedAssetsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-2" }) @Post("fixed-assets-entity-2") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity2.create")
  async createFixedAssetsEntity2(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity2(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-2" }) @Put("fixed-assets-entity-2/:id") @Permissions("fixed-assets.fixedAssetsEntity2.update")
  async updateFixedAssetsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity2(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-2" }) @Delete("fixed-assets-entity-2/:id") @Permissions("fixed-assets.fixedAssetsEntity2.delete")
  async deleteFixedAssetsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-3" }) @Get("fixed-assets-entity-3") @Permissions("fixed-assets.fixedAssetsEntity3.read")
  async listFixedAssetsEntity3(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity3(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-3" }) @Get("fixed-assets-entity-3/:id") @Permissions("fixed-assets.fixedAssetsEntity3.read")
  async getFixedAssetsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-3" }) @Post("fixed-assets-entity-3") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity3.create")
  async createFixedAssetsEntity3(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity3(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-3" }) @Put("fixed-assets-entity-3/:id") @Permissions("fixed-assets.fixedAssetsEntity3.update")
  async updateFixedAssetsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity3(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-3" }) @Delete("fixed-assets-entity-3/:id") @Permissions("fixed-assets.fixedAssetsEntity3.delete")
  async deleteFixedAssetsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-4" }) @Get("fixed-assets-entity-4") @Permissions("fixed-assets.fixedAssetsEntity4.read")
  async listFixedAssetsEntity4(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity4(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-4" }) @Get("fixed-assets-entity-4/:id") @Permissions("fixed-assets.fixedAssetsEntity4.read")
  async getFixedAssetsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-4" }) @Post("fixed-assets-entity-4") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity4.create")
  async createFixedAssetsEntity4(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity4(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-4" }) @Put("fixed-assets-entity-4/:id") @Permissions("fixed-assets.fixedAssetsEntity4.update")
  async updateFixedAssetsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity4(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-4" }) @Delete("fixed-assets-entity-4/:id") @Permissions("fixed-assets.fixedAssetsEntity4.delete")
  async deleteFixedAssetsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-5" }) @Get("fixed-assets-entity-5") @Permissions("fixed-assets.fixedAssetsEntity5.read")
  async listFixedAssetsEntity5(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity5(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-5" }) @Get("fixed-assets-entity-5/:id") @Permissions("fixed-assets.fixedAssetsEntity5.read")
  async getFixedAssetsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-5" }) @Post("fixed-assets-entity-5") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity5.create")
  async createFixedAssetsEntity5(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity5(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-5" }) @Put("fixed-assets-entity-5/:id") @Permissions("fixed-assets.fixedAssetsEntity5.update")
  async updateFixedAssetsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity5(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-5" }) @Delete("fixed-assets-entity-5/:id") @Permissions("fixed-assets.fixedAssetsEntity5.delete")
  async deleteFixedAssetsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-6" }) @Get("fixed-assets-entity-6") @Permissions("fixed-assets.fixedAssetsEntity6.read")
  async listFixedAssetsEntity6(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity6(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-6" }) @Get("fixed-assets-entity-6/:id") @Permissions("fixed-assets.fixedAssetsEntity6.read")
  async getFixedAssetsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-6" }) @Post("fixed-assets-entity-6") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity6.create")
  async createFixedAssetsEntity6(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity6(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-6" }) @Put("fixed-assets-entity-6/:id") @Permissions("fixed-assets.fixedAssetsEntity6.update")
  async updateFixedAssetsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity6(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-6" }) @Delete("fixed-assets-entity-6/:id") @Permissions("fixed-assets.fixedAssetsEntity6.delete")
  async deleteFixedAssetsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-7" }) @Get("fixed-assets-entity-7") @Permissions("fixed-assets.fixedAssetsEntity7.read")
  async listFixedAssetsEntity7(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity7(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-7" }) @Get("fixed-assets-entity-7/:id") @Permissions("fixed-assets.fixedAssetsEntity7.read")
  async getFixedAssetsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-7" }) @Post("fixed-assets-entity-7") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity7.create")
  async createFixedAssetsEntity7(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity7(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-7" }) @Put("fixed-assets-entity-7/:id") @Permissions("fixed-assets.fixedAssetsEntity7.update")
  async updateFixedAssetsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity7(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-7" }) @Delete("fixed-assets-entity-7/:id") @Permissions("fixed-assets.fixedAssetsEntity7.delete")
  async deleteFixedAssetsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-8" }) @Get("fixed-assets-entity-8") @Permissions("fixed-assets.fixedAssetsEntity8.read")
  async listFixedAssetsEntity8(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity8(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-8" }) @Get("fixed-assets-entity-8/:id") @Permissions("fixed-assets.fixedAssetsEntity8.read")
  async getFixedAssetsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-8" }) @Post("fixed-assets-entity-8") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity8.create")
  async createFixedAssetsEntity8(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity8(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-8" }) @Put("fixed-assets-entity-8/:id") @Permissions("fixed-assets.fixedAssetsEntity8.update")
  async updateFixedAssetsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity8(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-8" }) @Delete("fixed-assets-entity-8/:id") @Permissions("fixed-assets.fixedAssetsEntity8.delete")
  async deleteFixedAssetsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-9" }) @Get("fixed-assets-entity-9") @Permissions("fixed-assets.fixedAssetsEntity9.read")
  async listFixedAssetsEntity9(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity9(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-9" }) @Get("fixed-assets-entity-9/:id") @Permissions("fixed-assets.fixedAssetsEntity9.read")
  async getFixedAssetsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-9" }) @Post("fixed-assets-entity-9") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity9.create")
  async createFixedAssetsEntity9(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity9(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-9" }) @Put("fixed-assets-entity-9/:id") @Permissions("fixed-assets.fixedAssetsEntity9.update")
  async updateFixedAssetsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity9(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-9" }) @Delete("fixed-assets-entity-9/:id") @Permissions("fixed-assets.fixedAssetsEntity9.delete")
  async deleteFixedAssetsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-10" }) @Get("fixed-assets-entity-10") @Permissions("fixed-assets.fixedAssetsEntity10.read")
  async listFixedAssetsEntity10(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity10(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-10" }) @Get("fixed-assets-entity-10/:id") @Permissions("fixed-assets.fixedAssetsEntity10.read")
  async getFixedAssetsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-10" }) @Post("fixed-assets-entity-10") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity10.create")
  async createFixedAssetsEntity10(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity10(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-10" }) @Put("fixed-assets-entity-10/:id") @Permissions("fixed-assets.fixedAssetsEntity10.update")
  async updateFixedAssetsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity10(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-10" }) @Delete("fixed-assets-entity-10/:id") @Permissions("fixed-assets.fixedAssetsEntity10.delete")
  async deleteFixedAssetsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-11" }) @Get("fixed-assets-entity-11") @Permissions("fixed-assets.fixedAssetsEntity11.read")
  async listFixedAssetsEntity11(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity11(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-11" }) @Get("fixed-assets-entity-11/:id") @Permissions("fixed-assets.fixedAssetsEntity11.read")
  async getFixedAssetsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-11" }) @Post("fixed-assets-entity-11") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity11.create")
  async createFixedAssetsEntity11(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity11(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-11" }) @Put("fixed-assets-entity-11/:id") @Permissions("fixed-assets.fixedAssetsEntity11.update")
  async updateFixedAssetsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity11(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-11" }) @Delete("fixed-assets-entity-11/:id") @Permissions("fixed-assets.fixedAssetsEntity11.delete")
  async deleteFixedAssetsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-12" }) @Get("fixed-assets-entity-12") @Permissions("fixed-assets.fixedAssetsEntity12.read")
  async listFixedAssetsEntity12(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity12(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-12" }) @Get("fixed-assets-entity-12/:id") @Permissions("fixed-assets.fixedAssetsEntity12.read")
  async getFixedAssetsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-12" }) @Post("fixed-assets-entity-12") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity12.create")
  async createFixedAssetsEntity12(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity12(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-12" }) @Put("fixed-assets-entity-12/:id") @Permissions("fixed-assets.fixedAssetsEntity12.update")
  async updateFixedAssetsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity12(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-12" }) @Delete("fixed-assets-entity-12/:id") @Permissions("fixed-assets.fixedAssetsEntity12.delete")
  async deleteFixedAssetsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-13" }) @Get("fixed-assets-entity-13") @Permissions("fixed-assets.fixedAssetsEntity13.read")
  async listFixedAssetsEntity13(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity13(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-13" }) @Get("fixed-assets-entity-13/:id") @Permissions("fixed-assets.fixedAssetsEntity13.read")
  async getFixedAssetsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-13" }) @Post("fixed-assets-entity-13") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity13.create")
  async createFixedAssetsEntity13(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity13(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-13" }) @Put("fixed-assets-entity-13/:id") @Permissions("fixed-assets.fixedAssetsEntity13.update")
  async updateFixedAssetsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity13(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-13" }) @Delete("fixed-assets-entity-13/:id") @Permissions("fixed-assets.fixedAssetsEntity13.delete")
  async deleteFixedAssetsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-14" }) @Get("fixed-assets-entity-14") @Permissions("fixed-assets.fixedAssetsEntity14.read")
  async listFixedAssetsEntity14(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity14(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-14" }) @Get("fixed-assets-entity-14/:id") @Permissions("fixed-assets.fixedAssetsEntity14.read")
  async getFixedAssetsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-14" }) @Post("fixed-assets-entity-14") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity14.create")
  async createFixedAssetsEntity14(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity14(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-14" }) @Put("fixed-assets-entity-14/:id") @Permissions("fixed-assets.fixedAssetsEntity14.update")
  async updateFixedAssetsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity14(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-14" }) @Delete("fixed-assets-entity-14/:id") @Permissions("fixed-assets.fixedAssetsEntity14.delete")
  async deleteFixedAssetsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-15" }) @Get("fixed-assets-entity-15") @Permissions("fixed-assets.fixedAssetsEntity15.read")
  async listFixedAssetsEntity15(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity15(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-15" }) @Get("fixed-assets-entity-15/:id") @Permissions("fixed-assets.fixedAssetsEntity15.read")
  async getFixedAssetsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-15" }) @Post("fixed-assets-entity-15") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity15.create")
  async createFixedAssetsEntity15(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity15(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-15" }) @Put("fixed-assets-entity-15/:id") @Permissions("fixed-assets.fixedAssetsEntity15.update")
  async updateFixedAssetsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity15(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-15" }) @Delete("fixed-assets-entity-15/:id") @Permissions("fixed-assets.fixedAssetsEntity15.delete")
  async deleteFixedAssetsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-16" }) @Get("fixed-assets-entity-16") @Permissions("fixed-assets.fixedAssetsEntity16.read")
  async listFixedAssetsEntity16(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity16(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-16" }) @Get("fixed-assets-entity-16/:id") @Permissions("fixed-assets.fixedAssetsEntity16.read")
  async getFixedAssetsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-16" }) @Post("fixed-assets-entity-16") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity16.create")
  async createFixedAssetsEntity16(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity16(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-16" }) @Put("fixed-assets-entity-16/:id") @Permissions("fixed-assets.fixedAssetsEntity16.update")
  async updateFixedAssetsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity16(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-16" }) @Delete("fixed-assets-entity-16/:id") @Permissions("fixed-assets.fixedAssetsEntity16.delete")
  async deleteFixedAssetsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-17" }) @Get("fixed-assets-entity-17") @Permissions("fixed-assets.fixedAssetsEntity17.read")
  async listFixedAssetsEntity17(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity17(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-17" }) @Get("fixed-assets-entity-17/:id") @Permissions("fixed-assets.fixedAssetsEntity17.read")
  async getFixedAssetsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-17" }) @Post("fixed-assets-entity-17") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity17.create")
  async createFixedAssetsEntity17(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity17(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-17" }) @Put("fixed-assets-entity-17/:id") @Permissions("fixed-assets.fixedAssetsEntity17.update")
  async updateFixedAssetsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity17(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-17" }) @Delete("fixed-assets-entity-17/:id") @Permissions("fixed-assets.fixedAssetsEntity17.delete")
  async deleteFixedAssetsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-18" }) @Get("fixed-assets-entity-18") @Permissions("fixed-assets.fixedAssetsEntity18.read")
  async listFixedAssetsEntity18(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity18(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-18" }) @Get("fixed-assets-entity-18/:id") @Permissions("fixed-assets.fixedAssetsEntity18.read")
  async getFixedAssetsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-18" }) @Post("fixed-assets-entity-18") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity18.create")
  async createFixedAssetsEntity18(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity18(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-18" }) @Put("fixed-assets-entity-18/:id") @Permissions("fixed-assets.fixedAssetsEntity18.update")
  async updateFixedAssetsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity18(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-18" }) @Delete("fixed-assets-entity-18/:id") @Permissions("fixed-assets.fixedAssetsEntity18.delete")
  async deleteFixedAssetsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-19" }) @Get("fixed-assets-entity-19") @Permissions("fixed-assets.fixedAssetsEntity19.read")
  async listFixedAssetsEntity19(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity19(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-19" }) @Get("fixed-assets-entity-19/:id") @Permissions("fixed-assets.fixedAssetsEntity19.read")
  async getFixedAssetsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-19" }) @Post("fixed-assets-entity-19") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity19.create")
  async createFixedAssetsEntity19(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity19(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-19" }) @Put("fixed-assets-entity-19/:id") @Permissions("fixed-assets.fixedAssetsEntity19.update")
  async updateFixedAssetsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity19(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-19" }) @Delete("fixed-assets-entity-19/:id") @Permissions("fixed-assets.fixedAssetsEntity19.delete")
  async deleteFixedAssetsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-20" }) @Get("fixed-assets-entity-20") @Permissions("fixed-assets.fixedAssetsEntity20.read")
  async listFixedAssetsEntity20(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity20(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-20" }) @Get("fixed-assets-entity-20/:id") @Permissions("fixed-assets.fixedAssetsEntity20.read")
  async getFixedAssetsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-20" }) @Post("fixed-assets-entity-20") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity20.create")
  async createFixedAssetsEntity20(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity20(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-20" }) @Put("fixed-assets-entity-20/:id") @Permissions("fixed-assets.fixedAssetsEntity20.update")
  async updateFixedAssetsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity20(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-20" }) @Delete("fixed-assets-entity-20/:id") @Permissions("fixed-assets.fixedAssetsEntity20.delete")
  async deleteFixedAssetsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-21" }) @Get("fixed-assets-entity-21") @Permissions("fixed-assets.fixedAssetsEntity21.read")
  async listFixedAssetsEntity21(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity21(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-21" }) @Get("fixed-assets-entity-21/:id") @Permissions("fixed-assets.fixedAssetsEntity21.read")
  async getFixedAssetsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-21" }) @Post("fixed-assets-entity-21") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity21.create")
  async createFixedAssetsEntity21(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity21(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-21" }) @Put("fixed-assets-entity-21/:id") @Permissions("fixed-assets.fixedAssetsEntity21.update")
  async updateFixedAssetsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity21(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-21" }) @Delete("fixed-assets-entity-21/:id") @Permissions("fixed-assets.fixedAssetsEntity21.delete")
  async deleteFixedAssetsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-22" }) @Get("fixed-assets-entity-22") @Permissions("fixed-assets.fixedAssetsEntity22.read")
  async listFixedAssetsEntity22(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity22(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-22" }) @Get("fixed-assets-entity-22/:id") @Permissions("fixed-assets.fixedAssetsEntity22.read")
  async getFixedAssetsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-22" }) @Post("fixed-assets-entity-22") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity22.create")
  async createFixedAssetsEntity22(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity22(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-22" }) @Put("fixed-assets-entity-22/:id") @Permissions("fixed-assets.fixedAssetsEntity22.update")
  async updateFixedAssetsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity22(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-22" }) @Delete("fixed-assets-entity-22/:id") @Permissions("fixed-assets.fixedAssetsEntity22.delete")
  async deleteFixedAssetsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-23" }) @Get("fixed-assets-entity-23") @Permissions("fixed-assets.fixedAssetsEntity23.read")
  async listFixedAssetsEntity23(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity23(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-23" }) @Get("fixed-assets-entity-23/:id") @Permissions("fixed-assets.fixedAssetsEntity23.read")
  async getFixedAssetsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-23" }) @Post("fixed-assets-entity-23") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity23.create")
  async createFixedAssetsEntity23(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity23(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-23" }) @Put("fixed-assets-entity-23/:id") @Permissions("fixed-assets.fixedAssetsEntity23.update")
  async updateFixedAssetsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity23(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-23" }) @Delete("fixed-assets-entity-23/:id") @Permissions("fixed-assets.fixedAssetsEntity23.delete")
  async deleteFixedAssetsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-24" }) @Get("fixed-assets-entity-24") @Permissions("fixed-assets.fixedAssetsEntity24.read")
  async listFixedAssetsEntity24(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity24(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-24" }) @Get("fixed-assets-entity-24/:id") @Permissions("fixed-assets.fixedAssetsEntity24.read")
  async getFixedAssetsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-24" }) @Post("fixed-assets-entity-24") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity24.create")
  async createFixedAssetsEntity24(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity24(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-24" }) @Put("fixed-assets-entity-24/:id") @Permissions("fixed-assets.fixedAssetsEntity24.update")
  async updateFixedAssetsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity24(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-24" }) @Delete("fixed-assets-entity-24/:id") @Permissions("fixed-assets.fixedAssetsEntity24.delete")
  async deleteFixedAssetsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-25" }) @Get("fixed-assets-entity-25") @Permissions("fixed-assets.fixedAssetsEntity25.read")
  async listFixedAssetsEntity25(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity25(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-25" }) @Get("fixed-assets-entity-25/:id") @Permissions("fixed-assets.fixedAssetsEntity25.read")
  async getFixedAssetsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-25" }) @Post("fixed-assets-entity-25") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity25.create")
  async createFixedAssetsEntity25(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity25(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-25" }) @Put("fixed-assets-entity-25/:id") @Permissions("fixed-assets.fixedAssetsEntity25.update")
  async updateFixedAssetsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity25(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-25" }) @Delete("fixed-assets-entity-25/:id") @Permissions("fixed-assets.fixedAssetsEntity25.delete")
  async deleteFixedAssetsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-26" }) @Get("fixed-assets-entity-26") @Permissions("fixed-assets.fixedAssetsEntity26.read")
  async listFixedAssetsEntity26(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity26(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-26" }) @Get("fixed-assets-entity-26/:id") @Permissions("fixed-assets.fixedAssetsEntity26.read")
  async getFixedAssetsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-26" }) @Post("fixed-assets-entity-26") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity26.create")
  async createFixedAssetsEntity26(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity26(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-26" }) @Put("fixed-assets-entity-26/:id") @Permissions("fixed-assets.fixedAssetsEntity26.update")
  async updateFixedAssetsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity26(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-26" }) @Delete("fixed-assets-entity-26/:id") @Permissions("fixed-assets.fixedAssetsEntity26.delete")
  async deleteFixedAssetsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-27" }) @Get("fixed-assets-entity-27") @Permissions("fixed-assets.fixedAssetsEntity27.read")
  async listFixedAssetsEntity27(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity27(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-27" }) @Get("fixed-assets-entity-27/:id") @Permissions("fixed-assets.fixedAssetsEntity27.read")
  async getFixedAssetsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-27" }) @Post("fixed-assets-entity-27") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity27.create")
  async createFixedAssetsEntity27(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity27(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-27" }) @Put("fixed-assets-entity-27/:id") @Permissions("fixed-assets.fixedAssetsEntity27.update")
  async updateFixedAssetsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity27(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-27" }) @Delete("fixed-assets-entity-27/:id") @Permissions("fixed-assets.fixedAssetsEntity27.delete")
  async deleteFixedAssetsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-28" }) @Get("fixed-assets-entity-28") @Permissions("fixed-assets.fixedAssetsEntity28.read")
  async listFixedAssetsEntity28(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity28(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-28" }) @Get("fixed-assets-entity-28/:id") @Permissions("fixed-assets.fixedAssetsEntity28.read")
  async getFixedAssetsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-28" }) @Post("fixed-assets-entity-28") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity28.create")
  async createFixedAssetsEntity28(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity28(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-28" }) @Put("fixed-assets-entity-28/:id") @Permissions("fixed-assets.fixedAssetsEntity28.update")
  async updateFixedAssetsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity28(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-28" }) @Delete("fixed-assets-entity-28/:id") @Permissions("fixed-assets.fixedAssetsEntity28.delete")
  async deleteFixedAssetsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-29" }) @Get("fixed-assets-entity-29") @Permissions("fixed-assets.fixedAssetsEntity29.read")
  async listFixedAssetsEntity29(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity29(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-29" }) @Get("fixed-assets-entity-29/:id") @Permissions("fixed-assets.fixedAssetsEntity29.read")
  async getFixedAssetsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-29" }) @Post("fixed-assets-entity-29") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity29.create")
  async createFixedAssetsEntity29(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity29(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-29" }) @Put("fixed-assets-entity-29/:id") @Permissions("fixed-assets.fixedAssetsEntity29.update")
  async updateFixedAssetsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity29(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-29" }) @Delete("fixed-assets-entity-29/:id") @Permissions("fixed-assets.fixedAssetsEntity29.delete")
  async deleteFixedAssetsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-30" }) @Get("fixed-assets-entity-30") @Permissions("fixed-assets.fixedAssetsEntity30.read")
  async listFixedAssetsEntity30(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity30(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-30" }) @Get("fixed-assets-entity-30/:id") @Permissions("fixed-assets.fixedAssetsEntity30.read")
  async getFixedAssetsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-30" }) @Post("fixed-assets-entity-30") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity30.create")
  async createFixedAssetsEntity30(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity30(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-30" }) @Put("fixed-assets-entity-30/:id") @Permissions("fixed-assets.fixedAssetsEntity30.update")
  async updateFixedAssetsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity30(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-30" }) @Delete("fixed-assets-entity-30/:id") @Permissions("fixed-assets.fixedAssetsEntity30.delete")
  async deleteFixedAssetsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-31" }) @Get("fixed-assets-entity-31") @Permissions("fixed-assets.fixedAssetsEntity31.read")
  async listFixedAssetsEntity31(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity31(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-31" }) @Get("fixed-assets-entity-31/:id") @Permissions("fixed-assets.fixedAssetsEntity31.read")
  async getFixedAssetsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-31" }) @Post("fixed-assets-entity-31") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity31.create")
  async createFixedAssetsEntity31(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity31(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-31" }) @Put("fixed-assets-entity-31/:id") @Permissions("fixed-assets.fixedAssetsEntity31.update")
  async updateFixedAssetsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity31(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-31" }) @Delete("fixed-assets-entity-31/:id") @Permissions("fixed-assets.fixedAssetsEntity31.delete")
  async deleteFixedAssetsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-32" }) @Get("fixed-assets-entity-32") @Permissions("fixed-assets.fixedAssetsEntity32.read")
  async listFixedAssetsEntity32(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity32(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-32" }) @Get("fixed-assets-entity-32/:id") @Permissions("fixed-assets.fixedAssetsEntity32.read")
  async getFixedAssetsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-32" }) @Post("fixed-assets-entity-32") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity32.create")
  async createFixedAssetsEntity32(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity32(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-32" }) @Put("fixed-assets-entity-32/:id") @Permissions("fixed-assets.fixedAssetsEntity32.update")
  async updateFixedAssetsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity32(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-32" }) @Delete("fixed-assets-entity-32/:id") @Permissions("fixed-assets.fixedAssetsEntity32.delete")
  async deleteFixedAssetsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-33" }) @Get("fixed-assets-entity-33") @Permissions("fixed-assets.fixedAssetsEntity33.read")
  async listFixedAssetsEntity33(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity33(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-33" }) @Get("fixed-assets-entity-33/:id") @Permissions("fixed-assets.fixedAssetsEntity33.read")
  async getFixedAssetsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-33" }) @Post("fixed-assets-entity-33") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity33.create")
  async createFixedAssetsEntity33(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity33(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-33" }) @Put("fixed-assets-entity-33/:id") @Permissions("fixed-assets.fixedAssetsEntity33.update")
  async updateFixedAssetsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity33(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-33" }) @Delete("fixed-assets-entity-33/:id") @Permissions("fixed-assets.fixedAssetsEntity33.delete")
  async deleteFixedAssetsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-34" }) @Get("fixed-assets-entity-34") @Permissions("fixed-assets.fixedAssetsEntity34.read")
  async listFixedAssetsEntity34(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity34(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-34" }) @Get("fixed-assets-entity-34/:id") @Permissions("fixed-assets.fixedAssetsEntity34.read")
  async getFixedAssetsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-34" }) @Post("fixed-assets-entity-34") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity34.create")
  async createFixedAssetsEntity34(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity34(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-34" }) @Put("fixed-assets-entity-34/:id") @Permissions("fixed-assets.fixedAssetsEntity34.update")
  async updateFixedAssetsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity34(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-34" }) @Delete("fixed-assets-entity-34/:id") @Permissions("fixed-assets.fixedAssetsEntity34.delete")
  async deleteFixedAssetsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-35" }) @Get("fixed-assets-entity-35") @Permissions("fixed-assets.fixedAssetsEntity35.read")
  async listFixedAssetsEntity35(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity35(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-35" }) @Get("fixed-assets-entity-35/:id") @Permissions("fixed-assets.fixedAssetsEntity35.read")
  async getFixedAssetsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-35" }) @Post("fixed-assets-entity-35") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity35.create")
  async createFixedAssetsEntity35(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity35(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-35" }) @Put("fixed-assets-entity-35/:id") @Permissions("fixed-assets.fixedAssetsEntity35.update")
  async updateFixedAssetsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity35(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-35" }) @Delete("fixed-assets-entity-35/:id") @Permissions("fixed-assets.fixedAssetsEntity35.delete")
  async deleteFixedAssetsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-36" }) @Get("fixed-assets-entity-36") @Permissions("fixed-assets.fixedAssetsEntity36.read")
  async listFixedAssetsEntity36(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity36(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-36" }) @Get("fixed-assets-entity-36/:id") @Permissions("fixed-assets.fixedAssetsEntity36.read")
  async getFixedAssetsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-36" }) @Post("fixed-assets-entity-36") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity36.create")
  async createFixedAssetsEntity36(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity36(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-36" }) @Put("fixed-assets-entity-36/:id") @Permissions("fixed-assets.fixedAssetsEntity36.update")
  async updateFixedAssetsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity36(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-36" }) @Delete("fixed-assets-entity-36/:id") @Permissions("fixed-assets.fixedAssetsEntity36.delete")
  async deleteFixedAssetsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-37" }) @Get("fixed-assets-entity-37") @Permissions("fixed-assets.fixedAssetsEntity37.read")
  async listFixedAssetsEntity37(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity37(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-37" }) @Get("fixed-assets-entity-37/:id") @Permissions("fixed-assets.fixedAssetsEntity37.read")
  async getFixedAssetsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-37" }) @Post("fixed-assets-entity-37") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity37.create")
  async createFixedAssetsEntity37(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity37(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-37" }) @Put("fixed-assets-entity-37/:id") @Permissions("fixed-assets.fixedAssetsEntity37.update")
  async updateFixedAssetsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity37(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-37" }) @Delete("fixed-assets-entity-37/:id") @Permissions("fixed-assets.fixedAssetsEntity37.delete")
  async deleteFixedAssetsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-38" }) @Get("fixed-assets-entity-38") @Permissions("fixed-assets.fixedAssetsEntity38.read")
  async listFixedAssetsEntity38(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity38(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-38" }) @Get("fixed-assets-entity-38/:id") @Permissions("fixed-assets.fixedAssetsEntity38.read")
  async getFixedAssetsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-38" }) @Post("fixed-assets-entity-38") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity38.create")
  async createFixedAssetsEntity38(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity38(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-38" }) @Put("fixed-assets-entity-38/:id") @Permissions("fixed-assets.fixedAssetsEntity38.update")
  async updateFixedAssetsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity38(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-38" }) @Delete("fixed-assets-entity-38/:id") @Permissions("fixed-assets.fixedAssetsEntity38.delete")
  async deleteFixedAssetsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-39" }) @Get("fixed-assets-entity-39") @Permissions("fixed-assets.fixedAssetsEntity39.read")
  async listFixedAssetsEntity39(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity39(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-39" }) @Get("fixed-assets-entity-39/:id") @Permissions("fixed-assets.fixedAssetsEntity39.read")
  async getFixedAssetsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-39" }) @Post("fixed-assets-entity-39") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity39.create")
  async createFixedAssetsEntity39(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity39(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-39" }) @Put("fixed-assets-entity-39/:id") @Permissions("fixed-assets.fixedAssetsEntity39.update")
  async updateFixedAssetsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity39(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-39" }) @Delete("fixed-assets-entity-39/:id") @Permissions("fixed-assets.fixedAssetsEntity39.delete")
  async deleteFixedAssetsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-40" }) @Get("fixed-assets-entity-40") @Permissions("fixed-assets.fixedAssetsEntity40.read")
  async listFixedAssetsEntity40(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity40(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-40" }) @Get("fixed-assets-entity-40/:id") @Permissions("fixed-assets.fixedAssetsEntity40.read")
  async getFixedAssetsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-40" }) @Post("fixed-assets-entity-40") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity40.create")
  async createFixedAssetsEntity40(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity40(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-40" }) @Put("fixed-assets-entity-40/:id") @Permissions("fixed-assets.fixedAssetsEntity40.update")
  async updateFixedAssetsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity40(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-40" }) @Delete("fixed-assets-entity-40/:id") @Permissions("fixed-assets.fixedAssetsEntity40.delete")
  async deleteFixedAssetsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-41" }) @Get("fixed-assets-entity-41") @Permissions("fixed-assets.fixedAssetsEntity41.read")
  async listFixedAssetsEntity41(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity41(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-41" }) @Get("fixed-assets-entity-41/:id") @Permissions("fixed-assets.fixedAssetsEntity41.read")
  async getFixedAssetsEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-41" }) @Post("fixed-assets-entity-41") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity41.create")
  async createFixedAssetsEntity41(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity41(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-41" }) @Put("fixed-assets-entity-41/:id") @Permissions("fixed-assets.fixedAssetsEntity41.update")
  async updateFixedAssetsEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity41(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-41" }) @Delete("fixed-assets-entity-41/:id") @Permissions("fixed-assets.fixedAssetsEntity41.delete")
  async deleteFixedAssetsEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-42" }) @Get("fixed-assets-entity-42") @Permissions("fixed-assets.fixedAssetsEntity42.read")
  async listFixedAssetsEntity42(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity42(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-42" }) @Get("fixed-assets-entity-42/:id") @Permissions("fixed-assets.fixedAssetsEntity42.read")
  async getFixedAssetsEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-42" }) @Post("fixed-assets-entity-42") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity42.create")
  async createFixedAssetsEntity42(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity42(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-42" }) @Put("fixed-assets-entity-42/:id") @Permissions("fixed-assets.fixedAssetsEntity42.update")
  async updateFixedAssetsEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity42(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-42" }) @Delete("fixed-assets-entity-42/:id") @Permissions("fixed-assets.fixedAssetsEntity42.delete")
  async deleteFixedAssetsEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-43" }) @Get("fixed-assets-entity-43") @Permissions("fixed-assets.fixedAssetsEntity43.read")
  async listFixedAssetsEntity43(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity43(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-43" }) @Get("fixed-assets-entity-43/:id") @Permissions("fixed-assets.fixedAssetsEntity43.read")
  async getFixedAssetsEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-43" }) @Post("fixed-assets-entity-43") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity43.create")
  async createFixedAssetsEntity43(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity43(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-43" }) @Put("fixed-assets-entity-43/:id") @Permissions("fixed-assets.fixedAssetsEntity43.update")
  async updateFixedAssetsEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity43(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-43" }) @Delete("fixed-assets-entity-43/:id") @Permissions("fixed-assets.fixedAssetsEntity43.delete")
  async deleteFixedAssetsEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-44" }) @Get("fixed-assets-entity-44") @Permissions("fixed-assets.fixedAssetsEntity44.read")
  async listFixedAssetsEntity44(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity44(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-44" }) @Get("fixed-assets-entity-44/:id") @Permissions("fixed-assets.fixedAssetsEntity44.read")
  async getFixedAssetsEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-44" }) @Post("fixed-assets-entity-44") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity44.create")
  async createFixedAssetsEntity44(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity44(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-44" }) @Put("fixed-assets-entity-44/:id") @Permissions("fixed-assets.fixedAssetsEntity44.update")
  async updateFixedAssetsEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity44(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-44" }) @Delete("fixed-assets-entity-44/:id") @Permissions("fixed-assets.fixedAssetsEntity44.delete")
  async deleteFixedAssetsEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "List fixed-assets-entity-45" }) @Get("fixed-assets-entity-45") @Permissions("fixed-assets.fixedAssetsEntity45.read")
  async listFixedAssetsEntity45(@Req() req: AuthenticatedRequest) { return this.svc.listFixedAssetsEntity45(req.user.tenantId); }

  @ApiOperation({ summary: "Get fixed-assets-entity-45" }) @Get("fixed-assets-entity-45/:id") @Permissions("fixed-assets.fixedAssetsEntity45.read")
  async getFixedAssetsEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getFixedAssetsEntity45(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create fixed-assets-entity-45" }) @Post("fixed-assets-entity-45") @HttpCode(HttpStatus.CREATED) @Permissions("fixed-assets.fixedAssetsEntity45.create")
  async createFixedAssetsEntity45(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createFixedAssetsEntity45(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update fixed-assets-entity-45" }) @Put("fixed-assets-entity-45/:id") @Permissions("fixed-assets.fixedAssetsEntity45.update")
  async updateFixedAssetsEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateFixedAssetsEntity45(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete fixed-assets-entity-45" }) @Delete("fixed-assets-entity-45/:id") @Permissions("fixed-assets.fixedAssetsEntity45.delete")
  async deleteFixedAssetsEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteFixedAssetsEntity45(req.user.tenantId, id); }

}
