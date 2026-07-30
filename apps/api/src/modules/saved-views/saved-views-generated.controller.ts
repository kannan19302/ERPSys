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
import { SavedViewsGeneratedService } from "./saved-views-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("saved-views")
@ApiBearerAuth()
@Controller("saved-views")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SavedViewsGeneratedController {
  constructor(private readonly svc: SavedViewsGeneratedService) {}

  @ApiOperation({ summary: "List saved-views-entity-1" })
  @Get("saved-views-entity-1")
  @Permissions("saved-views.savedViewsEntity1.read")
  async listSavedViewsEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-1" })
  @Get("saved-views-entity-1/:id")
  @Permissions("saved-views.savedViewsEntity1.read")
  async getSavedViewsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-1" })
  @Post("saved-views-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity1.create")
  async createSavedViewsEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-1" })
  @Put("saved-views-entity-1/:id")
  @Permissions("saved-views.savedViewsEntity1.update")
  async updateSavedViewsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-1" })
  @Delete("saved-views-entity-1/:id")
  @Permissions("saved-views.savedViewsEntity1.delete")
  async deleteSavedViewsEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-2" })
  @Get("saved-views-entity-2")
  @Permissions("saved-views.savedViewsEntity2.read")
  async listSavedViewsEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-2" })
  @Get("saved-views-entity-2/:id")
  @Permissions("saved-views.savedViewsEntity2.read")
  async getSavedViewsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-2" })
  @Post("saved-views-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity2.create")
  async createSavedViewsEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-2" })
  @Put("saved-views-entity-2/:id")
  @Permissions("saved-views.savedViewsEntity2.update")
  async updateSavedViewsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-2" })
  @Delete("saved-views-entity-2/:id")
  @Permissions("saved-views.savedViewsEntity2.delete")
  async deleteSavedViewsEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-3" })
  @Get("saved-views-entity-3")
  @Permissions("saved-views.savedViewsEntity3.read")
  async listSavedViewsEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-3" })
  @Get("saved-views-entity-3/:id")
  @Permissions("saved-views.savedViewsEntity3.read")
  async getSavedViewsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-3" })
  @Post("saved-views-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity3.create")
  async createSavedViewsEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-3" })
  @Put("saved-views-entity-3/:id")
  @Permissions("saved-views.savedViewsEntity3.update")
  async updateSavedViewsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-3" })
  @Delete("saved-views-entity-3/:id")
  @Permissions("saved-views.savedViewsEntity3.delete")
  async deleteSavedViewsEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-4" })
  @Get("saved-views-entity-4")
  @Permissions("saved-views.savedViewsEntity4.read")
  async listSavedViewsEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-4" })
  @Get("saved-views-entity-4/:id")
  @Permissions("saved-views.savedViewsEntity4.read")
  async getSavedViewsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-4" })
  @Post("saved-views-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity4.create")
  async createSavedViewsEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-4" })
  @Put("saved-views-entity-4/:id")
  @Permissions("saved-views.savedViewsEntity4.update")
  async updateSavedViewsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-4" })
  @Delete("saved-views-entity-4/:id")
  @Permissions("saved-views.savedViewsEntity4.delete")
  async deleteSavedViewsEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-5" })
  @Get("saved-views-entity-5")
  @Permissions("saved-views.savedViewsEntity5.read")
  async listSavedViewsEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-5" })
  @Get("saved-views-entity-5/:id")
  @Permissions("saved-views.savedViewsEntity5.read")
  async getSavedViewsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-5" })
  @Post("saved-views-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity5.create")
  async createSavedViewsEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-5" })
  @Put("saved-views-entity-5/:id")
  @Permissions("saved-views.savedViewsEntity5.update")
  async updateSavedViewsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-5" })
  @Delete("saved-views-entity-5/:id")
  @Permissions("saved-views.savedViewsEntity5.delete")
  async deleteSavedViewsEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-6" })
  @Get("saved-views-entity-6")
  @Permissions("saved-views.savedViewsEntity6.read")
  async listSavedViewsEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-6" })
  @Get("saved-views-entity-6/:id")
  @Permissions("saved-views.savedViewsEntity6.read")
  async getSavedViewsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-6" })
  @Post("saved-views-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity6.create")
  async createSavedViewsEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-6" })
  @Put("saved-views-entity-6/:id")
  @Permissions("saved-views.savedViewsEntity6.update")
  async updateSavedViewsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-6" })
  @Delete("saved-views-entity-6/:id")
  @Permissions("saved-views.savedViewsEntity6.delete")
  async deleteSavedViewsEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-7" })
  @Get("saved-views-entity-7")
  @Permissions("saved-views.savedViewsEntity7.read")
  async listSavedViewsEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-7" })
  @Get("saved-views-entity-7/:id")
  @Permissions("saved-views.savedViewsEntity7.read")
  async getSavedViewsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-7" })
  @Post("saved-views-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity7.create")
  async createSavedViewsEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-7" })
  @Put("saved-views-entity-7/:id")
  @Permissions("saved-views.savedViewsEntity7.update")
  async updateSavedViewsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-7" })
  @Delete("saved-views-entity-7/:id")
  @Permissions("saved-views.savedViewsEntity7.delete")
  async deleteSavedViewsEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-8" })
  @Get("saved-views-entity-8")
  @Permissions("saved-views.savedViewsEntity8.read")
  async listSavedViewsEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-8" })
  @Get("saved-views-entity-8/:id")
  @Permissions("saved-views.savedViewsEntity8.read")
  async getSavedViewsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-8" })
  @Post("saved-views-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity8.create")
  async createSavedViewsEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-8" })
  @Put("saved-views-entity-8/:id")
  @Permissions("saved-views.savedViewsEntity8.update")
  async updateSavedViewsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-8" })
  @Delete("saved-views-entity-8/:id")
  @Permissions("saved-views.savedViewsEntity8.delete")
  async deleteSavedViewsEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-9" })
  @Get("saved-views-entity-9")
  @Permissions("saved-views.savedViewsEntity9.read")
  async listSavedViewsEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-9" })
  @Get("saved-views-entity-9/:id")
  @Permissions("saved-views.savedViewsEntity9.read")
  async getSavedViewsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-9" })
  @Post("saved-views-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity9.create")
  async createSavedViewsEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-9" })
  @Put("saved-views-entity-9/:id")
  @Permissions("saved-views.savedViewsEntity9.update")
  async updateSavedViewsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-9" })
  @Delete("saved-views-entity-9/:id")
  @Permissions("saved-views.savedViewsEntity9.delete")
  async deleteSavedViewsEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-10" })
  @Get("saved-views-entity-10")
  @Permissions("saved-views.savedViewsEntity10.read")
  async listSavedViewsEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-10" })
  @Get("saved-views-entity-10/:id")
  @Permissions("saved-views.savedViewsEntity10.read")
  async getSavedViewsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-10" })
  @Post("saved-views-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity10.create")
  async createSavedViewsEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-10" })
  @Put("saved-views-entity-10/:id")
  @Permissions("saved-views.savedViewsEntity10.update")
  async updateSavedViewsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-10" })
  @Delete("saved-views-entity-10/:id")
  @Permissions("saved-views.savedViewsEntity10.delete")
  async deleteSavedViewsEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-11" })
  @Get("saved-views-entity-11")
  @Permissions("saved-views.savedViewsEntity11.read")
  async listSavedViewsEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-11" })
  @Get("saved-views-entity-11/:id")
  @Permissions("saved-views.savedViewsEntity11.read")
  async getSavedViewsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-11" })
  @Post("saved-views-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity11.create")
  async createSavedViewsEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-11" })
  @Put("saved-views-entity-11/:id")
  @Permissions("saved-views.savedViewsEntity11.update")
  async updateSavedViewsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-11" })
  @Delete("saved-views-entity-11/:id")
  @Permissions("saved-views.savedViewsEntity11.delete")
  async deleteSavedViewsEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-12" })
  @Get("saved-views-entity-12")
  @Permissions("saved-views.savedViewsEntity12.read")
  async listSavedViewsEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-12" })
  @Get("saved-views-entity-12/:id")
  @Permissions("saved-views.savedViewsEntity12.read")
  async getSavedViewsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-12" })
  @Post("saved-views-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity12.create")
  async createSavedViewsEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-12" })
  @Put("saved-views-entity-12/:id")
  @Permissions("saved-views.savedViewsEntity12.update")
  async updateSavedViewsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-12" })
  @Delete("saved-views-entity-12/:id")
  @Permissions("saved-views.savedViewsEntity12.delete")
  async deleteSavedViewsEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-13" })
  @Get("saved-views-entity-13")
  @Permissions("saved-views.savedViewsEntity13.read")
  async listSavedViewsEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-13" })
  @Get("saved-views-entity-13/:id")
  @Permissions("saved-views.savedViewsEntity13.read")
  async getSavedViewsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-13" })
  @Post("saved-views-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity13.create")
  async createSavedViewsEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-13" })
  @Put("saved-views-entity-13/:id")
  @Permissions("saved-views.savedViewsEntity13.update")
  async updateSavedViewsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-13" })
  @Delete("saved-views-entity-13/:id")
  @Permissions("saved-views.savedViewsEntity13.delete")
  async deleteSavedViewsEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-14" })
  @Get("saved-views-entity-14")
  @Permissions("saved-views.savedViewsEntity14.read")
  async listSavedViewsEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-14" })
  @Get("saved-views-entity-14/:id")
  @Permissions("saved-views.savedViewsEntity14.read")
  async getSavedViewsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-14" })
  @Post("saved-views-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity14.create")
  async createSavedViewsEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-14" })
  @Put("saved-views-entity-14/:id")
  @Permissions("saved-views.savedViewsEntity14.update")
  async updateSavedViewsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-14" })
  @Delete("saved-views-entity-14/:id")
  @Permissions("saved-views.savedViewsEntity14.delete")
  async deleteSavedViewsEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-15" })
  @Get("saved-views-entity-15")
  @Permissions("saved-views.savedViewsEntity15.read")
  async listSavedViewsEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-15" })
  @Get("saved-views-entity-15/:id")
  @Permissions("saved-views.savedViewsEntity15.read")
  async getSavedViewsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-15" })
  @Post("saved-views-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity15.create")
  async createSavedViewsEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-15" })
  @Put("saved-views-entity-15/:id")
  @Permissions("saved-views.savedViewsEntity15.update")
  async updateSavedViewsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-15" })
  @Delete("saved-views-entity-15/:id")
  @Permissions("saved-views.savedViewsEntity15.delete")
  async deleteSavedViewsEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-16" })
  @Get("saved-views-entity-16")
  @Permissions("saved-views.savedViewsEntity16.read")
  async listSavedViewsEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-16" })
  @Get("saved-views-entity-16/:id")
  @Permissions("saved-views.savedViewsEntity16.read")
  async getSavedViewsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-16" })
  @Post("saved-views-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity16.create")
  async createSavedViewsEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-16" })
  @Put("saved-views-entity-16/:id")
  @Permissions("saved-views.savedViewsEntity16.update")
  async updateSavedViewsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-16" })
  @Delete("saved-views-entity-16/:id")
  @Permissions("saved-views.savedViewsEntity16.delete")
  async deleteSavedViewsEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-17" })
  @Get("saved-views-entity-17")
  @Permissions("saved-views.savedViewsEntity17.read")
  async listSavedViewsEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-17" })
  @Get("saved-views-entity-17/:id")
  @Permissions("saved-views.savedViewsEntity17.read")
  async getSavedViewsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-17" })
  @Post("saved-views-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity17.create")
  async createSavedViewsEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-17" })
  @Put("saved-views-entity-17/:id")
  @Permissions("saved-views.savedViewsEntity17.update")
  async updateSavedViewsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-17" })
  @Delete("saved-views-entity-17/:id")
  @Permissions("saved-views.savedViewsEntity17.delete")
  async deleteSavedViewsEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-18" })
  @Get("saved-views-entity-18")
  @Permissions("saved-views.savedViewsEntity18.read")
  async listSavedViewsEntity18(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity18(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-18" })
  @Get("saved-views-entity-18/:id")
  @Permissions("saved-views.savedViewsEntity18.read")
  async getSavedViewsEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-18" })
  @Post("saved-views-entity-18")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity18.create")
  async createSavedViewsEntity18(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity18(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-18" })
  @Put("saved-views-entity-18/:id")
  @Permissions("saved-views.savedViewsEntity18.update")
  async updateSavedViewsEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity18(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-18" })
  @Delete("saved-views-entity-18/:id")
  @Permissions("saved-views.savedViewsEntity18.delete")
  async deleteSavedViewsEntity18(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity18(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-19" })
  @Get("saved-views-entity-19")
  @Permissions("saved-views.savedViewsEntity19.read")
  async listSavedViewsEntity19(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity19(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-19" })
  @Get("saved-views-entity-19/:id")
  @Permissions("saved-views.savedViewsEntity19.read")
  async getSavedViewsEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-19" })
  @Post("saved-views-entity-19")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity19.create")
  async createSavedViewsEntity19(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity19(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-19" })
  @Put("saved-views-entity-19/:id")
  @Permissions("saved-views.savedViewsEntity19.update")
  async updateSavedViewsEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity19(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-19" })
  @Delete("saved-views-entity-19/:id")
  @Permissions("saved-views.savedViewsEntity19.delete")
  async deleteSavedViewsEntity19(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity19(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-20" })
  @Get("saved-views-entity-20")
  @Permissions("saved-views.savedViewsEntity20.read")
  async listSavedViewsEntity20(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity20(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-20" })
  @Get("saved-views-entity-20/:id")
  @Permissions("saved-views.savedViewsEntity20.read")
  async getSavedViewsEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-20" })
  @Post("saved-views-entity-20")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity20.create")
  async createSavedViewsEntity20(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity20(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-20" })
  @Put("saved-views-entity-20/:id")
  @Permissions("saved-views.savedViewsEntity20.update")
  async updateSavedViewsEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity20(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-20" })
  @Delete("saved-views-entity-20/:id")
  @Permissions("saved-views.savedViewsEntity20.delete")
  async deleteSavedViewsEntity20(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity20(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List saved-views-entity-21" })
  @Get("saved-views-entity-21")
  @Permissions("saved-views.savedViewsEntity21.read")
  async listSavedViewsEntity21(@Req() req: AuthenticatedRequest) {
    return this.svc.listSavedViewsEntity21(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get saved-views-entity-21" })
  @Get("saved-views-entity-21/:id")
  @Permissions("saved-views.savedViewsEntity21.read")
  async getSavedViewsEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedViewsEntity21(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create saved-views-entity-21" })
  @Post("saved-views-entity-21")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("saved-views.savedViewsEntity21.create")
  async createSavedViewsEntity21(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createSavedViewsEntity21(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update saved-views-entity-21" })
  @Put("saved-views-entity-21/:id")
  @Permissions("saved-views.savedViewsEntity21.update")
  async updateSavedViewsEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateSavedViewsEntity21(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete saved-views-entity-21" })
  @Delete("saved-views-entity-21/:id")
  @Permissions("saved-views.savedViewsEntity21.delete")
  async deleteSavedViewsEntity21(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedViewsEntity21(req.user.tenantId, id);
  }
}
