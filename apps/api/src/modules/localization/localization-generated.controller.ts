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
import { LocalizationGeneratedService } from "./localization-generated.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("localization")
@ApiBearerAuth()
@Controller("localization")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class LocalizationGeneratedController {
  constructor(private readonly svc: LocalizationGeneratedService) {}

  @ApiOperation({ summary: "List localization-entity-1" })
  @Get("localization-entity-1")
  @Permissions("localization.localizationEntity1.read")
  async listLocalizationEntity1(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity1(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-1" })
  @Get("localization-entity-1/:id")
  @Permissions("localization.localizationEntity1.read")
  async getLocalizationEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-1" })
  @Post("localization-entity-1")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity1.create")
  async createLocalizationEntity1(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity1(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-1" })
  @Put("localization-entity-1/:id")
  @Permissions("localization.localizationEntity1.update")
  async updateLocalizationEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity1(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-1" })
  @Delete("localization-entity-1/:id")
  @Permissions("localization.localizationEntity1.delete")
  async deleteLocalizationEntity1(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity1(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-2" })
  @Get("localization-entity-2")
  @Permissions("localization.localizationEntity2.read")
  async listLocalizationEntity2(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity2(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-2" })
  @Get("localization-entity-2/:id")
  @Permissions("localization.localizationEntity2.read")
  async getLocalizationEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-2" })
  @Post("localization-entity-2")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity2.create")
  async createLocalizationEntity2(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity2(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-2" })
  @Put("localization-entity-2/:id")
  @Permissions("localization.localizationEntity2.update")
  async updateLocalizationEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity2(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-2" })
  @Delete("localization-entity-2/:id")
  @Permissions("localization.localizationEntity2.delete")
  async deleteLocalizationEntity2(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity2(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-3" })
  @Get("localization-entity-3")
  @Permissions("localization.localizationEntity3.read")
  async listLocalizationEntity3(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity3(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-3" })
  @Get("localization-entity-3/:id")
  @Permissions("localization.localizationEntity3.read")
  async getLocalizationEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-3" })
  @Post("localization-entity-3")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity3.create")
  async createLocalizationEntity3(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity3(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-3" })
  @Put("localization-entity-3/:id")
  @Permissions("localization.localizationEntity3.update")
  async updateLocalizationEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity3(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-3" })
  @Delete("localization-entity-3/:id")
  @Permissions("localization.localizationEntity3.delete")
  async deleteLocalizationEntity3(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity3(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-4" })
  @Get("localization-entity-4")
  @Permissions("localization.localizationEntity4.read")
  async listLocalizationEntity4(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity4(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-4" })
  @Get("localization-entity-4/:id")
  @Permissions("localization.localizationEntity4.read")
  async getLocalizationEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-4" })
  @Post("localization-entity-4")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity4.create")
  async createLocalizationEntity4(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity4(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-4" })
  @Put("localization-entity-4/:id")
  @Permissions("localization.localizationEntity4.update")
  async updateLocalizationEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity4(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-4" })
  @Delete("localization-entity-4/:id")
  @Permissions("localization.localizationEntity4.delete")
  async deleteLocalizationEntity4(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity4(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-5" })
  @Get("localization-entity-5")
  @Permissions("localization.localizationEntity5.read")
  async listLocalizationEntity5(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity5(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-5" })
  @Get("localization-entity-5/:id")
  @Permissions("localization.localizationEntity5.read")
  async getLocalizationEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-5" })
  @Post("localization-entity-5")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity5.create")
  async createLocalizationEntity5(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity5(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-5" })
  @Put("localization-entity-5/:id")
  @Permissions("localization.localizationEntity5.update")
  async updateLocalizationEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity5(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-5" })
  @Delete("localization-entity-5/:id")
  @Permissions("localization.localizationEntity5.delete")
  async deleteLocalizationEntity5(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity5(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-6" })
  @Get("localization-entity-6")
  @Permissions("localization.localizationEntity6.read")
  async listLocalizationEntity6(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity6(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-6" })
  @Get("localization-entity-6/:id")
  @Permissions("localization.localizationEntity6.read")
  async getLocalizationEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-6" })
  @Post("localization-entity-6")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity6.create")
  async createLocalizationEntity6(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity6(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-6" })
  @Put("localization-entity-6/:id")
  @Permissions("localization.localizationEntity6.update")
  async updateLocalizationEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity6(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-6" })
  @Delete("localization-entity-6/:id")
  @Permissions("localization.localizationEntity6.delete")
  async deleteLocalizationEntity6(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity6(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-7" })
  @Get("localization-entity-7")
  @Permissions("localization.localizationEntity7.read")
  async listLocalizationEntity7(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity7(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-7" })
  @Get("localization-entity-7/:id")
  @Permissions("localization.localizationEntity7.read")
  async getLocalizationEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-7" })
  @Post("localization-entity-7")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity7.create")
  async createLocalizationEntity7(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity7(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-7" })
  @Put("localization-entity-7/:id")
  @Permissions("localization.localizationEntity7.update")
  async updateLocalizationEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity7(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-7" })
  @Delete("localization-entity-7/:id")
  @Permissions("localization.localizationEntity7.delete")
  async deleteLocalizationEntity7(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity7(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-8" })
  @Get("localization-entity-8")
  @Permissions("localization.localizationEntity8.read")
  async listLocalizationEntity8(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity8(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-8" })
  @Get("localization-entity-8/:id")
  @Permissions("localization.localizationEntity8.read")
  async getLocalizationEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-8" })
  @Post("localization-entity-8")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity8.create")
  async createLocalizationEntity8(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity8(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-8" })
  @Put("localization-entity-8/:id")
  @Permissions("localization.localizationEntity8.update")
  async updateLocalizationEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity8(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-8" })
  @Delete("localization-entity-8/:id")
  @Permissions("localization.localizationEntity8.delete")
  async deleteLocalizationEntity8(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity8(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-9" })
  @Get("localization-entity-9")
  @Permissions("localization.localizationEntity9.read")
  async listLocalizationEntity9(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity9(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-9" })
  @Get("localization-entity-9/:id")
  @Permissions("localization.localizationEntity9.read")
  async getLocalizationEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-9" })
  @Post("localization-entity-9")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity9.create")
  async createLocalizationEntity9(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity9(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-9" })
  @Put("localization-entity-9/:id")
  @Permissions("localization.localizationEntity9.update")
  async updateLocalizationEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity9(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-9" })
  @Delete("localization-entity-9/:id")
  @Permissions("localization.localizationEntity9.delete")
  async deleteLocalizationEntity9(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity9(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-10" })
  @Get("localization-entity-10")
  @Permissions("localization.localizationEntity10.read")
  async listLocalizationEntity10(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity10(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-10" })
  @Get("localization-entity-10/:id")
  @Permissions("localization.localizationEntity10.read")
  async getLocalizationEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-10" })
  @Post("localization-entity-10")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity10.create")
  async createLocalizationEntity10(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity10(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-10" })
  @Put("localization-entity-10/:id")
  @Permissions("localization.localizationEntity10.update")
  async updateLocalizationEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity10(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-10" })
  @Delete("localization-entity-10/:id")
  @Permissions("localization.localizationEntity10.delete")
  async deleteLocalizationEntity10(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity10(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-11" })
  @Get("localization-entity-11")
  @Permissions("localization.localizationEntity11.read")
  async listLocalizationEntity11(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity11(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-11" })
  @Get("localization-entity-11/:id")
  @Permissions("localization.localizationEntity11.read")
  async getLocalizationEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-11" })
  @Post("localization-entity-11")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity11.create")
  async createLocalizationEntity11(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity11(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-11" })
  @Put("localization-entity-11/:id")
  @Permissions("localization.localizationEntity11.update")
  async updateLocalizationEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity11(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-11" })
  @Delete("localization-entity-11/:id")
  @Permissions("localization.localizationEntity11.delete")
  async deleteLocalizationEntity11(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity11(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-12" })
  @Get("localization-entity-12")
  @Permissions("localization.localizationEntity12.read")
  async listLocalizationEntity12(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity12(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-12" })
  @Get("localization-entity-12/:id")
  @Permissions("localization.localizationEntity12.read")
  async getLocalizationEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-12" })
  @Post("localization-entity-12")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity12.create")
  async createLocalizationEntity12(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity12(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-12" })
  @Put("localization-entity-12/:id")
  @Permissions("localization.localizationEntity12.update")
  async updateLocalizationEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity12(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-12" })
  @Delete("localization-entity-12/:id")
  @Permissions("localization.localizationEntity12.delete")
  async deleteLocalizationEntity12(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity12(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-13" })
  @Get("localization-entity-13")
  @Permissions("localization.localizationEntity13.read")
  async listLocalizationEntity13(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity13(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-13" })
  @Get("localization-entity-13/:id")
  @Permissions("localization.localizationEntity13.read")
  async getLocalizationEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-13" })
  @Post("localization-entity-13")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity13.create")
  async createLocalizationEntity13(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity13(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-13" })
  @Put("localization-entity-13/:id")
  @Permissions("localization.localizationEntity13.update")
  async updateLocalizationEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity13(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-13" })
  @Delete("localization-entity-13/:id")
  @Permissions("localization.localizationEntity13.delete")
  async deleteLocalizationEntity13(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity13(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-14" })
  @Get("localization-entity-14")
  @Permissions("localization.localizationEntity14.read")
  async listLocalizationEntity14(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity14(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-14" })
  @Get("localization-entity-14/:id")
  @Permissions("localization.localizationEntity14.read")
  async getLocalizationEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-14" })
  @Post("localization-entity-14")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity14.create")
  async createLocalizationEntity14(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity14(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-14" })
  @Put("localization-entity-14/:id")
  @Permissions("localization.localizationEntity14.update")
  async updateLocalizationEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity14(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-14" })
  @Delete("localization-entity-14/:id")
  @Permissions("localization.localizationEntity14.delete")
  async deleteLocalizationEntity14(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity14(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-15" })
  @Get("localization-entity-15")
  @Permissions("localization.localizationEntity15.read")
  async listLocalizationEntity15(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity15(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-15" })
  @Get("localization-entity-15/:id")
  @Permissions("localization.localizationEntity15.read")
  async getLocalizationEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-15" })
  @Post("localization-entity-15")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity15.create")
  async createLocalizationEntity15(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity15(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-15" })
  @Put("localization-entity-15/:id")
  @Permissions("localization.localizationEntity15.update")
  async updateLocalizationEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity15(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-15" })
  @Delete("localization-entity-15/:id")
  @Permissions("localization.localizationEntity15.delete")
  async deleteLocalizationEntity15(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity15(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-16" })
  @Get("localization-entity-16")
  @Permissions("localization.localizationEntity16.read")
  async listLocalizationEntity16(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity16(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-16" })
  @Get("localization-entity-16/:id")
  @Permissions("localization.localizationEntity16.read")
  async getLocalizationEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-16" })
  @Post("localization-entity-16")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity16.create")
  async createLocalizationEntity16(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity16(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-16" })
  @Put("localization-entity-16/:id")
  @Permissions("localization.localizationEntity16.update")
  async updateLocalizationEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity16(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-16" })
  @Delete("localization-entity-16/:id")
  @Permissions("localization.localizationEntity16.delete")
  async deleteLocalizationEntity16(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity16(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List localization-entity-17" })
  @Get("localization-entity-17")
  @Permissions("localization.localizationEntity17.read")
  async listLocalizationEntity17(@Req() req: AuthenticatedRequest) {
    return this.svc.listLocalizationEntity17(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get localization-entity-17" })
  @Get("localization-entity-17/:id")
  @Permissions("localization.localizationEntity17.read")
  async getLocalizationEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getLocalizationEntity17(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create localization-entity-17" })
  @Post("localization-entity-17")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("localization.localizationEntity17.create")
  async createLocalizationEntity17(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.createLocalizationEntity17(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Update localization-entity-17" })
  @Put("localization-entity-17/:id")
  @Permissions("localization.localizationEntity17.update")
  async updateLocalizationEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.updateLocalizationEntity17(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete localization-entity-17" })
  @Delete("localization-entity-17/:id")
  @Permissions("localization.localizationEntity17.delete")
  async deleteLocalizationEntity17(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteLocalizationEntity17(req.user.tenantId, id);
  }
}
