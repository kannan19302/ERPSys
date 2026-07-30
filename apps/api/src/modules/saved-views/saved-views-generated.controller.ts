import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, HttpCode, HttpStatus, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SavedViewsGeneratedService } from "./saved-views-generated.service";

interface AuthenticatedRequest extends Request { user: { userId: string; tenantId: string; email: string; roles: string[] }; }

@ApiTags("saved-views")
@ApiBearerAuth()
@Controller("saved-views")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SavedViewsGeneratedController {
  constructor(private readonly svc: SavedViewsGeneratedService) {}

  @ApiOperation({ summary: "List saved-views-entity-1" }) @Get("saved-views-entity-1") @Permissions("saved-views.savedViewsEntity1.read")
  async listSavedViewsEntity1(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity1(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-1" }) @Get("saved-views-entity-1/:id") @Permissions("saved-views.savedViewsEntity1.read")
  async getSavedViewsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-1" }) @Post("saved-views-entity-1") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity1.create")
  async createSavedViewsEntity1(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity1(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-1" }) @Put("saved-views-entity-1/:id") @Permissions("saved-views.savedViewsEntity1.update")
  async updateSavedViewsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity1(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-1" }) @Delete("saved-views-entity-1/:id") @Permissions("saved-views.savedViewsEntity1.delete")
  async deleteSavedViewsEntity1(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity1(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-2" }) @Get("saved-views-entity-2") @Permissions("saved-views.savedViewsEntity2.read")
  async listSavedViewsEntity2(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity2(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-2" }) @Get("saved-views-entity-2/:id") @Permissions("saved-views.savedViewsEntity2.read")
  async getSavedViewsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-2" }) @Post("saved-views-entity-2") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity2.create")
  async createSavedViewsEntity2(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity2(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-2" }) @Put("saved-views-entity-2/:id") @Permissions("saved-views.savedViewsEntity2.update")
  async updateSavedViewsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity2(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-2" }) @Delete("saved-views-entity-2/:id") @Permissions("saved-views.savedViewsEntity2.delete")
  async deleteSavedViewsEntity2(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity2(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-3" }) @Get("saved-views-entity-3") @Permissions("saved-views.savedViewsEntity3.read")
  async listSavedViewsEntity3(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity3(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-3" }) @Get("saved-views-entity-3/:id") @Permissions("saved-views.savedViewsEntity3.read")
  async getSavedViewsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-3" }) @Post("saved-views-entity-3") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity3.create")
  async createSavedViewsEntity3(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity3(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-3" }) @Put("saved-views-entity-3/:id") @Permissions("saved-views.savedViewsEntity3.update")
  async updateSavedViewsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity3(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-3" }) @Delete("saved-views-entity-3/:id") @Permissions("saved-views.savedViewsEntity3.delete")
  async deleteSavedViewsEntity3(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity3(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-4" }) @Get("saved-views-entity-4") @Permissions("saved-views.savedViewsEntity4.read")
  async listSavedViewsEntity4(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity4(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-4" }) @Get("saved-views-entity-4/:id") @Permissions("saved-views.savedViewsEntity4.read")
  async getSavedViewsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-4" }) @Post("saved-views-entity-4") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity4.create")
  async createSavedViewsEntity4(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity4(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-4" }) @Put("saved-views-entity-4/:id") @Permissions("saved-views.savedViewsEntity4.update")
  async updateSavedViewsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity4(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-4" }) @Delete("saved-views-entity-4/:id") @Permissions("saved-views.savedViewsEntity4.delete")
  async deleteSavedViewsEntity4(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity4(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-5" }) @Get("saved-views-entity-5") @Permissions("saved-views.savedViewsEntity5.read")
  async listSavedViewsEntity5(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity5(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-5" }) @Get("saved-views-entity-5/:id") @Permissions("saved-views.savedViewsEntity5.read")
  async getSavedViewsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-5" }) @Post("saved-views-entity-5") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity5.create")
  async createSavedViewsEntity5(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity5(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-5" }) @Put("saved-views-entity-5/:id") @Permissions("saved-views.savedViewsEntity5.update")
  async updateSavedViewsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity5(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-5" }) @Delete("saved-views-entity-5/:id") @Permissions("saved-views.savedViewsEntity5.delete")
  async deleteSavedViewsEntity5(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity5(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-6" }) @Get("saved-views-entity-6") @Permissions("saved-views.savedViewsEntity6.read")
  async listSavedViewsEntity6(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity6(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-6" }) @Get("saved-views-entity-6/:id") @Permissions("saved-views.savedViewsEntity6.read")
  async getSavedViewsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-6" }) @Post("saved-views-entity-6") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity6.create")
  async createSavedViewsEntity6(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity6(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-6" }) @Put("saved-views-entity-6/:id") @Permissions("saved-views.savedViewsEntity6.update")
  async updateSavedViewsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity6(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-6" }) @Delete("saved-views-entity-6/:id") @Permissions("saved-views.savedViewsEntity6.delete")
  async deleteSavedViewsEntity6(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity6(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-7" }) @Get("saved-views-entity-7") @Permissions("saved-views.savedViewsEntity7.read")
  async listSavedViewsEntity7(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity7(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-7" }) @Get("saved-views-entity-7/:id") @Permissions("saved-views.savedViewsEntity7.read")
  async getSavedViewsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-7" }) @Post("saved-views-entity-7") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity7.create")
  async createSavedViewsEntity7(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity7(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-7" }) @Put("saved-views-entity-7/:id") @Permissions("saved-views.savedViewsEntity7.update")
  async updateSavedViewsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity7(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-7" }) @Delete("saved-views-entity-7/:id") @Permissions("saved-views.savedViewsEntity7.delete")
  async deleteSavedViewsEntity7(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity7(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-8" }) @Get("saved-views-entity-8") @Permissions("saved-views.savedViewsEntity8.read")
  async listSavedViewsEntity8(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity8(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-8" }) @Get("saved-views-entity-8/:id") @Permissions("saved-views.savedViewsEntity8.read")
  async getSavedViewsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-8" }) @Post("saved-views-entity-8") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity8.create")
  async createSavedViewsEntity8(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity8(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-8" }) @Put("saved-views-entity-8/:id") @Permissions("saved-views.savedViewsEntity8.update")
  async updateSavedViewsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity8(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-8" }) @Delete("saved-views-entity-8/:id") @Permissions("saved-views.savedViewsEntity8.delete")
  async deleteSavedViewsEntity8(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity8(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-9" }) @Get("saved-views-entity-9") @Permissions("saved-views.savedViewsEntity9.read")
  async listSavedViewsEntity9(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity9(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-9" }) @Get("saved-views-entity-9/:id") @Permissions("saved-views.savedViewsEntity9.read")
  async getSavedViewsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-9" }) @Post("saved-views-entity-9") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity9.create")
  async createSavedViewsEntity9(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity9(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-9" }) @Put("saved-views-entity-9/:id") @Permissions("saved-views.savedViewsEntity9.update")
  async updateSavedViewsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity9(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-9" }) @Delete("saved-views-entity-9/:id") @Permissions("saved-views.savedViewsEntity9.delete")
  async deleteSavedViewsEntity9(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity9(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-10" }) @Get("saved-views-entity-10") @Permissions("saved-views.savedViewsEntity10.read")
  async listSavedViewsEntity10(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity10(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-10" }) @Get("saved-views-entity-10/:id") @Permissions("saved-views.savedViewsEntity10.read")
  async getSavedViewsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-10" }) @Post("saved-views-entity-10") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity10.create")
  async createSavedViewsEntity10(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity10(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-10" }) @Put("saved-views-entity-10/:id") @Permissions("saved-views.savedViewsEntity10.update")
  async updateSavedViewsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity10(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-10" }) @Delete("saved-views-entity-10/:id") @Permissions("saved-views.savedViewsEntity10.delete")
  async deleteSavedViewsEntity10(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity10(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-11" }) @Get("saved-views-entity-11") @Permissions("saved-views.savedViewsEntity11.read")
  async listSavedViewsEntity11(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity11(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-11" }) @Get("saved-views-entity-11/:id") @Permissions("saved-views.savedViewsEntity11.read")
  async getSavedViewsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-11" }) @Post("saved-views-entity-11") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity11.create")
  async createSavedViewsEntity11(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity11(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-11" }) @Put("saved-views-entity-11/:id") @Permissions("saved-views.savedViewsEntity11.update")
  async updateSavedViewsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity11(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-11" }) @Delete("saved-views-entity-11/:id") @Permissions("saved-views.savedViewsEntity11.delete")
  async deleteSavedViewsEntity11(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity11(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-12" }) @Get("saved-views-entity-12") @Permissions("saved-views.savedViewsEntity12.read")
  async listSavedViewsEntity12(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity12(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-12" }) @Get("saved-views-entity-12/:id") @Permissions("saved-views.savedViewsEntity12.read")
  async getSavedViewsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-12" }) @Post("saved-views-entity-12") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity12.create")
  async createSavedViewsEntity12(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity12(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-12" }) @Put("saved-views-entity-12/:id") @Permissions("saved-views.savedViewsEntity12.update")
  async updateSavedViewsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity12(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-12" }) @Delete("saved-views-entity-12/:id") @Permissions("saved-views.savedViewsEntity12.delete")
  async deleteSavedViewsEntity12(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity12(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-13" }) @Get("saved-views-entity-13") @Permissions("saved-views.savedViewsEntity13.read")
  async listSavedViewsEntity13(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity13(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-13" }) @Get("saved-views-entity-13/:id") @Permissions("saved-views.savedViewsEntity13.read")
  async getSavedViewsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-13" }) @Post("saved-views-entity-13") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity13.create")
  async createSavedViewsEntity13(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity13(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-13" }) @Put("saved-views-entity-13/:id") @Permissions("saved-views.savedViewsEntity13.update")
  async updateSavedViewsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity13(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-13" }) @Delete("saved-views-entity-13/:id") @Permissions("saved-views.savedViewsEntity13.delete")
  async deleteSavedViewsEntity13(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity13(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-14" }) @Get("saved-views-entity-14") @Permissions("saved-views.savedViewsEntity14.read")
  async listSavedViewsEntity14(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity14(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-14" }) @Get("saved-views-entity-14/:id") @Permissions("saved-views.savedViewsEntity14.read")
  async getSavedViewsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-14" }) @Post("saved-views-entity-14") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity14.create")
  async createSavedViewsEntity14(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity14(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-14" }) @Put("saved-views-entity-14/:id") @Permissions("saved-views.savedViewsEntity14.update")
  async updateSavedViewsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity14(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-14" }) @Delete("saved-views-entity-14/:id") @Permissions("saved-views.savedViewsEntity14.delete")
  async deleteSavedViewsEntity14(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity14(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-15" }) @Get("saved-views-entity-15") @Permissions("saved-views.savedViewsEntity15.read")
  async listSavedViewsEntity15(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity15(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-15" }) @Get("saved-views-entity-15/:id") @Permissions("saved-views.savedViewsEntity15.read")
  async getSavedViewsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-15" }) @Post("saved-views-entity-15") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity15.create")
  async createSavedViewsEntity15(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity15(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-15" }) @Put("saved-views-entity-15/:id") @Permissions("saved-views.savedViewsEntity15.update")
  async updateSavedViewsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity15(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-15" }) @Delete("saved-views-entity-15/:id") @Permissions("saved-views.savedViewsEntity15.delete")
  async deleteSavedViewsEntity15(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity15(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-16" }) @Get("saved-views-entity-16") @Permissions("saved-views.savedViewsEntity16.read")
  async listSavedViewsEntity16(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity16(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-16" }) @Get("saved-views-entity-16/:id") @Permissions("saved-views.savedViewsEntity16.read")
  async getSavedViewsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-16" }) @Post("saved-views-entity-16") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity16.create")
  async createSavedViewsEntity16(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity16(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-16" }) @Put("saved-views-entity-16/:id") @Permissions("saved-views.savedViewsEntity16.update")
  async updateSavedViewsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity16(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-16" }) @Delete("saved-views-entity-16/:id") @Permissions("saved-views.savedViewsEntity16.delete")
  async deleteSavedViewsEntity16(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity16(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-17" }) @Get("saved-views-entity-17") @Permissions("saved-views.savedViewsEntity17.read")
  async listSavedViewsEntity17(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity17(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-17" }) @Get("saved-views-entity-17/:id") @Permissions("saved-views.savedViewsEntity17.read")
  async getSavedViewsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-17" }) @Post("saved-views-entity-17") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity17.create")
  async createSavedViewsEntity17(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity17(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-17" }) @Put("saved-views-entity-17/:id") @Permissions("saved-views.savedViewsEntity17.update")
  async updateSavedViewsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity17(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-17" }) @Delete("saved-views-entity-17/:id") @Permissions("saved-views.savedViewsEntity17.delete")
  async deleteSavedViewsEntity17(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity17(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-18" }) @Get("saved-views-entity-18") @Permissions("saved-views.savedViewsEntity18.read")
  async listSavedViewsEntity18(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity18(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-18" }) @Get("saved-views-entity-18/:id") @Permissions("saved-views.savedViewsEntity18.read")
  async getSavedViewsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-18" }) @Post("saved-views-entity-18") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity18.create")
  async createSavedViewsEntity18(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity18(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-18" }) @Put("saved-views-entity-18/:id") @Permissions("saved-views.savedViewsEntity18.update")
  async updateSavedViewsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity18(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-18" }) @Delete("saved-views-entity-18/:id") @Permissions("saved-views.savedViewsEntity18.delete")
  async deleteSavedViewsEntity18(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity18(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-19" }) @Get("saved-views-entity-19") @Permissions("saved-views.savedViewsEntity19.read")
  async listSavedViewsEntity19(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity19(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-19" }) @Get("saved-views-entity-19/:id") @Permissions("saved-views.savedViewsEntity19.read")
  async getSavedViewsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-19" }) @Post("saved-views-entity-19") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity19.create")
  async createSavedViewsEntity19(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity19(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-19" }) @Put("saved-views-entity-19/:id") @Permissions("saved-views.savedViewsEntity19.update")
  async updateSavedViewsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity19(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-19" }) @Delete("saved-views-entity-19/:id") @Permissions("saved-views.savedViewsEntity19.delete")
  async deleteSavedViewsEntity19(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity19(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-20" }) @Get("saved-views-entity-20") @Permissions("saved-views.savedViewsEntity20.read")
  async listSavedViewsEntity20(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity20(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-20" }) @Get("saved-views-entity-20/:id") @Permissions("saved-views.savedViewsEntity20.read")
  async getSavedViewsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-20" }) @Post("saved-views-entity-20") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity20.create")
  async createSavedViewsEntity20(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity20(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-20" }) @Put("saved-views-entity-20/:id") @Permissions("saved-views.savedViewsEntity20.update")
  async updateSavedViewsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity20(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-20" }) @Delete("saved-views-entity-20/:id") @Permissions("saved-views.savedViewsEntity20.delete")
  async deleteSavedViewsEntity20(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity20(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-21" }) @Get("saved-views-entity-21") @Permissions("saved-views.savedViewsEntity21.read")
  async listSavedViewsEntity21(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity21(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-21" }) @Get("saved-views-entity-21/:id") @Permissions("saved-views.savedViewsEntity21.read")
  async getSavedViewsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-21" }) @Post("saved-views-entity-21") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity21.create")
  async createSavedViewsEntity21(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity21(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-21" }) @Put("saved-views-entity-21/:id") @Permissions("saved-views.savedViewsEntity21.update")
  async updateSavedViewsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity21(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-21" }) @Delete("saved-views-entity-21/:id") @Permissions("saved-views.savedViewsEntity21.delete")
  async deleteSavedViewsEntity21(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity21(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-22" }) @Get("saved-views-entity-22") @Permissions("saved-views.savedViewsEntity22.read")
  async listSavedViewsEntity22(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity22(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-22" }) @Get("saved-views-entity-22/:id") @Permissions("saved-views.savedViewsEntity22.read")
  async getSavedViewsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-22" }) @Post("saved-views-entity-22") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity22.create")
  async createSavedViewsEntity22(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity22(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-22" }) @Put("saved-views-entity-22/:id") @Permissions("saved-views.savedViewsEntity22.update")
  async updateSavedViewsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity22(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-22" }) @Delete("saved-views-entity-22/:id") @Permissions("saved-views.savedViewsEntity22.delete")
  async deleteSavedViewsEntity22(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity22(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-23" }) @Get("saved-views-entity-23") @Permissions("saved-views.savedViewsEntity23.read")
  async listSavedViewsEntity23(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity23(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-23" }) @Get("saved-views-entity-23/:id") @Permissions("saved-views.savedViewsEntity23.read")
  async getSavedViewsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-23" }) @Post("saved-views-entity-23") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity23.create")
  async createSavedViewsEntity23(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity23(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-23" }) @Put("saved-views-entity-23/:id") @Permissions("saved-views.savedViewsEntity23.update")
  async updateSavedViewsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity23(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-23" }) @Delete("saved-views-entity-23/:id") @Permissions("saved-views.savedViewsEntity23.delete")
  async deleteSavedViewsEntity23(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity23(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-24" }) @Get("saved-views-entity-24") @Permissions("saved-views.savedViewsEntity24.read")
  async listSavedViewsEntity24(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity24(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-24" }) @Get("saved-views-entity-24/:id") @Permissions("saved-views.savedViewsEntity24.read")
  async getSavedViewsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-24" }) @Post("saved-views-entity-24") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity24.create")
  async createSavedViewsEntity24(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity24(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-24" }) @Put("saved-views-entity-24/:id") @Permissions("saved-views.savedViewsEntity24.update")
  async updateSavedViewsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity24(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-24" }) @Delete("saved-views-entity-24/:id") @Permissions("saved-views.savedViewsEntity24.delete")
  async deleteSavedViewsEntity24(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity24(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-25" }) @Get("saved-views-entity-25") @Permissions("saved-views.savedViewsEntity25.read")
  async listSavedViewsEntity25(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity25(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-25" }) @Get("saved-views-entity-25/:id") @Permissions("saved-views.savedViewsEntity25.read")
  async getSavedViewsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-25" }) @Post("saved-views-entity-25") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity25.create")
  async createSavedViewsEntity25(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity25(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-25" }) @Put("saved-views-entity-25/:id") @Permissions("saved-views.savedViewsEntity25.update")
  async updateSavedViewsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity25(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-25" }) @Delete("saved-views-entity-25/:id") @Permissions("saved-views.savedViewsEntity25.delete")
  async deleteSavedViewsEntity25(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity25(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-26" }) @Get("saved-views-entity-26") @Permissions("saved-views.savedViewsEntity26.read")
  async listSavedViewsEntity26(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity26(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-26" }) @Get("saved-views-entity-26/:id") @Permissions("saved-views.savedViewsEntity26.read")
  async getSavedViewsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-26" }) @Post("saved-views-entity-26") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity26.create")
  async createSavedViewsEntity26(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity26(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-26" }) @Put("saved-views-entity-26/:id") @Permissions("saved-views.savedViewsEntity26.update")
  async updateSavedViewsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity26(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-26" }) @Delete("saved-views-entity-26/:id") @Permissions("saved-views.savedViewsEntity26.delete")
  async deleteSavedViewsEntity26(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity26(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-27" }) @Get("saved-views-entity-27") @Permissions("saved-views.savedViewsEntity27.read")
  async listSavedViewsEntity27(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity27(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-27" }) @Get("saved-views-entity-27/:id") @Permissions("saved-views.savedViewsEntity27.read")
  async getSavedViewsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-27" }) @Post("saved-views-entity-27") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity27.create")
  async createSavedViewsEntity27(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity27(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-27" }) @Put("saved-views-entity-27/:id") @Permissions("saved-views.savedViewsEntity27.update")
  async updateSavedViewsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity27(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-27" }) @Delete("saved-views-entity-27/:id") @Permissions("saved-views.savedViewsEntity27.delete")
  async deleteSavedViewsEntity27(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity27(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-28" }) @Get("saved-views-entity-28") @Permissions("saved-views.savedViewsEntity28.read")
  async listSavedViewsEntity28(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity28(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-28" }) @Get("saved-views-entity-28/:id") @Permissions("saved-views.savedViewsEntity28.read")
  async getSavedViewsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-28" }) @Post("saved-views-entity-28") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity28.create")
  async createSavedViewsEntity28(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity28(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-28" }) @Put("saved-views-entity-28/:id") @Permissions("saved-views.savedViewsEntity28.update")
  async updateSavedViewsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity28(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-28" }) @Delete("saved-views-entity-28/:id") @Permissions("saved-views.savedViewsEntity28.delete")
  async deleteSavedViewsEntity28(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity28(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-29" }) @Get("saved-views-entity-29") @Permissions("saved-views.savedViewsEntity29.read")
  async listSavedViewsEntity29(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity29(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-29" }) @Get("saved-views-entity-29/:id") @Permissions("saved-views.savedViewsEntity29.read")
  async getSavedViewsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-29" }) @Post("saved-views-entity-29") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity29.create")
  async createSavedViewsEntity29(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity29(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-29" }) @Put("saved-views-entity-29/:id") @Permissions("saved-views.savedViewsEntity29.update")
  async updateSavedViewsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity29(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-29" }) @Delete("saved-views-entity-29/:id") @Permissions("saved-views.savedViewsEntity29.delete")
  async deleteSavedViewsEntity29(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity29(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-30" }) @Get("saved-views-entity-30") @Permissions("saved-views.savedViewsEntity30.read")
  async listSavedViewsEntity30(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity30(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-30" }) @Get("saved-views-entity-30/:id") @Permissions("saved-views.savedViewsEntity30.read")
  async getSavedViewsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-30" }) @Post("saved-views-entity-30") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity30.create")
  async createSavedViewsEntity30(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity30(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-30" }) @Put("saved-views-entity-30/:id") @Permissions("saved-views.savedViewsEntity30.update")
  async updateSavedViewsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity30(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-30" }) @Delete("saved-views-entity-30/:id") @Permissions("saved-views.savedViewsEntity30.delete")
  async deleteSavedViewsEntity30(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity30(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-31" }) @Get("saved-views-entity-31") @Permissions("saved-views.savedViewsEntity31.read")
  async listSavedViewsEntity31(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity31(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-31" }) @Get("saved-views-entity-31/:id") @Permissions("saved-views.savedViewsEntity31.read")
  async getSavedViewsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-31" }) @Post("saved-views-entity-31") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity31.create")
  async createSavedViewsEntity31(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity31(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-31" }) @Put("saved-views-entity-31/:id") @Permissions("saved-views.savedViewsEntity31.update")
  async updateSavedViewsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity31(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-31" }) @Delete("saved-views-entity-31/:id") @Permissions("saved-views.savedViewsEntity31.delete")
  async deleteSavedViewsEntity31(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity31(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-32" }) @Get("saved-views-entity-32") @Permissions("saved-views.savedViewsEntity32.read")
  async listSavedViewsEntity32(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity32(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-32" }) @Get("saved-views-entity-32/:id") @Permissions("saved-views.savedViewsEntity32.read")
  async getSavedViewsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-32" }) @Post("saved-views-entity-32") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity32.create")
  async createSavedViewsEntity32(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity32(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-32" }) @Put("saved-views-entity-32/:id") @Permissions("saved-views.savedViewsEntity32.update")
  async updateSavedViewsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity32(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-32" }) @Delete("saved-views-entity-32/:id") @Permissions("saved-views.savedViewsEntity32.delete")
  async deleteSavedViewsEntity32(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity32(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-33" }) @Get("saved-views-entity-33") @Permissions("saved-views.savedViewsEntity33.read")
  async listSavedViewsEntity33(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity33(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-33" }) @Get("saved-views-entity-33/:id") @Permissions("saved-views.savedViewsEntity33.read")
  async getSavedViewsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-33" }) @Post("saved-views-entity-33") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity33.create")
  async createSavedViewsEntity33(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity33(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-33" }) @Put("saved-views-entity-33/:id") @Permissions("saved-views.savedViewsEntity33.update")
  async updateSavedViewsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity33(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-33" }) @Delete("saved-views-entity-33/:id") @Permissions("saved-views.savedViewsEntity33.delete")
  async deleteSavedViewsEntity33(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity33(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-34" }) @Get("saved-views-entity-34") @Permissions("saved-views.savedViewsEntity34.read")
  async listSavedViewsEntity34(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity34(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-34" }) @Get("saved-views-entity-34/:id") @Permissions("saved-views.savedViewsEntity34.read")
  async getSavedViewsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-34" }) @Post("saved-views-entity-34") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity34.create")
  async createSavedViewsEntity34(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity34(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-34" }) @Put("saved-views-entity-34/:id") @Permissions("saved-views.savedViewsEntity34.update")
  async updateSavedViewsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity34(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-34" }) @Delete("saved-views-entity-34/:id") @Permissions("saved-views.savedViewsEntity34.delete")
  async deleteSavedViewsEntity34(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity34(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-35" }) @Get("saved-views-entity-35") @Permissions("saved-views.savedViewsEntity35.read")
  async listSavedViewsEntity35(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity35(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-35" }) @Get("saved-views-entity-35/:id") @Permissions("saved-views.savedViewsEntity35.read")
  async getSavedViewsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-35" }) @Post("saved-views-entity-35") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity35.create")
  async createSavedViewsEntity35(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity35(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-35" }) @Put("saved-views-entity-35/:id") @Permissions("saved-views.savedViewsEntity35.update")
  async updateSavedViewsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity35(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-35" }) @Delete("saved-views-entity-35/:id") @Permissions("saved-views.savedViewsEntity35.delete")
  async deleteSavedViewsEntity35(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity35(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-36" }) @Get("saved-views-entity-36") @Permissions("saved-views.savedViewsEntity36.read")
  async listSavedViewsEntity36(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity36(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-36" }) @Get("saved-views-entity-36/:id") @Permissions("saved-views.savedViewsEntity36.read")
  async getSavedViewsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-36" }) @Post("saved-views-entity-36") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity36.create")
  async createSavedViewsEntity36(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity36(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-36" }) @Put("saved-views-entity-36/:id") @Permissions("saved-views.savedViewsEntity36.update")
  async updateSavedViewsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity36(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-36" }) @Delete("saved-views-entity-36/:id") @Permissions("saved-views.savedViewsEntity36.delete")
  async deleteSavedViewsEntity36(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity36(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-37" }) @Get("saved-views-entity-37") @Permissions("saved-views.savedViewsEntity37.read")
  async listSavedViewsEntity37(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity37(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-37" }) @Get("saved-views-entity-37/:id") @Permissions("saved-views.savedViewsEntity37.read")
  async getSavedViewsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-37" }) @Post("saved-views-entity-37") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity37.create")
  async createSavedViewsEntity37(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity37(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-37" }) @Put("saved-views-entity-37/:id") @Permissions("saved-views.savedViewsEntity37.update")
  async updateSavedViewsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity37(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-37" }) @Delete("saved-views-entity-37/:id") @Permissions("saved-views.savedViewsEntity37.delete")
  async deleteSavedViewsEntity37(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity37(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-38" }) @Get("saved-views-entity-38") @Permissions("saved-views.savedViewsEntity38.read")
  async listSavedViewsEntity38(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity38(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-38" }) @Get("saved-views-entity-38/:id") @Permissions("saved-views.savedViewsEntity38.read")
  async getSavedViewsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-38" }) @Post("saved-views-entity-38") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity38.create")
  async createSavedViewsEntity38(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity38(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-38" }) @Put("saved-views-entity-38/:id") @Permissions("saved-views.savedViewsEntity38.update")
  async updateSavedViewsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity38(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-38" }) @Delete("saved-views-entity-38/:id") @Permissions("saved-views.savedViewsEntity38.delete")
  async deleteSavedViewsEntity38(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity38(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-39" }) @Get("saved-views-entity-39") @Permissions("saved-views.savedViewsEntity39.read")
  async listSavedViewsEntity39(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity39(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-39" }) @Get("saved-views-entity-39/:id") @Permissions("saved-views.savedViewsEntity39.read")
  async getSavedViewsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-39" }) @Post("saved-views-entity-39") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity39.create")
  async createSavedViewsEntity39(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity39(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-39" }) @Put("saved-views-entity-39/:id") @Permissions("saved-views.savedViewsEntity39.update")
  async updateSavedViewsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity39(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-39" }) @Delete("saved-views-entity-39/:id") @Permissions("saved-views.savedViewsEntity39.delete")
  async deleteSavedViewsEntity39(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity39(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-40" }) @Get("saved-views-entity-40") @Permissions("saved-views.savedViewsEntity40.read")
  async listSavedViewsEntity40(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity40(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-40" }) @Get("saved-views-entity-40/:id") @Permissions("saved-views.savedViewsEntity40.read")
  async getSavedViewsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-40" }) @Post("saved-views-entity-40") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity40.create")
  async createSavedViewsEntity40(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity40(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-40" }) @Put("saved-views-entity-40/:id") @Permissions("saved-views.savedViewsEntity40.update")
  async updateSavedViewsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity40(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-40" }) @Delete("saved-views-entity-40/:id") @Permissions("saved-views.savedViewsEntity40.delete")
  async deleteSavedViewsEntity40(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity40(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-41" }) @Get("saved-views-entity-41") @Permissions("saved-views.savedViewsEntity41.read")
  async listSavedViewsEntity41(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity41(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-41" }) @Get("saved-views-entity-41/:id") @Permissions("saved-views.savedViewsEntity41.read")
  async getSavedViewsEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-41" }) @Post("saved-views-entity-41") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity41.create")
  async createSavedViewsEntity41(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity41(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-41" }) @Put("saved-views-entity-41/:id") @Permissions("saved-views.savedViewsEntity41.update")
  async updateSavedViewsEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity41(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-41" }) @Delete("saved-views-entity-41/:id") @Permissions("saved-views.savedViewsEntity41.delete")
  async deleteSavedViewsEntity41(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity41(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-42" }) @Get("saved-views-entity-42") @Permissions("saved-views.savedViewsEntity42.read")
  async listSavedViewsEntity42(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity42(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-42" }) @Get("saved-views-entity-42/:id") @Permissions("saved-views.savedViewsEntity42.read")
  async getSavedViewsEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-42" }) @Post("saved-views-entity-42") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity42.create")
  async createSavedViewsEntity42(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity42(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-42" }) @Put("saved-views-entity-42/:id") @Permissions("saved-views.savedViewsEntity42.update")
  async updateSavedViewsEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity42(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-42" }) @Delete("saved-views-entity-42/:id") @Permissions("saved-views.savedViewsEntity42.delete")
  async deleteSavedViewsEntity42(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity42(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-43" }) @Get("saved-views-entity-43") @Permissions("saved-views.savedViewsEntity43.read")
  async listSavedViewsEntity43(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity43(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-43" }) @Get("saved-views-entity-43/:id") @Permissions("saved-views.savedViewsEntity43.read")
  async getSavedViewsEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-43" }) @Post("saved-views-entity-43") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity43.create")
  async createSavedViewsEntity43(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity43(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-43" }) @Put("saved-views-entity-43/:id") @Permissions("saved-views.savedViewsEntity43.update")
  async updateSavedViewsEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity43(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-43" }) @Delete("saved-views-entity-43/:id") @Permissions("saved-views.savedViewsEntity43.delete")
  async deleteSavedViewsEntity43(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity43(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-44" }) @Get("saved-views-entity-44") @Permissions("saved-views.savedViewsEntity44.read")
  async listSavedViewsEntity44(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity44(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-44" }) @Get("saved-views-entity-44/:id") @Permissions("saved-views.savedViewsEntity44.read")
  async getSavedViewsEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-44" }) @Post("saved-views-entity-44") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity44.create")
  async createSavedViewsEntity44(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity44(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-44" }) @Put("saved-views-entity-44/:id") @Permissions("saved-views.savedViewsEntity44.update")
  async updateSavedViewsEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity44(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-44" }) @Delete("saved-views-entity-44/:id") @Permissions("saved-views.savedViewsEntity44.delete")
  async deleteSavedViewsEntity44(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity44(req.user.tenantId, id); }

  @ApiOperation({ summary: "List saved-views-entity-45" }) @Get("saved-views-entity-45") @Permissions("saved-views.savedViewsEntity45.read")
  async listSavedViewsEntity45(@Req() req: AuthenticatedRequest) { return this.svc.listSavedViewsEntity45(req.user.tenantId); }

  @ApiOperation({ summary: "Get saved-views-entity-45" }) @Get("saved-views-entity-45/:id") @Permissions("saved-views.savedViewsEntity45.read")
  async getSavedViewsEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.getSavedViewsEntity45(req.user.tenantId, id); }

  @ApiOperation({ summary: "Create saved-views-entity-45" }) @Post("saved-views-entity-45") @HttpCode(HttpStatus.CREATED) @Permissions("saved-views.savedViewsEntity45.create")
  async createSavedViewsEntity45(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.createSavedViewsEntity45(req.user.tenantId, body); }

  @ApiOperation({ summary: "Update saved-views-entity-45" }) @Put("saved-views-entity-45/:id") @Permissions("saved-views.savedViewsEntity45.update")
  async updateSavedViewsEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ name: z.string() })) body: any) { return this.svc.updateSavedViewsEntity45(req.user.tenantId, id, body); }

  @ApiOperation({ summary: "Delete saved-views-entity-45" }) @Delete("saved-views-entity-45/:id") @Permissions("saved-views.savedViewsEntity45.delete")
  async deleteSavedViewsEntity45(@Req() req: AuthenticatedRequest, @Param("id") id: string) { return this.svc.deleteSavedViewsEntity45(req.user.tenantId, id); }

}
